 
import { extractEmail, generateRandomId } from './commonUtils.js';
import { getOrCreateMailboxId, getMailboxIdByAddress, recordSentEmail, updateSentEmail, toggleMailboxPin, 
  listUsersWithCounts, createUser, updateUser, deleteUser, assignMailboxToUser, getUserMailboxes, unassignMailboxFromUser, 
  checkMailboxOwnership, getTotalMailboxCount, cleanupOldMessages, isSenderBlocked, listBlockedSenders, addBlockedSender, deleteBlockedSender, setMessagePinned } from './database.js';
import { checkCustomRateLimit } from './rateLimit.js';
import { parseEmailBody, extractVerificationCode, extractLoginLink } from './emailParser.js';
import { sendEmailWithAutoResend, sendBatchWithAutoResend, getEmailFromResend, updateEmailInResend, cancelEmailInResend } from './emailSender.js';
import { sendTelegramMessage } from './telegram.js';
import logger from './logger.js';

function escapeHtml(str) {
  const s = String(str || '');
  return s.replace(/[&<>]/g, function(ch) {
    if (ch === '&') {
      return '&amp;';
    }
    if (ch === '<') {
      return '&lt;';
    }
    if (ch === '>') {
      return '&gt;';
    }
    return ch;
  });
}

/**
 * 处理API请求
 * @param {Request} request - 请求对象
 * @param {object} db - 数据库对象
 * @param {string|string[]} mailDomains - 邮箱域名
 * @param {object} options - 配置选项
 * @returns {Promise<Response>} 响应对象
 */
export async function handleApiRequest(request, db, mailDomains, options = { resendApiKey: '', adminName: '', r2: null, authPayload: null, mailboxOnly: false, env: null }) {
  const logId = logger.generateLogId ? logger.generateLogId() : `api-${Date.now()}`;
  const url = new URL(request.url);
  const path = url.pathname;
  const isMailboxOnly = !!options.mailboxOnly;
  const RESEND_API_KEY = options.resendApiKey || '';

  // 记录API请求开始
  logger.info('API请求开始', {
    method: request.method,
    path: path,
    query: Object.fromEntries(url.searchParams),
    isMailboxOnly: isMailboxOnly
  }, logId);

  const env = options?.env || {};

  // 邮箱用户只能访问特定的API端点和自己的数据
  if (isMailboxOnly) {
    const payload = getJwtPayload();
    const mailboxAddress = payload?.mailboxAddress;
    const mailboxId = payload?.mailboxId;
    
    // 允许的API端点
    const allowedPaths = ['/api/emails', '/api/email/', '/api/auth', '/api/quota', '/api/mailbox/password'];
    const isAllowedPath = allowedPaths.some(allowedPath => path.startsWith(allowedPath));
    
    if (!isAllowedPath) {
      logger.warn('邮箱用户访问被拒绝', {
        path: path,
        mailboxAddress: mailboxAddress
      }, logId);
      return new Response('访问被拒绝', { status: 403 });
    }
    
    // 对于邮件相关API，限制只能访问自己的邮箱
    if (path === '/api/emails' && request.method === 'GET') {
      const requestedMailbox = url.searchParams.get('mailbox');
      if (requestedMailbox && requestedMailbox.toLowerCase() !== mailboxAddress?.toLowerCase()) {
        logger.warn('邮箱用户尝试访问他人邮箱', {
          requestedMailbox: requestedMailbox,
          userMailbox: mailboxAddress
        }, logId);
        return new Response('只能访问自己的邮箱', { status: 403 });
      }
      // 如果没有指定邮箱，自动设置为用户自己的邮箱
      if (!requestedMailbox && mailboxAddress) {
        url.searchParams.set('mailbox', mailboxAddress);
      }
    }
    
    // 对于单个邮件操作，验证邮件是否属于该用户的邮箱
    if (path.startsWith('/api/email/') && mailboxId) {
      const emailId = path.split('/')[3];
      if (emailId && emailId !== 'batch') {
        try {
          const { results } = await db.prepare('SELECT mailbox_id FROM messages WHERE id = ? LIMIT 1').bind(emailId).all();
          if (!results || results.length === 0) {
            logger.warn('邮件不存在', { emailId: emailId }, logId);
            return new Response('邮件不存在', { status: 404 });
          }
          if (results[0].mailbox_id !== mailboxId) {
            logger.warn('邮箱用户无权访问他人邮件', {
              emailId: emailId,
              userMailboxId: mailboxId,
              actualMailboxId: results[0].mailbox_id
            }, logId);
            return new Response('无权访问此邮件', { status: 403 });
          }
        } catch (e) {
          logger.error('邮件权限验证失败', e, { emailId: emailId }, logId);
          return new Response('验证失败', { status: 500 });
        }
      }
    }
  }

  function getJwtPayload() {
    // 优先使用服务端传入的已解析身份（支持 __root__ 超管）
    if (options && options.authPayload) {return options.authPayload;}
    try {
      const cookie = request.headers.get('Cookie') || '';
      const token = (cookie.split(';').find(s=>s.trim().startsWith('iding-session=')) || '').split('=')[1] || '';
      const parts = token.split('.');
      if (parts.length === 3) {
        const json = atob(parts[1].replace(/-/g,'+').replace(/_/g,'/'));
        return JSON.parse(json);
      }
    } catch (err) { void err; }
    return null;
  }
  function isStrictAdmin() {
    const p = getJwtPayload();
    if (!p) {return false;}
    if (p.role !== 'admin') {return false;}
    // __root__（根管理员）视为严格管理员
    if (String(p.username || '') === '__root__') {return true;}
    if (options?.adminName) { return String(p.username || '').toLowerCase() === String(options.adminName || '').toLowerCase(); }
    return true;
  }
  
  async function sha256Hex(text) {
    const enc = new TextEncoder();
    const data = enc.encode(String(text || ''));
    const digest = await crypto.subtle.digest('SHA-256', data);
    const bytes = new Uint8Array(digest);
    let out = '';
    for (let i = 0; i < bytes.length; i++) {out += bytes[i].toString(16).padStart(2, '0');}
    return out;
  }

  // 返回域名列表给前端
  if (path === '/api/domains' && request.method === 'GET') {
    const domains = Array.isArray(mailDomains) ? mailDomains : [(mailDomains || 'temp.example.com')];
    logger.info({ logId, action: 'get_domains', result: { count: domains.length } });
    return Response.json(domains);
  }

  if (path === '/api/telegram/status' && request.method === 'GET') {
    try {
      const payload = options?.authPayload || getJwtPayload();
      if (!payload) {
        return new Response('未登录', { status: 401 });
      }
      const role = payload.role || 'user';
      if (role !== 'admin' && role !== 'guest') {
        return new Response('Forbidden', { status: 403 });
      }
      const token = env.TELEGRAM_BOT_TOKEN || '';
      if (!token) {
        return Response.json({ enabled: false, reason: 'TELEGRAM_BOT_TOKEN 未配置' });
      }
      const apiUrl = `https://api.telegram.org/bot${token}/getWebhookInfo`;
      let info;
      try {
        const resp = await fetch(apiUrl);
        if (!resp.ok) {
          const text = await resp.text().catch(() => '');
          logger.error({ logId, action: 'telegram_get_webhook_info', status: resp.status, body: text });
          return Response.json({ enabled: true, ok: false, error: `Telegram API HTTP ${resp.status}`, raw: text });
        }
        info = await resp.json();
      } catch (e) {
        logger.error({ logId, action: 'telegram_get_webhook_info', error: e.message, stack: e.stack });
        return Response.json({ enabled: true, ok: false, error: String(e?.message || e) });
      }
      const result = info && info.result ? info.result : {};
      const currentUrl = result.url || '';
      const origin = new URL(request.url).origin;
      const recommendedUrl = new URL('/telegram/webhook', origin).toString();
      const lastErrorDate = result.last_error_date || null;
      const ok = !!currentUrl && !lastErrorDate;
      return Response.json({
        enabled: true,
        ok,
        url: currentUrl,
        pendingUpdateCount: result.pending_update_count || 0,
        lastErrorDate,
        lastErrorMessage: result.last_error_message || null,
        ipAddress: result.ip_address || '',
        hasCustomCertificate: !!result.has_custom_certificate,
        maxConnections: result.max_connections || null,
        allowedUpdates: result.allowed_updates || null,
        recommendedUrl
      });
    } catch (e) {
      logger.error({ logId, action: 'telegram_status', error: e.message, stack: e.stack });
      return new Response('查询失败', { status: 500 });
    }
  }

  if (path === '/api/generate') {
    const lengthParam = Number(url.searchParams.get('length') || 0);
    const randomId = generateRandomId(lengthParam || undefined);
    const domains = Array.isArray(mailDomains) ? mailDomains : [(mailDomains || 'temp.example.com')];
    const domainIdx = Math.max(0, Math.min(domains.length - 1, Number(url.searchParams.get('domainIndex') || 0)));
    const chosenDomain = domains[domainIdx] || domains[0];
    const email = `${randomId}@${chosenDomain}`;
    
    logger.info({ logId, action: 'generate_email', params: { length: lengthParam, domainIndex: domainIdx, chosenDomain } });
    
    // 访客模式不写入历史
    let userId;
    try {
      const payload = getJwtPayload();
      userId = payload?.userId;
      if (userId) {
        // 用户已登录：检查配额并创建邮箱
        const { getCachedUserQuota } = await import('./cacheHelper.js');
        const quota = await getCachedUserQuota(db, userId);
        if (quota.used >= quota.limit) {
          logger.warn({ logId, action: 'generate_email', error: 'quota_exceeded', userId, quota });
          return new Response('已达到邮箱创建上限', { status: 429 });
        }
        // 创建并分配邮箱
        await assignMailboxToUser(db, { userId, address: email });
        logger.info({ logId, action: 'generate_email', result: { userId, email, quotaUsed: quota.used + 1 } });
      } else {
        // 访客模式：直接创建邮箱（不分配）
        await getOrCreateMailboxId(db, email);
        logger.info({ logId, action: 'generate_email', result: { anonymous: true, email } });
      }
    } catch (e) {
      // 如果是邮箱上限错误，返回更明确的提示
      if (String(e?.message || '').includes('已达到邮箱上限')) {
        logger.warn({ logId, action: 'generate_email', error: 'quota_exceeded', message: e.message });
        return new Response('已达到邮箱创建上限', { status: 429 });
      }
      logger.error({ logId, action: 'generate_email', error: e.message, stack: e.stack });
      return new Response(String(e?.message || '生成失败'), { status: 400 });
    }
    return Response.json({ email, expires: Date.now() + 3600000 });
  }

  // ================= 用户管理接口（仅非演示模式） =================
  if (path === '/api/users' && request.method === 'GET') {
    if (!isStrictAdmin()) {
      logger.warn({ logId, action: 'get_users', status: 'forbidden', message: '非严格管理员尝试访问用户列表' });
      return new Response('Forbidden', { status: 403 });
    }
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);
    const sort = url.searchParams.get('sort') || 'desc';
    logger.info({ logId, action: 'get_users', params: { limit, offset, sort } });
    try {
      const users = await listUsersWithCounts(db, { limit, offset, sort });
      logger.info({ logId, action: 'get_users', result: { count: users.length } });
      return Response.json(users);
    } catch (e) { 
      logger.error({ logId, action: 'get_users', error: e.message, stack: e.stack });
      return new Response('查询失败', { status: 500 }); 
    }
  }

  if (path === '/api/users' && request.method === 'POST') {
    if (!isStrictAdmin()) {
      logger.warn({ logId, action: 'create_user', status: 'forbidden', message: '非严格管理员尝试创建用户' });
      return new Response('Forbidden', { status: 403 });
    }
    try {
      const body = await request.json();
      const username = String(body.username || '').trim();
      const role = (body.role || 'user') === 'admin' ? 'admin' : 'user';
      const mailboxLimit = Number(body.mailboxLimit || 10);
      const password = String(body.password || '').trim();
      
      if (!username) {
        logger.warn({ logId, action: 'create_user', status: 'bad_request', message: '用户名不能为空' });
        return new Response('用户名不能为空', { status: 400 });
      }
      
      logger.info({ logId, action: 'create_user', params: { username, role, mailboxLimit, hasPassword: !!password } });
      
      let passwordHash = null;
      if (password) { passwordHash = await sha256Hex(password); }
      const user = await createUser(db, { username, passwordHash, role, mailboxLimit });
      logger.info({ logId, action: 'create_user', result: { userId: user.id, username: user.username } });
      return Response.json(user);
    } catch (e) { 
      logger.error({ logId, action: 'create_user', error: e.message, stack: e.stack });
      return new Response('创建失败: ' + (e?.message || e), { status: 500 }); 
    }
  }

  if (request.method === 'PATCH' && path.startsWith('/api/users/')) {
    if (!isStrictAdmin()) {
      logger.warn({ logId, action: 'update_user', status: 'forbidden', message: '非严格管理员尝试更新用户' });
      return new Response('Forbidden', { status: 403 });
    }
    const id = Number(path.split('/')[3]);
    if (!id) {
      logger.warn({ logId, action: 'update_user', status: 'bad_request', message: '无效的用户ID' });
      return new Response('无效ID', { status: 400 });
    }
    try {
      const body = await request.json();
      const fields = {};
      if (typeof body.mailboxLimit !== 'undefined') {fields.mailbox_limit = Math.max(0, Number(body.mailboxLimit));}
      if (typeof body.role === 'string') {fields.role = (body.role === 'admin' ? 'admin' : 'user');}
      if (typeof body.can_send !== 'undefined') {fields.can_send = body.can_send ? 1 : 0;}
      if (typeof body.password === 'string' && body.password) { fields.password_hash = await sha256Hex(String(body.password)); }
      if (typeof body.telegram_chat_id === 'string') {fields.telegram_chat_id = body.telegram_chat_id.trim() || null;}
      if (typeof body.telegram_username === 'string') {fields.telegram_username = body.telegram_username.trim() || null;}
      
      logger.info({ logId, action: 'update_user', params: { userId: id, fields } });
      
      await updateUser(db, id, fields);
      logger.info({ logId, action: 'update_user', result: { userId: id, success: true } });
      return Response.json({ success: true });
    } catch (e) { 
      logger.error({ logId, action: 'update_user', error: e.message, stack: e.stack, userId: id });
      return new Response('更新失败: ' + (e?.message || e), { status: 500 }); 
    }
  }

  if (path === '/api/user/telegram' && request.method === 'GET') {
    try {
      const payload = getJwtPayload();
      const uid = Number(payload?.userId || 0);
      if (!uid) {
        return new Response('未登录', { status: 401 });
      }
      const { results } = await db.prepare('SELECT telegram_chat_id, telegram_username FROM users WHERE id = ? LIMIT 1').bind(uid).all();
      const row = (results && results.length) ? results[0] : {};
      return Response.json({
        telegram_chat_id: row.telegram_chat_id || null,
        telegram_username: row.telegram_username || null
      });
    } catch (e) {
      logger.error({ logId, action: 'get_user_telegram', error: e.message, stack: e.stack });
      return new Response('查询失败', { status: 500 });
    }
  }

  if (path === '/api/user/telegram' && request.method === 'POST') {
    try {
      const payload = getJwtPayload();
      const uid = Number(payload?.userId || 0);
      if (!uid) {
        return new Response('未登录', { status: 401 });
      }
      if (payload?.role === 'guest') {
        return new Response('演示账户无权修改设置', { status: 403 });
      }
      const body = await request.json();
      const chatId = String(body.telegram_chat_id || '').trim();
      const username = String(body.telegram_username || '').trim();
      await updateUser(db, uid, {
        telegram_chat_id: chatId || null,
        telegram_username: username || null
      });
      logger.info({ logId, action: 'update_user_telegram', result: { userId: uid, chatId, username } });
      return Response.json({ success: true });
    } catch (e) {
      logger.error({ logId, action: 'update_user_telegram', error: e.message, stack: e.stack });
      return new Response('更新失败', { status: 500 });
    }
  }

  if (request.method === 'DELETE' && path.startsWith('/api/users/')) {
    if (!isStrictAdmin()) {
      logger.warn({ logId, action: 'delete_user', status: 'forbidden', message: '非严格管理员尝试删除用户' });
      return new Response('Forbidden', { status: 403 });
    }
    const id = Number(path.split('/')[3]);
    if (!id) {
      logger.warn({ logId, action: 'delete_user', status: 'bad_request', message: '无效的用户ID' });
      return new Response('无效ID', { status: 400 });
    }
    logger.info({ logId, action: 'delete_user', params: { userId: id } });
    try { 
      await deleteUser(db, id); 
      logger.info({ logId, action: 'delete_user', result: { userId: id, success: true } });
      return Response.json({ success: true });
    }
    catch (e) { 
      logger.error({ logId, action: 'delete_user', error: e.message, stack: e.stack, userId: id });
      return new Response('删除失败: ' + (e?.message || e), { status: 500 }); 
    }
  }

  if (path === '/api/users/assign' && request.method === 'POST') {
    if (!isStrictAdmin()) {
      logger.warn({ logId, action: 'assign_mailbox', status: 'forbidden', message: '非严格管理员尝试分配邮箱' });
      return new Response('Forbidden', { status: 403 });
    }
    try {
      const body = await request.json();
      const username = String(body.username || '').trim();
      const address = String(body.address || '').trim().toLowerCase();
      if (!username || !address) {
        logger.warn({ logId, action: 'assign_mailbox', status: 'bad_request', message: '参数不完整', params: { username, address } });
        return new Response('参数不完整', { status: 400 });
      }
      logger.info({ logId, action: 'assign_mailbox', params: { username, address } });
      const result = await assignMailboxToUser(db, { username, address });
      logger.info({ logId, action: 'assign_mailbox', result: { username, address, success: true } });
      return Response.json(result);
    } catch (e) { 
      logger.error({ logId, action: 'assign_mailbox', error: e.message, stack: e.stack });
      return new Response('分配失败: ' + (e?.message || e), { status: 500 }); 
    }
  }

  if (path === '/api/users/unassign' && request.method === 'POST') {
    if (!isStrictAdmin()) {
      logger.warn({ logId, action: 'unassign_mailbox', status: 'forbidden', message: '非严格管理员尝试取消分配邮箱' });
      return new Response('Forbidden', { status: 403 });
    }
    try {
      const body = await request.json();
      const username = String(body.username || '').trim();
      const address = String(body.address || '').trim().toLowerCase();
      if (!username || !address) {
        logger.warn({ logId, action: 'unassign_mailbox', status: 'bad_request', message: '参数不完整', params: { username, address } });
        return new Response('参数不完整', { status: 400 });
      }
      logger.info({ logId, action: 'unassign_mailbox', params: { username, address } });
      const result = await unassignMailboxFromUser(db, { username, address });
      logger.info({ logId, action: 'unassign_mailbox', result: { username, address, success: true } });
      return Response.json(result);
    } catch (e) { 
      logger.error({ logId, action: 'unassign_mailbox', error: e.message, stack: e.stack });
      return new Response('取消分配失败: ' + (e?.message || e), { status: 500 }); 
    }
  }

  if (request.method === 'GET' && path.startsWith('/api/users/') && path.endsWith('/mailboxes')) {
    const id = Number(path.split('/')[3]);
    if (!id) {
      logger.warn({ logId, action: 'get_user_mailboxes', error: 'invalid_id', userId: id });
      return new Response('无效ID', { status: 400 });
    }
    logger.info({ logId, action: 'get_user_mailboxes', params: { userId: id } });
    try { 
      const list = await getUserMailboxes(db, id); 
      logger.info({ logId, action: 'get_user_mailboxes', result: { userId: id, count: list?.length || 0 } });
      return Response.json(list || []); 
    }
    catch (e) { 
      logger.error({ logId, action: 'get_user_mailboxes', error: e.message, stack: e.stack, userId: id });
      return new Response('查询失败', { status: 500 }); 
    }
  }

  // 自定义创建邮箱：{ local, domainIndex }
  if (path === '/api/create' && request.method === 'POST') {
    try {
      const body = await request.json();
      const local = String(body.local || '').trim().toLowerCase();
      const valid = /^[a-z0-9._-]{1,64}$/i.test(local);
      if (!valid) {
        logger.warn({ logId, action: 'create_custom_mailbox', status: 'bad_request', message: '非法用户名', local });
        return new Response('非法用户名', { status: 400 });
      }
      const domains = Array.isArray(mailDomains) ? mailDomains : [(mailDomains || 'temp.example.com')];
      const domainIdx = Math.max(0, Math.min(domains.length - 1, Number(body.domainIndex || 0)));
      const chosenDomain = domains[domainIdx] || domains[0];
      const email = `${local}@${chosenDomain}`;
      
      logger.info({ logId, action: 'create_custom_mailbox', params: { local, domainIdx, email } });
      
      let userId;
      try {
        const payload = getJwtPayload();
        userId = payload?.userId;
        
        // 检查邮箱是否已存在以及权限
        const ownership = await checkMailboxOwnership(db, email, userId);
        
        if (ownership.exists) {
          // 如果邮箱已存在，所有用户（包括超级管理员）都不允许创建
          if (userId && ownership.ownedByUser) {
            logger.warn({ logId, action: 'create_custom_mailbox', status: 'conflict', message: '用户尝试重复创建已拥有的邮箱', userId, email });
            return new Response('邮箱地址已存在，使用其他地址', { status: 409 });
          } else if (userId && !ownership.ownedByUser) {
            logger.warn({ logId, action: 'create_custom_mailbox', status: 'conflict', message: '普通用户尝试创建已存在但不属于自己的邮箱', userId, email });
            return new Response('邮箱地址已被占用，请向管理员申请或使用其他地址', { status: 409 });
          } else {
            logger.warn({ logId, action: 'create_custom_mailbox', status: 'conflict', message: '超级管理员尝试创建已存在的邮箱', email });
            return new Response('邮箱地址已存在，使用其他地址', { status: 409 });
          }
        }
        
        // 邮箱不存在，可以创建
        if (userId) {
          // 普通用户：通过assignMailboxToUser创建并分配
          logger.info({ logId, action: 'create_custom_mailbox', message: '普通用户创建邮箱', userId, email });
          await assignMailboxToUser(db, { userId: userId, address: email });
          logger.info({ logId, action: 'create_custom_mailbox', result: { userId, email, success: true } });
          return Response.json({ email, expires: Date.now() + 3600000 });
        } else {
          // 超级管理员：直接创建邮箱
          logger.info({ logId, action: 'create_custom_mailbox', message: '超级管理员创建邮箱', email });
          await getOrCreateMailboxId(db, email);
          logger.info({ logId, action: 'create_custom_mailbox', result: { email, success: true } });
          return Response.json({ email, expires: Date.now() + 3600000 });
        }
      } catch (e) { 
        // 如果是邮箱上限错误，返回更明确的提示
        if (String(e?.message || '').includes('已达到邮箱上限')) {
          logger.warn({ logId, action: 'create_custom_mailbox', status: 'quota_exceeded', message: '用户达到邮箱上限', userId, error: e.message });
          return new Response('已达到邮箱创建上限', { status: 429 });
        }
        logger.error({ logId, action: 'create_custom_mailbox', error: e.message, stack: e.stack, email });
        return new Response(String(e?.message || '创建失败'), { status: 400 }); 
      }
    } catch (e) { 
      logger.error({ logId, action: 'create_custom_mailbox', error: e.message, stack: e.stack });
      return new Response('创建失败', { status: 500 }); 
    }
  }

  // 当前用户配额：已用/上限
  if (path === '/api/user/quota' && request.method === 'GET') {
    try {
      const payload = getJwtPayload();
      const uid = Number(payload?.userId || 0);
      const role = payload?.role || 'user';
      const username = String(payload?.username || '').trim().toLowerCase();
      const adminName = String(options.adminName || 'admin').trim().toLowerCase();
      
      logger.info({ logId, action: 'get_user_quota', params: { userId: uid, role, username } });
      
      // 检查是否为超级管理员
      const isSuperAdmin = (role === 'admin' && (username === adminName || username === '__root__'));
      
      if (isSuperAdmin) {
        // 超级管理员：显示系统中所有邮箱的总数
        const totalUsed = await getTotalMailboxCount(db);
        logger.info({ logId, action: 'get_user_quota', result: { isSuperAdmin: true, totalUsed } });
        return Response.json({ used: totalUsed, limit: 999999, isAdmin: true });
      } else if (uid) {
        // 普通用户：使用缓存查询个人邮箱数和上限
        const { getCachedUserQuota } = await import('./cacheHelper.js');
        const quota = await getCachedUserQuota(db, uid);
        logger.info({ logId, action: 'get_user_quota', result: { userId: uid, quota } });
        return Response.json({ ...quota, isAdmin: false });
      } else {
        // 未登录或无效用户
        logger.info({ logId, action: 'get_user_quota', result: { isAnonymous: true } });
        return Response.json({ used: 0, limit: 0, isAdmin: false });
      }
    } catch (e) { 
      logger.error({ logId, action: 'get_user_quota', error: e.message, stack: e.stack });
      return new Response('查询失败', { status: 500 }); 
    }
  }

  // 发件记录列表（按发件人地址过滤）
  if (path === '/api/sent' && request.method === 'GET') {
    const from = url.searchParams.get('from') || url.searchParams.get('mailbox') || '';
    if (!from) { return new Response('缺少 from 参数', { status: 400 }); }
    try {
      // 优化：减少默认查询数量
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 50);
      const { results } = await db.prepare(`
        SELECT id, resend_id, to_addrs as recipients, subject, created_at, status
        FROM sent_emails
        WHERE from_addr = ?
        ORDER BY datetime(created_at) DESC
        LIMIT ?
      `).bind(String(from).trim().toLowerCase(), limit).all();
      return Response.json(results || []);
    } catch (e) {
      logger.error({ logId, action: 'get_sent_list', error: e.message, stack: e.stack });
      return new Response('查询发件记录失败', { status: 500 });
    }
  }

  // 发件记录列表
  if (path === '/api/user/sent' && request.method === 'GET') {
    try {
      const payload = getJwtPayload();
      const uid = Number(payload?.userId || 0);
      if (!uid) {
        logger.warn({ logId, action: 'get_sent_emails', error: 'unauthorized', userId: uid });
        return new Response('未登录', { status: 401 });
      }
      
      const url = new URL(request.url);
      const page = Number(url.searchParams.get('page') || 1);
      const pageSize = Number(url.searchParams.get('pageSize') || 20);
      const offset = (page - 1) * pageSize;
      
      logger.info({ logId, action: 'get_sent_emails', params: { userId: uid, page, pageSize, offset } });
      
      // 查询发件记录
      const sent = await db.prepare(`
        SELECT * FROM sent_emails 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `).bind(uid, pageSize, offset).all();
      
      logger.info({ logId, action: 'get_sent_emails', result: { count: sent.results?.length || 0 } });
      return Response.json({ sent: sent.results });
    } catch (e) { 
      logger.error({ logId, action: 'get_sent_emails', error: e.message, stack: e.stack });
      return new Response('查询失败', { status: 500 }); 
    }
  }

  // 发件详情
  if (request.method === 'GET' && path.startsWith('/api/sent/')) {
    const sentId = path.substring('/api/sent/'.length);
    try {
      const payload = getJwtPayload();
      const uid = Number(payload?.userId || 0);
      if (!uid) {
        logger.warn({ logId, action: 'get_sent_detail', error: 'unauthorized', userId: uid, sentId });
        return new Response('未登录', { status: 401 });
      }
      
      logger.info({ logId, action: 'get_sent_detail', params: { userId: uid, sentId } });
      
      // 查询发件详情
      const sent = await db.prepare(`
        SELECT * FROM sent_emails 
        WHERE id = ? AND user_id = ?
      `).bind(sentId, uid).first();
      
      if (!sent) {
        logger.warn({ logId, action: 'get_sent_detail', error: 'not_found', userId: uid, sentId });
        return new Response('发件记录不存在', { status: 404 });
      }
      
      logger.info({ logId, action: 'get_sent_detail', result: { found: true, sentId } });
      return Response.json(sent);
    } catch (e) { 
      logger.error({ logId, action: 'get_sent_detail', error: e.message, stack: e.stack, sentId });
      return new Response('查询失败', { status: 500 }); 
    }
  }

  // 检查发件权限的辅助函数
  async function checkSendPermission() {
    const payload = getJwtPayload();
    if (!payload) {return false;}
    
    // 管理员默认允许
    if (payload.role === 'admin') {return true;}
    
    // 普通用户检查 can_send 权限（使用缓存）
    if (payload.userId) {
      const { getCachedSystemStat } = await import('./cacheHelper.js');
      const cacheKey = `user_can_send_${payload.userId}`;
      
      const canSend = await getCachedSystemStat(db, cacheKey, async(db) => {
        const { results } = await db.prepare('SELECT can_send FROM users WHERE id = ?').bind(payload.userId).all();
        return results?.[0]?.can_send ? 1 : 0;
      });
      
      return canSend === 1;
    }
    
    return false;
  }
  
  // 发送单封邮件
  if (path === '/api/send' && request.method === 'POST') {
    // 空值守卫：检查 RESEND_API_KEY 配置
    if (!RESEND_API_KEY) {
      logger.error({ logId, action: 'send_email', error: 'resend_api_key_missing', status: 501 });
      return new Response('Resend not configured', { status: 501 });
    }
    
    let sendPayload;
    try {
      
      // 校验是否允许发件
      const allowed = await checkSendPermission();
      if (!allowed) {
        logger.warn({ logId, action: 'send_email', error: 'permission_denied', status: 403 });
        return new Response('未授权发件或该用户未被授予发件权限', { status: 403 });
      }
      
      sendPayload = await request.json();
      logger.info({ logId, action: 'send_email', params: { from: sendPayload.from, to: sendPayload.to, subject: sendPayload.subject } });
      const payloadUser = getJwtPayload();
      const uidForSend = Number(payloadUser?.userId || 0);
      if (uidForSend) {
        const userRateLimit = checkCustomRateLimit(`send_user:${uidForSend}`, 'send:user');
        if (userRateLimit && userRateLimit.status) {
          logger.warn({ logId, action: 'send_email', error: 'rate_limited_user', userId: uidForSend, status: userRateLimit.status });
          return new Response(userRateLimit.body, { status: userRateLimit.status, headers: userRateLimit.headers });
        }
      }
      const fromAddr = String(sendPayload.from || '').trim().toLowerCase();
      if (fromAddr) {
        const fromRateLimit = checkCustomRateLimit(`send_from:${fromAddr}`, 'send:from');
        if (fromRateLimit && fromRateLimit.status) {
          logger.warn({ logId, action: 'send_email', error: 'rate_limited_from', from: fromAddr, status: fromRateLimit.status });
          return new Response(fromRateLimit.body, { status: fromRateLimit.status, headers: fromRateLimit.headers });
        }
      }
      
      // 使用智能发送，根据发件人域名自动选择API密钥
      const result = await sendEmailWithAutoResend(RESEND_API_KEY, sendPayload);
      await recordSentEmail(db, {
        resendId: result.id || null,
        fromName: sendPayload.fromName || null,
        from: sendPayload.from,
        to: sendPayload.to,
        subject: sendPayload.subject,
        html: sendPayload.html,
        text: sendPayload.text,
        status: 'delivered',
        scheduledAt: sendPayload.scheduledAt || null
      });
      
      logger.info({ logId, action: 'send_email', result: { sendId: result.id, status: 'delivered' } });
      return Response.json({ success: true, id: result.id });
    } catch (e) {
      logger.error({ logId, action: 'send_email', error: e.message, from: sendPayload?.from, to: sendPayload?.to });
      return new Response('发送失败: ' + e.message, { status: 500 });
    }
  }

  // 批量发送
  if (path === '/api/send/batch' && request.method === 'POST') {
    // 空值守卫：检查 RESEND_API_KEY 配置
    if (!RESEND_API_KEY) {
      logger.error({ logId, action: 'send_batch', error: 'resend_api_key_missing', status: 501 });
      return new Response('Resend not configured', { status: 501 });
    }
    
    let items;
    try {
      
      // 校验是否允许发件
      const allowed = await checkSendPermission();
      if (!allowed) {
        logger.warn({ logId, action: 'send_batch', error: 'permission_denied', status: 403 });
        return new Response('未授权发件或该用户未被授予发件权限', { status: 403 });
      }
      
      items = await request.json();
      logger.info({ logId, action: 'send_batch', params: { batchSize: items.length, firstFrom: items[0]?.from, firstTo: items[0]?.to } });
      const payloadUser = getJwtPayload();
      const uidForBatch = Number(payloadUser?.userId || 0);
      if (uidForBatch) {
        const userBatchRateLimit = checkCustomRateLimit(`send_user:${uidForBatch}`, 'send:user');
        if (userBatchRateLimit && userBatchRateLimit.status) {
          logger.warn({ logId, action: 'send_batch', error: 'rate_limited_user', userId: uidForBatch, status: userBatchRateLimit.status });
          return new Response(userBatchRateLimit.body, { status: userBatchRateLimit.status, headers: userBatchRateLimit.headers });
        }
      }
      const firstFrom = String(items[0]?.from || '').trim().toLowerCase();
      if (firstFrom) {
        const fromBatchRateLimit = checkCustomRateLimit(`send_from:${firstFrom}`, 'send:from');
        if (fromBatchRateLimit && fromBatchRateLimit.status) {
          logger.warn({ logId, action: 'send_batch', error: 'rate_limited_from', from: firstFrom, status: fromBatchRateLimit.status });
          return new Response(fromBatchRateLimit.body, { status: fromBatchRateLimit.status, headers: fromBatchRateLimit.headers });
        }
      }
      
      // 使用智能批量发送，自动按域名分组并使用对应的API密钥
      const result = await sendBatchWithAutoResend(RESEND_API_KEY, items);
      
      let recordedCount = 0;
      try {
        // 尝试记录（如果返回结构包含 id 列表）
        const arr = Array.isArray(result) ? result : [];
        for (let i = 0; i < arr.length; i++) {
          const id = arr[i]?.id;
          const payload = items[i] || {};
          await recordSentEmail(db, {
            resendId: id || null,
            fromName: payload.fromName || null,
            from: payload.from,
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
            text: payload.text,
            status: 'delivered',
            scheduledAt: payload.scheduledAt || null
          });
          recordedCount++;
        }
      } catch (e) {
        logger.warn({ logId, action: 'send_batch', error: 'record_failed', recordedCount, errorMessage: e.message });
      }
      
      logger.info({ logId, action: 'send_batch', result: { batchSize: items.length, recordedCount, resultSize: Array.isArray(result) ? result.length : 0 } });
      return Response.json({ success: true, result });
    } catch (e) {
      logger.error({ logId, action: 'send_batch', error: e.message, batchSize: items?.length });
      return new Response('批量发送失败: ' + e.message, { status: 500 });
    }
  }

  // 查询发送结果
  if (path.startsWith('/api/send/') && request.method === 'GET') {
    // 空值守卫：检查 RESEND_API_KEY 配置
    if (!RESEND_API_KEY) {
      logger.error({ logId, action: 'get_send_result', error: 'resend_api_key_missing', status: 501 });
      return new Response('Resend not configured', { status: 501 });
    }
    
    const id = path.split('/')[3];
    logger.info({ logId, action: 'get_send_result', sendId: id });
    try {
      const data = await getEmailFromResend(RESEND_API_KEY, id);
      logger.info({ logId, action: 'get_send_result', result: { sendId: id, status: data?.status || 'unknown' } });
      return Response.json(data);
    } catch (e) {
      logger.error({ logId, action: 'get_send_result', error: e.message, sendId: id });
      return new Response('查询失败: ' + e.message, { status: 500 });
    }
  }

  // 更新（修改定时/状态等）
  if (path.startsWith('/api/send/') && request.method === 'PATCH') {
    // 空值守卫：检查 RESEND_API_KEY 配置
    if (!RESEND_API_KEY) {
      logger.error({ logId, action: 'update_send', error: 'resend_api_key_missing', status: 501 });
      return new Response('Resend not configured', { status: 501 });
    }
    
    const id = path.split('/')[3];
    logger.info({ logId, action: 'update_send', sendId: id });
    try {
      const body = await request.json();
      logger.info({ logId, action: 'update_send', params: { sendId: id, updateType: body.status ? 'status' : body.scheduledAt ? 'schedule' : 'unknown' } });
      let data = { ok: true };
      // 如果只是更新本地状态，不必请求 Resend
      if (body && typeof body.status === 'string') {
        await updateSentEmail(db, id, { status: body.status });
        logger.info({ logId, action: 'update_send', result: { sendId: id, statusUpdated: true, newStatus: body.status } });
      }
      // 更新定时设置时需要触达 Resend
      if (body && body.scheduledAt) {
        data = await updateEmailInResend(RESEND_API_KEY, { id, scheduledAt: body.scheduledAt });
        await updateSentEmail(db, id, { scheduled_at: body.scheduledAt });
        logger.info({ logId, action: 'update_send', result: { sendId: id, scheduleUpdated: true, scheduledAt: body.scheduledAt } });
      }
      return Response.json(data || { ok: true });
    } catch (e) {
      logger.error({ logId, action: 'update_send', error: e.message, sendId: id });
      return new Response('更新失败: ' + e.message, { status: 500 });
    }
  }

  // 取消发送
  if (path.startsWith('/api/send/') && path.endsWith('/cancel') && request.method === 'POST') {
    // 空值守卫：检查 RESEND_API_KEY 配置
    if (!RESEND_API_KEY) {
      logger.error({ logId, action: 'cancel_send', error: 'resend_api_key_missing', status: 501 });
      return new Response('Resend not configured', { status: 501 });
    }
    
    const id = path.split('/')[3];
    logger.info({ logId, action: 'cancel_send', sendId: id });
    try {
      const data = await cancelEmailInResend(RESEND_API_KEY, id);
      await updateSentEmail(db, id, { status: 'canceled' });
      logger.info({ logId, action: 'cancel_send', result: { sendId: id, canceled: true } });
      return Response.json(data);
    } catch (e) {
      logger.error({ logId, action: 'cancel_send', error: e.message, sendId: id });
      return new Response('取消失败: ' + e.message, { status: 500 });
    }
  }

  // 删除发件记录
  if (request.method === 'DELETE' && path.startsWith('/api/sent/')) {
    const id = path.split('/')[3];
    logger.info({ logId, action: 'delete_sent_record', sentId: id });
    try {
      const result = await db.prepare('DELETE FROM sent_emails WHERE id = ?').bind(id).run();
      const deleted = (result?.meta?.changes || 0) > 0;
      if (deleted) {
        logger.info({ logId, action: 'delete_sent_record', result: { sentId: id, deleted: true } });
      } else {
        logger.warn({ logId, action: 'delete_sent_record', error: 'not_found', sentId: id });
      }
      return Response.json({ success: true, deleted });
    } catch (e) {
      logger.error({ logId, action: 'delete_sent_record', error: e.message, sentId: id });
      return new Response('删除发件记录失败: ' + e.message, { status: 500 });
    }
  }

  if (path === '/api/emails' && request.method === 'GET') {
    const mailbox = url.searchParams.get('mailbox');
    if (!mailbox) {
      logger.warn({ logId, action: 'get_emails', error: 'missing_mailbox_param' });
      return new Response('缺少 mailbox 参数', { status: 400 });
    }
    try {
      const normalized = extractEmail(mailbox).trim().toLowerCase();
      
      logger.info({ logId, action: 'get_emails', params: { mailbox: normalized } });
      const mailboxKey = normalized || '';
      const mailboxRateLimit = checkCustomRateLimit(`mailbox_read:${mailboxKey}`, 'mailbox:read');
      if (mailboxRateLimit && mailboxRateLimit.status) {
        logger.warn({ logId, action: 'get_emails', error: 'rate_limited_mailbox', mailbox: normalized, status: mailboxRateLimit.status });
        return new Response(mailboxRateLimit.body, { status: mailboxRateLimit.status, headers: mailboxRateLimit.headers });
      }
      
      // 纯读：不存在则返回空数组，不创建
      const mailboxId = await getMailboxIdByAddress(db, normalized);
      if (!mailboxId) {
        logger.info({ logId, action: 'get_emails', result: { mailbox: normalized, found: false, count: 0 } });
        return Response.json([]);
      }
      
      // 邮箱用户只能查看近24小时的邮件
      let timeFilter = '';
      let timeParam = [];
      if (isMailboxOnly) {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        timeFilter = ' AND received_at >= ?';
        timeParam = [twentyFourHoursAgo];
      }
      
      // 优化：减少默认查询数量，降低行读取
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 50);
      
      try {
        const { results } = await db.prepare(`
          SELECT id, sender, subject, received_at, is_read, preview, verification_code
          FROM messages 
          WHERE mailbox_id = ?${timeFilter}
          ORDER BY received_at DESC 
          LIMIT ?
        `).bind(mailboxId, ...timeParam, limit).all();
        logger.info({ logId, action: 'get_emails', result: { mailbox: normalized, count: results?.length || 0 } });
        return Response.json(results);
      } catch (e) {
        void e;
        // 旧结构降级查询：从 content/html_content 计算 preview
        const { results } = await db.prepare(`
          SELECT id, sender, subject, received_at, is_read,
                 CASE WHEN content IS NOT NULL AND content <> ''
                      THEN SUBSTR(content, 1, 120)
                      ELSE SUBSTR(COALESCE(html_content, ''), 1, 120)
                 END AS preview
          FROM messages 
          WHERE mailbox_id = ?${timeFilter}
          ORDER BY received_at DESC 
          LIMIT ?
        `).bind(mailboxId, ...timeParam, limit).all();
        logger.info({ logId, action: 'get_emails', result: { mailbox: normalized, count: results?.length || 0, fallback: true } });
        return Response.json(results);
      }
    } catch (e) {
      logger.error({ logId, action: 'get_emails', error: e.message, stack: e.stack, mailbox });
      return new Response('查询邮件失败', { status: 500 });
    }
  }

  // 批量查询邮件详情，减少前端 N+1 请求
  if (path === '/api/emails/batch' && request.method === 'GET') {
    try {
      const idsParam = String(url.searchParams.get('ids') || '').trim();
      if (!idsParam) {return Response.json([]);} 
      const ids = idsParam.split(',').map(s=>parseInt(s,10)).filter(n=>Number.isInteger(n) && n > 0);
      if (!ids.length) {return Response.json([]);} 
      
      // 优化：限制批量查询数量，避免单次查询过多行
      if (ids.length > 50) {
        return new Response('单次最多查询50封邮件', { status: 400 });
      }
      
      // 邮箱用户只能查看近24小时的邮件
      let timeFilter = '';
      let timeParam = [];
      if (isMailboxOnly) {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        timeFilter = ' AND received_at >= ?';
        timeParam = [twentyFourHoursAgo];
      }
      
      const placeholders = ids.map(()=>'?').join(',');
      try {
        const { results } = await db.prepare(`
          SELECT id, sender, to_addrs, subject, verification_code, preview, r2_bucket, r2_object_key, received_at, is_read
          FROM messages WHERE id IN (${placeholders})${timeFilter}
        `).bind(...ids, ...timeParam).all();
        return Response.json(results || []);
      } catch (err) {
        void err;
        const { results } = await db.prepare(`
          SELECT id, sender, subject, content, html_content, received_at, is_read
                 FROM messages WHERE id IN (${placeholders})${timeFilter}
        `).bind(...ids, ...timeParam).all();
        return Response.json(results || []);
      }
    } catch (err) {
      void err;
      return new Response('批量查询失败', { status: 500 });
    }
  }

  // 历史邮箱列表（按创建时间倒序）支持分页
  if (path === '/api/mailboxes' && request.method === 'GET') {
    // 优化：默认查询更少的数据
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10), 50);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);
    const q = String(url.searchParams.get('q') || '').trim().toLowerCase();
    const domain = String(url.searchParams.get('domain') || '').trim().toLowerCase();
    const canLoginParam = String(url.searchParams.get('can_login') || '').trim();
    // 超级管理员（严格管理员）可查看全部；其他仅查看自身绑定
    try {
      if (isStrictAdmin()) {
        // 严格管理员：查看所有邮箱，并用自己在 user_mailboxes 中的置顶状态覆盖；未置顶则为 0
        const payload = getJwtPayload();
        const adminUid = Number(payload?.userId || 0);
        const like = `%${q.replace(/%/g,'').replace(/_/g,'')}%`;
        
        // 构建筛选条件
        const whereConditions = [];
        const bindParams = [adminUid || 0];
        
        // 搜索条件
        if (q) {
          whereConditions.push('LOWER(m.address) LIKE LOWER(?)');
          bindParams.push(like);
        }
        
        // 域名筛选
        if (domain) {
          whereConditions.push('LOWER(m.address) LIKE LOWER(?)');
          bindParams.push(`%@${domain}`);
        }
        
        // 登录权限筛选
        if (canLoginParam === 'true') {
          whereConditions.push('m.can_login = 1');
        } else if (canLoginParam === 'false') {
          whereConditions.push('m.can_login = 0');
        }
        
        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
        bindParams.push(limit, offset);
        
        const { results } = await db.prepare(`
          SELECT m.address, m.created_at, COALESCE(um.is_pinned, 0) AS is_pinned,
                 CASE WHEN (m.password_hash IS NULL OR m.password_hash = '') THEN 1 ELSE 0 END AS password_is_default,
                 COALESCE(m.can_login, 0) AS can_login
          FROM mailboxes m
          LEFT JOIN user_mailboxes um ON um.mailbox_id = m.id AND um.user_id = ?
          ${whereClause}
          ORDER BY is_pinned DESC, m.created_at DESC
          LIMIT ? OFFSET ?
        `).bind(...bindParams).all();
        return Response.json(results || []);
      }
      const payload = getJwtPayload();
      const uid = Number(payload?.userId || 0);
      if (!uid) {return Response.json([]);}
      const like = `%${q.replace(/%/g,'').replace(/_/g,'')}%`;
      
      // 构建筛选条件
      const whereConditions = ['um.user_id = ?'];
      const bindParams = [uid];
      
      // 搜索条件
      if (q) {
        whereConditions.push('LOWER(m.address) LIKE LOWER(?)');
        bindParams.push(like);
      }
      
      // 域名筛选
      if (domain) {
        whereConditions.push('LOWER(m.address) LIKE LOWER(?)');
        bindParams.push(`%@${domain}`);
      }
      
      // 登录权限筛选
      if (canLoginParam === 'true') {
        whereConditions.push('m.can_login = 1');
      } else if (canLoginParam === 'false') {
        whereConditions.push('m.can_login = 0');
      }
      
      const whereClause = 'WHERE ' + whereConditions.join(' AND ');
      bindParams.push(limit, offset);
      
      const { results } = await db.prepare(`
        SELECT m.address, m.created_at, um.is_pinned,
               CASE WHEN (m.password_hash IS NULL OR m.password_hash = '') THEN 1 ELSE 0 END AS password_is_default,
               COALESCE(m.can_login, 0) AS can_login
        FROM user_mailboxes um
        JOIN mailboxes m ON m.id = um.mailbox_id
        ${whereClause}
        ORDER BY um.is_pinned DESC, m.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(...bindParams).all();
      return Response.json(results || []);
    } catch (e) {
      void e;
      return Response.json([]);
    }
  }

  // 管理员获取域名统计
  if (path === '/api/admin/stats/domains' && request.method === 'GET') {
    if (!isStrictAdmin()) { return new Response('Forbidden', { status: 403 }); }
    try {
      const { getDomainStats } = await import('./database.js');
      const stats = await getDomainStats(db);
      return Response.json(stats);
    } catch (e) {
      logger.error({ logId, action: 'get_domain_stats', error: e.message });
      return new Response('查询失败', { status: 500 });
    }
  }

  if (path === '/api/admin/blocked-senders' && request.method === 'GET') {
    if (!isStrictAdmin()) { return new Response('Forbidden', { status: 403 }); }
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 200);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);
    try {
      const list = await listBlockedSenders(db, limit, offset);
      return Response.json(list || []);
    } catch (e) {
      logger.error({ logId, action: 'list_blocked_senders', error: e.message, stack: e.stack });
      return new Response('查询失败', { status: 500 });
    }
  }

  if (path === '/api/admin/blocked-senders' && request.method === 'POST') {
    if (!isStrictAdmin()) { return new Response('Forbidden', { status: 403 }); }
    try {
      const body = await request.json();
      const pattern = String(body.pattern || '').trim().toLowerCase();
      const type = body.type === 'domain' ? 'domain' : 'email';
      const reason = typeof body.reason === 'string' ? body.reason.trim() || null : null;
      if (!pattern) {
        return new Response('缺少 pattern 参数', { status: 400 });
      }
      const row = await addBlockedSender(db, pattern, type, reason);
      return Response.json(row || { success: true });
    } catch (e) {
      logger.error({ logId, action: 'add_blocked_sender', error: e.message, stack: e.stack });
      return new Response('创建失败', { status: 500 });
    }
  }

  if (path.startsWith('/api/admin/blocked-senders/') && request.method === 'DELETE') {
    if (!isStrictAdmin()) { return new Response('Forbidden', { status: 403 }); }
    const idStr = path.split('/')[4];
    const id = Number(idStr || 0);
    if (!id) {
      return new Response('无效ID', { status: 400 });
    }
    try {
      const deleted = await deleteBlockedSender(db, id);
      return Response.json({ success: true, deleted });
    } catch (e) {
      logger.error({ logId, action: 'delete_blocked_sender', error: e.message, stack: e.stack, id });
      return new Response('删除失败', { status: 500 });
    }
  }

  // 重置某个邮箱的密码为默认（邮箱本身）——仅严格管理员
  if (path === '/api/mailboxes/reset-password' && request.method === 'POST') {
    try {
      if (!isStrictAdmin()) {return new Response('Forbidden', { status: 403 });}
      const address = String(url.searchParams.get('address') || '').trim().toLowerCase();
      if (!address) {return new Response('缺少 address 参数', { status: 400 });}
      await db.prepare('UPDATE mailboxes SET password_hash = NULL WHERE address = ?').bind(address).run();
      return Response.json({ success: true });
    } catch (err) { void err; return new Response('重置失败', { status: 500 }); }
  }

  // 切换邮箱置顶状态
  if (path === '/api/mailboxes/pin' && request.method === 'POST') {
    const address = url.searchParams.get('address');
    if (!address) {return new Response('缺少 address 参数', { status: 400 });}
    const payload = getJwtPayload();
    let uid = Number(payload?.userId || 0);
    // 兼容旧会话：严格管理员旧 Token 可能没有 userId，这里兜底保障可置顶
    if (!uid && isStrictAdmin()) {
      try {
        const { results } = await db.prepare('SELECT id FROM users WHERE username = ?')
          .bind(String(options?.adminName || 'admin').toLowerCase()).all();
        if (results && results.length) {
          uid = Number(results[0].id);
        } else {
          const uname = String(options?.adminName || 'admin').toLowerCase();
          await db.prepare('INSERT INTO users (username, role, can_send, mailbox_limit) VALUES (?, \'admin\', 1, 9999)').bind(uname).run();
          const again = await db.prepare('SELECT id FROM users WHERE username = ?').bind(uname).all();
          uid = Number(again?.results?.[0]?.id || 0);
        }
      } catch (err) { void err; uid = 0; }
    }
    if (!uid) {return new Response('未登录', { status: 401 });}
    try {
      const result = await toggleMailboxPin(db, address, uid);
      return Response.json({ success: true, ...result });
    } catch (e) {
      return new Response('操作失败: ' + e.message, { status: 500 });
    }
  }

  // 切换邮箱登录权限（仅严格管理员可用）
  if (path === '/api/mailboxes/toggle-login' && request.method === 'POST') {
    if (!isStrictAdmin()) {return new Response('Forbidden', { status: 403 });}
    try {
      const body = await request.json();
      const address = String(body.address || '').trim().toLowerCase();
      const canLogin = Boolean(body.can_login);
      
      if (!address) {return new Response('缺少 address 参数', { status: 400 });}
      
      // 检查邮箱是否存在
      const mbRes = await db.prepare('SELECT id FROM mailboxes WHERE address = ?').bind(address).all();
      if (!mbRes.results || mbRes.results.length === 0) {
        return new Response('邮箱不存在', { status: 404 });
      }
      
      // 更新登录权限
      await db.prepare('UPDATE mailboxes SET can_login = ? WHERE address = ?')
        .bind(canLogin ? 1 : 0, address).run();
      
      return Response.json({ success: true, can_login: canLogin });
    } catch (e) {
      return new Response('操作失败: ' + e.message, { status: 500 });
    }
  }

  // 修改邮箱密码（仅严格管理员可用）
  if (path === '/api/mailboxes/change-password' && request.method === 'POST') {
    if (!isStrictAdmin()) {return new Response('Forbidden', { status: 403 });}
    try {
      const body = await request.json();
      const address = String(body.address || '').trim().toLowerCase();
      const newPassword = String(body.new_password || '').trim();
      
      if (!address) {return new Response('缺少 address 参数', { status: 400 });}
      if (!newPassword || newPassword.length < 6) {return new Response('密码长度至少6位', { status: 400 });}
      
      // 检查邮箱是否存在
      const mbRes = await db.prepare('SELECT id FROM mailboxes WHERE address = ?').bind(address).all();
      if (!mbRes.results || mbRes.results.length === 0) {
        return new Response('邮箱不存在', { status: 404 });
      }
      
      // 生成密码哈希
      const newPasswordHash = await sha256Hex(newPassword);
      
      // 更新密码
      await db.prepare('UPDATE mailboxes SET password_hash = ? WHERE address = ?')
        .bind(newPasswordHash, address).run();
      
      return Response.json({ success: true });
    } catch (e) {
      return new Response('操作失败: ' + e.message, { status: 500 });
    }
  }

  // 批量切换邮箱登录权限（仅严格管理员可用）
  if (path === '/api/mailboxes/batch-toggle-login' && request.method === 'POST') {
    if (!isStrictAdmin()) {return new Response('Forbidden', { status: 403 });}
    try {
      const body = await request.json();
      const addresses = body.addresses || [];
      const canLogin = Boolean(body.can_login);
      
      if (!Array.isArray(addresses) || addresses.length === 0) {
        return new Response('缺少 addresses 参数或地址列表为空', { status: 400 });
      }
      
      // 限制批量操作数量，防止性能问题
      if (addresses.length > 100) {
        return new Response('单次最多处理100个邮箱', { status: 400 });
      }
      
      let successCount = 0;
      let failCount = 0;
      const results = [];
      
      // 规范化地址并过滤空地址
      const addressMap = new Map(); // 存储规范化后的地址映射
      
      for (const address of addresses) {
        const normalizedAddress = String(address || '').trim().toLowerCase();
        if (!normalizedAddress) {
          failCount++;
          results.push({ address, success: false, error: '地址为空' });
          continue;
        }
        addressMap.set(normalizedAddress, address);
      }
      
      // 优化：使用 IN 查询批量检查邮箱是否存在，减少数据库查询次数
      const existingMailboxes = new Set();
      if (addressMap.size > 0) {
        try {
          const addressList = Array.from(addressMap.keys());
          const placeholders = addressList.map(() => '?').join(',');
          const checkResult = await db.prepare(
            `SELECT address FROM mailboxes WHERE address IN (${placeholders})`
          ).bind(...addressList).all();
          
          for (const row of (checkResult.results || [])) {
            existingMailboxes.add(row.address);
          }
        } catch (e) {
          logger.error({ logId, action: 'batch_check_mailboxes_failed', error: e.message, stack: e.stack });
        }
      }
      
      // 准备批量操作语句
      const batchStatements = [];
      
      for (const normalizedAddress of addressMap.keys()) {
        if (existingMailboxes.has(normalizedAddress)) {
          // 邮箱存在，更新登录权限
          batchStatements.push({
            stmt: db.prepare('UPDATE mailboxes SET can_login = ? WHERE address = ?')
              .bind(canLogin ? 1 : 0, normalizedAddress),
            address: normalizedAddress,
            type: 'update'
          });
        } else {
          // 邮箱不存在，创建新邮箱
          batchStatements.push({
            stmt: db.prepare('INSERT INTO mailboxes (address, can_login) VALUES (?, ?)')
              .bind(normalizedAddress, canLogin ? 1 : 0),
            address: normalizedAddress,
            type: 'insert'
          });
        }
      }
      
      // 使用 D1 的 batch API 批量执行
      if (batchStatements.length > 0) {
        try {
          const batchResults = await db.batch(batchStatements.map(s => s.stmt));
          
          // 处理每个操作的结果
          for (let i = 0; i < batchResults.length; i++) {
            const result = batchResults[i];
            const operation = batchStatements[i];
            
            if (result.success !== false) {
              successCount++;
              results.push({
                address: operation.address,
                success: true,
                [operation.type === 'insert' ? 'created' : 'updated']: true
              });
            } else {
              failCount++;
              results.push({
                address: operation.address,
                success: false,
                error: result.error || '操作失败'
              });
            }
          }
        } catch (e) {
          logger.error({ logId, action: 'batch_execute_failed', error: e.message, stack: e.stack });
          return new Response('批量操作失败: ' + e.message, { status: 500 });
        }
      }
      
      return Response.json({ 
        success: true, 
        success_count: successCount, 
        fail_count: failCount,
        total: addresses.length,
        results 
      });
    } catch (e) {
      return new Response('操作失败: ' + e.message, { status: 500 });
    }
  }

  // 删除邮箱（及其所有邮件）
  if (path === '/api/mailboxes' && request.method === 'DELETE') {
    const raw = url.searchParams.get('address');
    if (!raw) {return new Response('缺少 address 参数', { status: 400 });}
    const normalized = String(raw || '').trim().toLowerCase();
    try {
      const { invalidateMailboxCache } = await import('./cacheHelper.js');
      
      const mailboxId = await getMailboxIdByAddress(db, normalized);
      // 未找到则明确返回 404，避免前端误判为成功
      if (!mailboxId) {
        logger.warn('邮箱删除失败: 邮箱不存在', { logId, action: 'delete_mailbox', address: normalized, status: 404 });
        return new Response(JSON.stringify({ success: false, message: '邮箱不存在' }), { status: 404 });
      }
      
      if (!isStrictAdmin()) {
        // 二级管理员（数据库中的 admin 角色）仅能删除自己绑定的邮箱
        const payload = getJwtPayload();
        if (!payload || payload.role !== 'admin' || !payload.userId) {
          logger.warn('邮箱删除失败: 权限不足', { logId, action: 'delete_mailbox', address: normalized, status: 403 });
          return new Response('Forbidden', { status: 403 });
        }
        const own = await db.prepare('SELECT 1 FROM user_mailboxes WHERE user_id = ? AND mailbox_id = ? LIMIT 1')
          .bind(Number(payload.userId), mailboxId).all();
        if (!own?.results?.length) {
          logger.warn('邮箱删除失败: 无权删除他人邮箱', { logId, action: 'delete_mailbox', address: normalized, mailboxId, userId: payload.userId, status: 403 });
          return new Response('Forbidden', { status: 403 });
        }
      }
      
      logger.info('开始删除邮箱', { logId, action: 'delete_mailbox', address: normalized, mailboxId });
      
      // 简易事务，降低并发插入导致的外键失败概率
      try { await db.exec('BEGIN'); } catch (err) { void err; }
      await db.prepare('DELETE FROM messages WHERE mailbox_id = ?').bind(mailboxId).run();
      const deleteResult = await db.prepare('DELETE FROM mailboxes WHERE id = ?').bind(mailboxId).run();
      try { await db.exec('COMMIT'); } catch (err) { void err; }

      // 优化：通过 meta.changes 判断删除是否成功，减少 COUNT 查询
      const deleted = (deleteResult?.meta?.changes || 0) > 0;
      
      // 删除成功后使缓存失效
      if (deleted) {
        invalidateMailboxCache(normalized);
        // 使系统统计缓存失效
        const { invalidateSystemStatCache } = await import('./cacheHelper.js');
        invalidateSystemStatCache('total_mailboxes');
        logger.info('邮箱删除成功', { logId, action: 'delete_mailbox', address: normalized, mailboxId, deleted: true });
      } else {
        logger.warn('邮箱删除失败: 数据库操作未生效', { logId, action: 'delete_mailbox', address: normalized, mailboxId });
      }
      
      return Response.json({ success: deleted, deleted });
    } catch (e) {
      try { await db.exec('ROLLBACK'); } catch (err) { void err; }
      logger.error('邮箱删除异常', { logId, action: 'delete_mailbox', address: normalized, error: e.message });
      return new Response('删除失败', { status: 500 });
    }
  }

  // 下载 EML（从 R2 获取）- 必须在通用邮件详情处理器之前
  if (request.method === 'GET' && path.startsWith('/api/email/') && path.endsWith('/download')) {
    const id = path.split('/')[3];
    const { results } = await db.prepare('SELECT r2_bucket, r2_object_key FROM messages WHERE id = ?').bind(id).all();
    const row = (results || [])[0];
    if (!row || !row.r2_object_key) {
      logger.warn('邮件下载失败: 未找到邮件或对象', { logId, action: 'download_email', emailId: id, status: 404 });
      return new Response('未找到对象', { status: 404 });
    }
    
    logger.info('开始下载邮件', { logId, action: 'download_email', emailId: id, objectKey: row.r2_object_key });
    
    try {
      const r2 = options.r2;
      if (!r2) {
        logger.error('邮件下载失败: R2未绑定', { logId, action: 'download_email', emailId: id, status: 500 });
        return new Response('R2 未绑定', { status: 500 });
      }
      
      const obj = await r2.get(row.r2_object_key);
      if (!obj) {
        logger.warn('邮件下载失败: 对象不存在', { logId, action: 'download_email', emailId: id, objectKey: row.r2_object_key, status: 404 });
        return new Response('对象不存在', { status: 404 });
      }
      
      const headers = new Headers({ 'Content-Type': 'message/rfc822' });
      headers.set('Content-Disposition', `attachment; filename="${String(row.r2_object_key).split('/').pop()}"`);
      
      logger.info('邮件下载成功', { logId, action: 'download_email', emailId: id, objectKey: row.r2_object_key, size: obj.size });
      return new Response(obj.body, { headers });
    } catch (e) {
      logger.error('邮件下载异常', { logId, action: 'download_email', emailId: id, error: e.message });
      return new Response('下载失败', { status: 500 });
    }
  }

  if (request.method === 'GET' && path.startsWith('/api/email/')) {
    const emailId = path.split('/')[3];
    
    logger.info({ logId, action: 'get_email_detail', params: { emailId, isMailboxOnly } });
    
    try {
      // 邮箱用户需要验证邮件是否在24小时内
      let timeFilter = '';
      let timeParam = [];
      if (isMailboxOnly) {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        timeFilter = ' AND received_at >= ?';
        timeParam = [twentyFourHoursAgo];
      }
      
      const { results } = await db.prepare(`
        SELECT id, sender, to_addrs, subject, verification_code, preview, r2_bucket, r2_object_key, received_at, is_read
        FROM messages WHERE id = ?${timeFilter}
      `).bind(emailId, ...timeParam).all();
      
      if (!results || !results.length) {
        logger.warn({ logId, action: 'get_email_detail', error: 'not_found', emailId, status: 404 });
        return new Response('未找到邮件', { status: 404 });
      }
      const row = results[0];
      
      // 尝试从 R2 获取完整内容
      let content = row.content || '';
      let html_content = row.html_content || '';
      
      if (row.r2_object_key) {
        try {
          const r2 = options.r2;
          if (r2) {
            const obj = await r2.get(row.r2_object_key);
            if (obj) {
              const eml = await obj.text();
              const parsed = parseEmailBody(eml);
              content = parsed.content || '';
              html_content = parsed.html_content || '';
              
              // 如果 R2 中有内容，更新数据库中的预览
              if (content && !row.preview) {
                const preview = String(content).substring(0, 120);
                await db.prepare('UPDATE messages SET preview = ? WHERE id = ?').bind(preview, emailId).run();
              }
            }
          }
        } catch (e) {
          // R2 读取失败时使用数据库中的内容
          logger.warn({ logId, action: 'get_email_detail', error: 'r2_read_failed', emailId, r2Key: row.r2_object_key, errorMessage: e.message });
        }
      }
      
      // 标记为已读
      await db.prepare('UPDATE messages SET is_read = 1 WHERE id = ?').bind(emailId).run();
      
      logger.info({ logId, action: 'get_email_detail', result: { emailId, found: true, hasR2: !!row.r2_object_key } });
      
      return Response.json({ ...row, content, html_content, download: row.r2_object_key ? `/api/email/${emailId}/download` : '' });
    } catch (e) {
      void e;
      const { results } = await db.prepare(`
        SELECT id, sender, subject, content, html_content, received_at, is_read
        FROM messages WHERE id = ?
      `).bind(emailId).all();
      if (!results || !results.length) {
        logger.warn({ logId, action: 'get_email_detail', error: 'not_found_fallback', emailId, status: 404 });
        return new Response('未找到邮件', { status: 404 });
      }
      await db.prepare('UPDATE messages SET is_read = 1 WHERE id = ?').bind(emailId).run();
      logger.info({ logId, action: 'get_email_detail', result: { emailId, found: true, fallback: true } });
      return Response.json(results[0]);
    }
  }

  if (request.method === 'DELETE' && path.startsWith('/api/email/')) {
    const emailId = path.split('/')[3];
    
    if (!emailId || !Number.isInteger(parseInt(emailId))) {
      logger.warn('邮件删除失败: 无效的邮件ID', { logId, action: 'delete_email', emailId, status: 400 });
      return new Response('无效的邮件ID', { status: 400 });
    }
    
    logger.info('开始删除邮件', { logId, action: 'delete_email', emailId });
    
    try {
      // 优化：直接删除，通过 D1 的 changes 判断是否成功，减少 COUNT 查询
      const result = await db.prepare('DELETE FROM messages WHERE id = ?').bind(emailId).run();
      
      // D1 的 run() 返回对象中包含 meta.changes 表示受影响的行数
      const deleted = (result?.meta?.changes || 0) > 0;
      
      if (deleted) {
        logger.info('邮件删除成功', { logId, action: 'delete_email', emailId, deleted: true });
      } else {
        logger.warn('邮件删除失败: 邮件不存在或已被删除', { logId, action: 'delete_email', emailId });
      }
      
      return Response.json({ 
        success: true, 
        deleted,
        message: deleted ? '邮件已删除' : '邮件不存在或已被删除'
      });
    } catch (e) {
      logger.error('邮件删除异常', { logId, action: 'delete_email', emailId, error: e.message });
      return new Response('删除邮件时发生错误: ' + e.message, { status: 500 });
    }
  }

  if (request.method === 'DELETE' && path === '/api/emails') {
    const mailbox = url.searchParams.get('mailbox');
    if (!mailbox) {
      logger.warn('清空邮件失败: 缺少mailbox参数', { logId, action: 'clear_emails', status: 400 });
      return new Response('缺少 mailbox 参数', { status: 400 });
    }
    
    const normalized = extractEmail(mailbox).trim().toLowerCase();
    logger.info('开始清空邮件', { logId, action: 'clear_emails', mailbox: normalized });
    
    try {
      // 仅当邮箱已存在时才执行清空操作；不存在则直接返回 0 删除
      const mailboxId = await getMailboxIdByAddress(db, normalized);
      if (!mailboxId) {
        logger.info('清空邮件: 邮箱不存在，无需清空', { logId, action: 'clear_emails', mailbox: normalized });
        return Response.json({ success: true, deletedCount: 0 });
      }
      
      // 优化：直接删除，通过 meta.changes 获取删除数量，减少 COUNT 查询
      const result = await db.prepare('DELETE FROM messages WHERE mailbox_id = ?').bind(mailboxId).run();
      const deletedCount = result?.meta?.changes || 0;
      
      logger.info('清空邮件成功', { logId, action: 'clear_emails', mailbox: normalized, mailboxId, deletedCount });
      
      return Response.json({ 
        success: true, 
        deletedCount
      });
    } catch (e) {
      logger.error('清空邮件异常', { logId, action: 'clear_emails', mailbox: normalized, error: e.message });
      return new Response('清空邮件失败', { status: 500 });
    }
  }

  // Toggle message pin status
  if (path.startsWith('/api/emails/') && path.endsWith('/pin') && request.method === 'POST') {
    
    // Extract ID: /api/emails/123/pin
    const parts = path.split('/');
    const messageId = parseInt(parts[3], 10);
    
    if (!messageId) {
      return new Response('Invalid message ID', { status: 400 });
    }
    
    try {
      const body = await request.json();
      const isPinned = !!body.is_pinned;
      
      const payload = getJwtPayload();
      
      // Auth check
      if (!isStrictAdmin()) {
        // Mailbox user check
        const mailboxId = payload?.mailboxId;
        if (!mailboxId) {
          return new Response('Unauthorized', { status: 401 });
        }
        
        // Verify ownership
        const msg = await db.prepare('SELECT mailbox_id FROM messages WHERE id = ?').bind(messageId).first();
        if (!msg) {
          return new Response('Message not found', { status: 404 });
        }
        if (msg.mailbox_id !== mailboxId) {
          return new Response('Forbidden', { status: 403 });
        }
      }
      
      const success = await setMessagePinned(db, messageId, isPinned);
      return Response.json({ success, is_pinned: isPinned });
      
    } catch (e) {
      logger.error('Pin message failed', { error: e.message });
      return new Response('Failed to pin message', { status: 500 });
    }
  }

  // ================= 邮箱密码管理 =================
  if (path === '/api/mailbox/password' && request.method === 'PUT') {
    
    try {
      const body = await request.json();
      const { currentPassword, newPassword } = body;
      
      if (!currentPassword || !newPassword) {
        logger.warn('密码修改失败: 密码参数为空', { logId, action: 'change_password', status: 400 });
        return new Response('当前密码和新密码不能为空', { status: 400 });
      }
      
      if (newPassword.length < 6) {
        logger.warn('密码修改失败: 新密码长度不足', { logId, action: 'change_password', passwordLength: newPassword.length, status: 400 });
        return new Response('新密码长度至少6位', { status: 400 });
      }
      
      const payload = getJwtPayload();
      const mailboxAddress = payload?.mailboxAddress;
      const mailboxId = payload?.mailboxId;
      
      if (!mailboxAddress || !mailboxId) {
        logger.warn('密码修改失败: 未找到邮箱信息', { logId, action: 'change_password', status: 401 });
        return new Response('未找到邮箱信息', { status: 401 });
      }
      
      logger.info('开始修改密码', { logId, action: 'change_password', mailboxAddress, mailboxId });
      
      // 验证当前密码
      const { results } = await db.prepare('SELECT password_hash FROM mailboxes WHERE id = ? AND address = ?')
        .bind(mailboxId, mailboxAddress).all();
      
      if (!results || results.length === 0) {
        logger.warn('密码修改失败: 邮箱不存在', { logId, action: 'change_password', mailboxAddress, mailboxId, status: 404 });
        return new Response('邮箱不存在', { status: 404 });
      }
      
      const mailbox = results[0];
      let currentPasswordValid = false;
      
      if (mailbox.password_hash) {
        // 如果有存储的密码哈希，验证哈希密码
        const { verifyPassword } = await import('./authentication.js');
        currentPasswordValid = await verifyPassword(currentPassword, mailbox.password_hash);
      } else {
        // 兼容性：如果没有密码哈希，使用邮箱地址作为默认密码
        currentPasswordValid = (currentPassword === mailboxAddress);
      }
      
      if (!currentPasswordValid) {
        logger.warn('密码修改失败: 当前密码错误', { logId, action: 'change_password', mailboxAddress, mailboxId, status: 400 });
        return new Response('当前密码错误', { status: 400 });
      }
      
      // 生成新密码哈希
      const { hashPassword } = await import('./authentication.js');
      const newPasswordHash = await hashPassword(newPassword);
      
      // 更新密码
      await db.prepare('UPDATE mailboxes SET password_hash = ? WHERE id = ?')
        .bind(newPasswordHash, mailboxId).run();
      
      logger.info('密码修改成功', { logId, action: 'change_password', mailboxAddress, mailboxId });
      
      return Response.json({ success: true, message: '密码修改成功' });
      
    } catch (error) {
      logger.error('密码修改异常', { logId, action: 'change_password', error: error.message });
      return new Response('修改密码失败', { status: 500 });
    }
  }

  return new Response('未找到 API 路径', { status: 404 });
}

export async function handleEmailReceive(requestOrData, db, env) {
  try {
    let emailData;
    // 支持直接传入数据对象或 Request 对象
    if (requestOrData && typeof requestOrData.json === 'function') {
      emailData = await requestOrData.json();
    } else {
      emailData = requestOrData;
    }

    const to = String(emailData?.to || '');
    const from = String(emailData?.from || '');
    const subject = String(emailData?.subject || '(无主题)');
    const text = String(emailData?.text || '');
    const html = String(emailData?.html || '');

    const mailbox = extractEmail(to);
    const sender = extractEmail(from);
    const blocked = await isSenderBlocked(db, sender);
    if (blocked) {
      return new Response('Blocked', { status: 204 });
    }
    const mailboxKey = String(mailbox || '').trim().toLowerCase();
    const receiveRateLimit = checkCustomRateLimit(`receive_mailbox:${mailboxKey}`, 'receive:mailbox');
    if (receiveRateLimit && receiveRateLimit.status) {
      return new Response(receiveRateLimit.body, { status: receiveRateLimit.status, headers: receiveRateLimit.headers });
    }
    const mailboxId = await getOrCreateMailboxId(db, mailbox);

    // 构造简易 EML 并写入 R2（即便没有原始 raw 也生成便于详情查看）
    const now = new Date();
    const dateStr = now.toUTCString();
    const boundary = 'mf-' + (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
    let eml = '';
    if (html) {
      eml = [
        `From: <${sender}>`,
        `To: <${mailbox}>`,
        `Subject: ${subject}`,
        `Date: ${dateStr}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset="utf-8"',
        'Content-Transfer-Encoding: 8bit',
        '',
        text || '',
        `--${boundary}`,
        'Content-Type: text/html; charset="utf-8"',
        'Content-Transfer-Encoding: 8bit',
        '',
        html,
        `--${boundary}--`,
        ''
      ].join('\r\n');
    } else {
      eml = [
        `From: <${sender}>`,
        `To: <${mailbox}>`,
        `Subject: ${subject}`,
        `Date: ${dateStr}`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset="utf-8"',
        'Content-Transfer-Encoding: 8bit',
        '',
        text || '',
        ''
      ].join('\r\n');
    }

    let objectKey = '';
    try {
      const r2 = env?.MAIL_EML;
      if (r2) {
        const y = now.getUTCFullYear();
        const m = String(now.getUTCMonth() + 1).padStart(2, '0');
        const d = String(now.getUTCDate()).padStart(2, '0');
        const hh = String(now.getUTCHours()).padStart(2, '0');
        const mm = String(now.getUTCMinutes()).padStart(2, '0');
        const ss = String(now.getUTCSeconds()).padStart(2, '0');
        const keyId = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
        const safeMailbox = (mailbox || 'unknown').toLowerCase().replace(/[^a-z0-9@._-]/g, '_');
        objectKey = `${y}/${m}/${d}/${safeMailbox}/${hh}${mm}${ss}-${keyId}.eml`;
        await r2.put(objectKey, eml, { httpMetadata: { contentType: 'message/rfc822' } });
      }
    } catch (err) { void err; objectKey = ''; }

    const previewBase = (text || html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    const preview = String(previewBase || '').slice(0, 120);
    let verificationCode = '';
    try {
      verificationCode = extractVerificationCode({ subject, text, html });
      if (!verificationCode) {
        // 如果未找到验证码，尝试提取登录链接
        verificationCode = extractLoginLink({ text, html });
      }
    } catch (err) { void err; }

    // 直接使用标准列名插入（表结构已在初始化时固定）
    await db.prepare(`
      INSERT INTO messages (mailbox_id, sender, to_addrs, subject, verification_code, preview, r2_bucket, r2_object_key)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      mailboxId,
      sender,
      String(to || ''),
      subject || '(无主题)',
      verificationCode || null,
      preview || null,
      'mail-eml',
      objectKey || ''
    ).run();

    try {
      const globalRetentionDays = Number(env?.EMAIL_RETENTION_DAYS || 60);
      await cleanupOldMessages(db, globalRetentionDays);
    } catch (err) { void err; }

    try {
      let targetChatIds = [];
      try {
        const { results } = await db.prepare(
          'SELECT u.telegram_chat_id FROM users u JOIN user_mailboxes um ON um.user_id = u.id JOIN mailboxes m ON m.id = um.mailbox_id WHERE m.id = ? AND u.telegram_chat_id IS NOT NULL'
        ).bind(mailboxId).all();
        targetChatIds = (results || []).map(function(row) { return String(row.telegram_chat_id); });
      } catch (e) {
        logger.error('查询用户 Telegram 绑定失败', e);
      }

      if (!targetChatIds.length && env.TELEGRAM_CHAT_ID) {
        targetChatIds = [String(env.TELEGRAM_CHAT_ID)];
      }

      if (env.TELEGRAM_BOT_TOKEN && targetChatIds.length) {
        const previewText = (text || '').slice(0, 200);
        const baseMsg =
          '<b>📬 新邮件 #email</b>\n\n' +
          '<b>📤 发件人:</b> ' + escapeHtml(from) + '\n' +
          '<b>📥 收件人:</b> ' + escapeHtml(to) + '\n' +
          '<b>📋 主题:</b> ' + escapeHtml(subject) + '\n' +
          (verificationCode ? '<b>🔑 验证码:</b> <code>' + escapeHtml(verificationCode) + '</code>\n' : '') +
          '\n' + escapeHtml(previewText) + (previewText.length < (text || '').length ? '...' : '');

        for (const cid of targetChatIds) {
          try {
            await sendTelegramMessage({ TELEGRAM_BOT_TOKEN: env.TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID: cid }, baseMsg);
          } catch (e) {
            logger.error('Telegram notification failed', e);
          }
        }
      }
    } catch (notifyErr) {
      logger.error('Telegram notification wrapper failed', notifyErr);
    }

    return Response.json({ success: true });
  } catch (error) {
    logger.error('处理邮件时出错', error);
    return new Response('处理邮件失败', { status: 500 });
  }
}
