import { clearExpiredCache } from './cacheHelper.js';
import { getCachedMailboxId, updateMailboxIdCache, invalidateSystemStatCache } from './cacheHelper.js';

// 初始化状态标志（全局共享，Worker 生命周期内有效）
let _isFirstInit = true;

/**
 * 轻量级数据库初始化（仅在首次启动时检查）
 * @param {object} db - 数据库连接对象
 * @returns {Promise<void>} 初始化完成后无返回值
 */
export async function initDatabase(db) {
  try {
    // 验证数据库连接
    if (!db || typeof db.exec !== 'function') {
      throw new Error('无效的数据库连接对象');
    }

    // 清理过期缓存
    clearExpiredCache();
    
    // 仅首次启动时执行完整初始化
    if (_isFirstInit) {
      await performFirstTimeSetup(db);
      _isFirstInit = false;
    } else {
      // 非首次启动时确保外键约束开启
      await db.exec('PRAGMA foreign_keys = ON;');
    }
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw new Error(`数据库初始化失败: ${error.message}`);
  }
}

/**
 * 首次启动设置（仅执行一次）
 * @param {object} db - 数据库连接对象
 * @returns {Promise<void>}
 */
async function performFirstTimeSetup(db) {
  // 快速检查：如果所有必要表存在，跳过初始化
  try {
    await db.prepare('SELECT 1 FROM mailboxes LIMIT 1').all();
    await db.prepare('SELECT 1 FROM messages LIMIT 1').all();
    await db.prepare('SELECT 1 FROM users LIMIT 1').all();
    await db.prepare('SELECT 1 FROM user_mailboxes LIMIT 1').all();
    await db.prepare('SELECT 1 FROM sent_emails LIMIT 1').all();
    await db.prepare('SELECT 1 FROM domains LIMIT 1').all();
    // 所有6个必要表都存在，跳过创建
    return;
  } catch (_) {
    // 有表不存在，继续初始化
    console.log('检测到数据库表不完整，开始初始化...');
  }
  
  // 临时禁用外键约束，避免创建表时的约束冲突
  await db.exec('PRAGMA foreign_keys = OFF;');
  
  // 创建表结构（仅在表不存在时）
  await db.exec('CREATE TABLE IF NOT EXISTS mailboxes (id INTEGER PRIMARY KEY AUTOINCREMENT, address TEXT NOT NULL UNIQUE, local_part TEXT NOT NULL, domain TEXT NOT NULL, password_hash TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, last_accessed_at TEXT, expires_at TEXT, is_pinned INTEGER DEFAULT 0, can_login INTEGER DEFAULT 0, retention_days INTEGER);');
  await db.exec('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, mailbox_id INTEGER NOT NULL, sender TEXT NOT NULL, to_addrs TEXT NOT NULL DEFAULT \'\', subject TEXT NOT NULL, verification_code TEXT, preview TEXT, r2_bucket TEXT NOT NULL DEFAULT \'temp-mail-eml\', r2_object_key TEXT NOT NULL DEFAULT \'\', received_at TEXT DEFAULT CURRENT_TIMESTAMP, is_read INTEGER DEFAULT 0, is_pinned INTEGER NOT NULL DEFAULT 0, FOREIGN KEY(mailbox_id) REFERENCES mailboxes(id));');
  await db.exec('CREATE TABLE IF NOT EXISTS blocked_senders (id INTEGER PRIMARY KEY AUTOINCREMENT, pattern TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN (\'email\',\'domain\')), reason TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);');
  await db.exec('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT, role TEXT NOT NULL DEFAULT \'user\', can_send INTEGER NOT NULL DEFAULT 0, mailbox_limit INTEGER NOT NULL DEFAULT 10, created_at TEXT DEFAULT CURRENT_TIMESTAMP, telegram_chat_id TEXT, telegram_username TEXT);');
  await db.exec('CREATE TABLE IF NOT EXISTS user_mailboxes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, mailbox_id INTEGER NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP, is_pinned INTEGER NOT NULL DEFAULT 0, UNIQUE(user_id, mailbox_id), FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY(mailbox_id) REFERENCES mailboxes(id) ON DELETE CASCADE);');
  await db.exec('CREATE TABLE IF NOT EXISTS sent_emails (id INTEGER PRIMARY KEY AUTOINCREMENT, resend_id TEXT, from_name TEXT, from_addr TEXT NOT NULL, to_addrs TEXT NOT NULL, subject TEXT NOT NULL, html_content TEXT, text_content TEXT, status TEXT DEFAULT \'queued\', scheduled_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);');
  await db.exec('CREATE TABLE IF NOT EXISTS domains (id INTEGER PRIMARY KEY AUTOINCREMENT, domain TEXT NOT NULL UNIQUE, created_at TEXT DEFAULT CURRENT_TIMESTAMP, last_seen_at TEXT DEFAULT CURRENT_TIMESTAMP, is_active INTEGER DEFAULT 1);');
  
  // 创建索引
  await db.exec('CREATE INDEX IF NOT EXISTS idx_mailboxes_address ON mailboxes(address);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_mailboxes_is_pinned ON mailboxes(is_pinned DESC);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_mailboxes_address_created ON mailboxes(address, created_at DESC);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_messages_mailbox_id ON messages(mailbox_id);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_messages_received_at ON messages(received_at DESC);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_messages_r2_object_key ON messages(r2_object_key);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_messages_mailbox_received ON messages(mailbox_id, received_at DESC);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_messages_mailbox_received_read ON messages(mailbox_id, received_at DESC, is_read);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_user_mailboxes_user ON user_mailboxes(user_id);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_user_mailboxes_mailbox ON user_mailboxes(mailbox_id);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_user_mailboxes_user_pinned ON user_mailboxes(user_id, is_pinned DESC);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_user_mailboxes_composite ON user_mailboxes(user_id, mailbox_id, is_pinned);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_sent_emails_resend_id ON sent_emails(resend_id);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_sent_emails_status_created ON sent_emails(status, created_at DESC);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_sent_emails_from_addr ON sent_emails(from_addr);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_domains_domain ON domains(domain);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_blocked_senders_pattern ON blocked_senders(pattern);');
  
  // 重新启用外键约束
  await db.exec('PRAGMA foreign_keys = ON;');
}

/**
 * 完整的数据库设置脚本（用于首次部署）
 * 可通过 wrangler d1 execute 或管理面板执行
 * @param {object} db - 数据库连接对象
 * @returns {Promise<void>}
 */
export async function setupDatabase(db) {
  // 临时禁用外键约束，避免创建表时的约束冲突
  await db.exec('PRAGMA foreign_keys = OFF;');
  
  // 创建所有表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS mailboxes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT NOT NULL UNIQUE,
      local_part TEXT NOT NULL,
      domain TEXT NOT NULL,
      password_hash TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_accessed_at TEXT,
      expires_at TEXT,
      is_pinned INTEGER DEFAULT 0,
      can_login INTEGER DEFAULT 0,
      retention_days INTEGER
    );
  `);
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mailbox_id INTEGER NOT NULL,
      sender TEXT NOT NULL,
      to_addrs TEXT NOT NULL DEFAULT '',
      subject TEXT NOT NULL,
      verification_code TEXT,
      preview TEXT,
      r2_bucket TEXT NOT NULL DEFAULT 'temp-mail-eml',
      r2_object_key TEXT NOT NULL DEFAULT '',
      received_at TEXT DEFAULT CURRENT_TIMESTAMP,
      is_read INTEGER DEFAULT 0,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(mailbox_id) REFERENCES mailboxes(id)
    );
  `);
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      can_send INTEGER NOT NULL DEFAULT 0,
      mailbox_limit INTEGER NOT NULL DEFAULT 10,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      telegram_chat_id TEXT,
      telegram_username TEXT
    );
  `);
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_mailboxes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      mailbox_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, mailbox_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(mailbox_id) REFERENCES mailboxes(id) ON DELETE CASCADE
    );
  `);
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sent_emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resend_id TEXT,
      from_name TEXT,
      from_addr TEXT NOT NULL,
      to_addrs TEXT NOT NULL,
      subject TEXT NOT NULL,
      html_content TEXT,
      text_content TEXT,
      status TEXT DEFAULT 'queued',
      scheduled_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TEXT DEFAULT CURRENT_TIMESTAMP,
      is_active INTEGER DEFAULT 1
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS blocked_senders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pattern TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('email','domain')),
      reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // 创建所有索引
  await db.exec('CREATE INDEX IF NOT EXISTS idx_mailboxes_address ON mailboxes(address);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_mailboxes_is_pinned ON mailboxes(is_pinned DESC);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_mailboxes_address_created ON mailboxes(address, created_at DESC);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_messages_mailbox_id ON messages(mailbox_id);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_messages_received_at ON messages(received_at DESC);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_messages_r2_object_key ON messages(r2_object_key);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_messages_mailbox_received ON messages(mailbox_id, received_at DESC);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_messages_mailbox_received_read ON messages(mailbox_id, received_at DESC, is_read);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_user_mailboxes_user ON user_mailboxes(user_id);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_user_mailboxes_mailbox ON user_mailboxes(mailbox_id);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_user_mailboxes_user_pinned ON user_mailboxes(user_id, is_pinned DESC);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_user_mailboxes_composite ON user_mailboxes(user_id, mailbox_id, is_pinned);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_sent_emails_resend_id ON sent_emails(resend_id);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_sent_emails_status_created ON sent_emails(status, created_at DESC);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_sent_emails_from_addr ON sent_emails(from_addr);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_domains_domain ON domains(domain);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_blocked_senders_pattern ON blocked_senders(pattern);');
  
  // 重新启用外键约束
  await db.exec('PRAGMA foreign_keys = ON;');
}

/**
 * 获取或创建邮箱ID，如果邮箱不存在则自动创建
 * @param {object} db - 数据库连接对象
 * @param {string} address - 邮箱地址
 * @param {object} ctx - 执行上下文（可选）
 * @returns {Promise<number>} 邮箱ID
 * @throws {Error} 当邮箱地址无效时抛出异常
 */
export async function getOrCreateMailboxId(db, address, ctx = null) {
  const normalized = String(address || '').trim().toLowerCase();
  if (!normalized) {
    throw new Error('无效的邮箱地址');
  }
  
  // 先检查缓存
  const cachedId = await getCachedMailboxId(db, normalized);
  if (cachedId) {
    // 更新访问时间（使用后台任务，不阻塞主流程）
    const updatePromise = db.prepare('UPDATE mailboxes SET last_accessed_at = CURRENT_TIMESTAMP WHERE id = ?').bind(cachedId).run();
    if (ctx && ctx.waitUntil) {
      ctx.waitUntil(updatePromise);
    } else {
      await updatePromise;
    }
    return cachedId;
  }
  
  // 解析邮箱地址
  let local_part = '';
  let domain = '';
  const at = normalized.indexOf('@');
  if (at > 0 && at < normalized.length - 1) {
    local_part = normalized.slice(0, at);
    domain = normalized.slice(at + 1);
  }
  if (!local_part || !domain) {
    throw new Error('无效的邮箱地址');
  }
  
  // 使用单个查询检查并更新（优化性能）
  const existing = await db.prepare('SELECT id FROM mailboxes WHERE address = ? LIMIT 1').bind(normalized).all();
  if (existing.results && existing.results.length > 0) {
    const id = existing.results[0].id;
    updateMailboxIdCache(normalized, id);
    // 异步更新访问时间，不阻塞主流程
    const updatePromise = db.prepare('UPDATE mailboxes SET last_accessed_at = CURRENT_TIMESTAMP WHERE id = ?').bind(id).run();
    if (ctx && ctx.waitUntil) {
      ctx.waitUntil(updatePromise);
    } else {
      await updatePromise;
    }
    return id;
  }
  
  // 创建新邮箱
  await db.prepare(
    'INSERT INTO mailboxes (address, local_part, domain, password_hash, last_accessed_at) VALUES (?, ?, ?, NULL, CURRENT_TIMESTAMP)'
  ).bind(normalized, local_part, domain).run();
  
  // 查询新创建的ID
  const created = await db.prepare('SELECT id FROM mailboxes WHERE address = ? LIMIT 1').bind(normalized).all();
  const newId = created.results[0].id;
  
  // 更新缓存
  updateMailboxIdCache(normalized, newId);
  
  // 使系统统计缓存失效（邮箱数量变化）
  invalidateSystemStatCache('total_mailboxes');
  
  return newId;
}

/**
 * 根据邮箱地址获取邮箱ID
 * @param {object} db - 数据库连接对象
 * @param {string} address - 邮箱地址
 * @returns {Promise<number|null>} 邮箱ID，如果不存在返回null
 */
export async function getMailboxIdByAddress(db, address) {
  const normalized = String(address || '').trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  
  // 使用缓存
  return await getCachedMailboxId(db, normalized);
}

/**
 * 检查邮箱是否存在以及是否属于特定用户
 * @param {object} db - 数据库连接对象
 * @param {string} address - 邮箱地址
 * @param {number} userId - 用户ID（可选）
 * @returns {Promise<object>} 包含exists(是否存在)、ownedByUser(是否属于该用户)、mailboxId的对象
 */
export async function checkMailboxOwnership(db, address, userId = null) {
  const normalized = String(address || '').trim().toLowerCase();
  if (!normalized) {return { exists: false, ownedByUser: false, mailboxId: null };}
  
  // 检查邮箱是否存在
  const res = await db.prepare('SELECT id FROM mailboxes WHERE address = ? LIMIT 1').bind(normalized).all();
  if (!res.results || res.results.length === 0) {
    return { exists: false, ownedByUser: false, mailboxId: null };
  }
  
  const mailboxId = res.results[0].id;
  
  // 如果没有提供用户ID，只返回存在性检查结果
  if (!userId) {
    return { exists: true, ownedByUser: false, mailboxId };
  }
  
  // 检查邮箱是否属于该用户
  const ownerRes = await db.prepare(
    'SELECT id FROM user_mailboxes WHERE user_id = ? AND mailbox_id = ? LIMIT 1'
  ).bind(userId, mailboxId).all();
  
  const ownedByUser = ownerRes.results && ownerRes.results.length > 0;
  
  return { exists: true, ownedByUser, mailboxId };
}

/**
 * 切换邮箱的置顶状态
 * @param {object} db - 数据库连接对象
 * @param {string} address - 邮箱地址
 * @param {number} userId - 用户ID
 * @returns {Promise<object>} 包含is_pinned状态的对象
 * @throws {Error} 当邮箱地址无效、用户未登录或邮箱不存在时抛出异常
 */
export async function toggleMailboxPin(db, address, userId) {
  const normalized = String(address || '').trim().toLowerCase();
  if (!normalized) {
    throw new Error('无效的邮箱地址');
  }
  const uid = Number(userId || 0);
  if (!uid) {
    throw new Error('未登录');
  }

  // 获取邮箱 ID
  const mbRes = await db.prepare('SELECT id FROM mailboxes WHERE address = ? LIMIT 1').bind(normalized).all();
  if (!mbRes.results || mbRes.results.length === 0) {
    throw new Error('邮箱不存在');
  }
  const mailboxId = mbRes.results[0].id;

  // 检查该邮箱是否属于该用户
  const umRes = await db.prepare('SELECT id, is_pinned FROM user_mailboxes WHERE user_id = ? AND mailbox_id = ? LIMIT 1')
    .bind(uid, mailboxId).all();
  if (!umRes.results || umRes.results.length === 0) {
    // 若尚未存在关联记录（例如严格管理员未分配该邮箱），则创建一条仅用于个人置顶的关联
    await db.prepare('INSERT INTO user_mailboxes (user_id, mailbox_id, is_pinned) VALUES (?, ?, 1)')
      .bind(uid, mailboxId).run();
    return { is_pinned: 1 };
  }

  const currentPin = umRes.results[0].is_pinned ? 1 : 0;
  const newPin = currentPin ? 0 : 1;
  await db.prepare('UPDATE user_mailboxes SET is_pinned = ? WHERE user_id = ? AND mailbox_id = ?')
    .bind(newPin, uid, mailboxId).run();
  return { is_pinned: newPin };
}

/**
 * 记录发送的邮件信息到数据库
 * @param {object} db - 数据库连接对象
 * @param {object} params - 邮件参数对象
 * @param {string} params.resendId - Resend服务的邮件ID
 * @param {string} params.fromName - 发件人姓名
 * @param {string} params.from - 发件人邮箱地址
 * @param {string|Array<string>} params.to - 收件人邮箱地址
 * @param {string} params.subject - 邮件主题
 * @param {string} params.html - HTML内容
 * @param {string} params.text - 纯文本内容
 * @param {string} params.status - 邮件状态，默认为'queued'
 * @param {string} params.scheduledAt - 计划发送时间，默认为null
 * @returns {Promise<void>} 记录完成后无返回值
 */
export async function recordSentEmail(db, { resendId, fromName, from, to, subject, html, text, status = 'queued', scheduledAt = null }) {
  const toAddrs = Array.isArray(to) ? to.join(',') : String(to || '');
  await db.prepare(`
    INSERT INTO sent_emails (resend_id, from_name, from_addr, to_addrs, subject, html_content, text_content, status, scheduled_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(resendId || null, fromName || null, from, toAddrs, subject, html || null, text || null, status, scheduledAt || null).run();
}

/**
 * 更新已发送邮件的状态信息
 * @param {object} db - 数据库连接对象
 * @param {string} resendId - Resend服务的邮件ID
 * @param {object} fields - 需要更新的字段对象
 * @returns {Promise<void>} 更新完成后无返回值
 */
export async function updateSentEmail(db, resendId, fields) {
  if (!resendId) {
    return;
  }
  const allowed = ['status', 'scheduled_at'];
  const setClauses = [];
  const values = [];
  for (const key of allowed) {
    if (key in (fields || {})) {
      setClauses.push(`${key} = ?`);
      values.push(fields[key]);
    }
  }
  if (!setClauses.length) {
    return;
  }
  setClauses.push('updated_at = CURRENT_TIMESTAMP');
  const sql = `UPDATE sent_emails SET ${setClauses.join(', ')} WHERE resend_id = ?`;
  values.push(resendId);
  await db.prepare(sql).bind(...values).run();
}

// ============== 用户与授权相关 ==============
/**
 * 创建新用户
 * @param {object} db - 数据库连接对象
 * @param {object} params - 用户参数对象
 * @param {string} params.username - 用户名
 * @param {string} params.passwordHash - 密码哈希值，默认为null
 * @param {string} params.role - 用户角色，默认为'user'
 * @param {number} params.mailboxLimit - 邮箱数量限制，默认为10
 * @returns {Promise<object>} 创建的用户信息对象
 * @throws {Error} 当用户名为空时抛出异常
 */
export async function createUser(db, { username, passwordHash = null, role = 'user', mailboxLimit = 10 }) {
  const uname = String(username || '').trim().toLowerCase();
  if (!uname) {
    throw new Error('用户名不能为空');
  }
  const r = await db.prepare('INSERT INTO users (username, password_hash, role, mailbox_limit) VALUES (?, ?, ?, ?)')
    .bind(uname, passwordHash, role, Math.max(0, Number(mailboxLimit || 10))).run();
  void r;
  const res = await db.prepare('SELECT id, username, role, mailbox_limit, created_at, telegram_chat_id, telegram_username FROM users WHERE username = ? LIMIT 1')
    .bind(uname).all();
  return res?.results?.[0];
}

/**
 * 更新用户信息
 * @param {object} db - 数据库连接对象
 * @param {number} userId - 用户ID
 * @param {object} fields - 需要更新的字段对象
 * @returns {Promise<void>} 更新完成后无返回值
 */
export async function updateUser(db, userId, fields) {
  const allowed = ['role', 'mailbox_limit', 'password_hash', 'can_send', 'telegram_chat_id', 'telegram_username'];
  const setClauses = [];
  const values = [];
  for (const key of allowed) {
    if (key in (fields || {})) {
      setClauses.push(`${key} = ?`);
      values.push(fields[key]);
    }
  }
  if (!setClauses.length) {
    return;
  }
  const sql = `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`;
  values.push(userId);
  await db.prepare(sql).bind(...values).run();
  
  // 使相关缓存失效
  const { invalidateUserQuotaCache, invalidateSystemStatCache } = await import('./cacheHelper.js');
  if ('mailbox_limit' in fields) {
    invalidateUserQuotaCache(userId);
  }
  if ('can_send' in fields) {
    invalidateSystemStatCache(`user_can_send_${userId}`);
  }
}

/**
 * 删除用户，关联表会自动级联删除
 * @param {object} db - 数据库连接对象
 * @param {number} userId - 用户ID
 * @returns {Promise<void>} 删除完成后无返回值
 */
export async function deleteUser(db, userId) {
  // 关联表启用 ON DELETE CASCADE
  await db.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
}

/**
 * 列出用户及其邮箱数量统计
 * @param {object} db - 数据库连接对象
 * @param {object} options - 查询选项
 * @param {number} options.limit - 每页数量限制，默认50
 * @param {number} options.offset - 偏移量，默认0
 * @param {string} options.sort - 排序方向，'asc' 或 'desc'，默认'desc'
 * @returns {Promise<Array<object>>} 用户列表数组
 */
export async function listUsersWithCounts(db, { limit = 50, offset = 0, sort = 'desc' } = {}) {
  const orderDirection = (sort === 'asc') ? 'ASC' : 'DESC';
  const actualLimit = Math.max(1, Math.min(100, Number(limit) || 50));
  const actualOffset = Math.max(0, Number(offset) || 0);
  
  // 优化：先获取用户列表，再单独查询邮箱数量，避免子查询扫描全表
  const usersSql = `
    SELECT u.id, u.username, u.role, u.mailbox_limit, u.can_send, u.created_at
    FROM users u
    ORDER BY datetime(u.created_at) ${orderDirection}
    LIMIT ? OFFSET ?
  `;
  const { results: users } = await db.prepare(usersSql).bind(actualLimit, actualOffset).all();
  
  if (!users || users.length === 0) {
    return [];
  }
  
  // 批量查询这些用户的邮箱数量
  const userIds = users.map(u => u.id);
  const placeholders = userIds.map(() => '?').join(',');
  const countSql = `
    SELECT user_id, COUNT(1) AS c 
    FROM user_mailboxes 
    WHERE user_id IN (${placeholders})
    GROUP BY user_id
  `;
  const { results: counts } = await db.prepare(countSql).bind(...userIds).all();
  
  // 构建计数映射
  const countMap = new Map();
  for (const row of (counts || [])) {
    countMap.set(row.user_id, row.c);
  }
  
  // 合并结果
  return users.map(u => ({
    ...u,
    mailbox_count: countMap.get(u.id) || 0
  }));
}

/**
 * 分配邮箱给用户
 * @param {object} db - 数据库连接对象
 * @param {object} params - 分配参数对象
 * @param {number} params.userId - 用户ID，可选
 * @param {string} params.username - 用户名，可选（userId和username至少提供一个）
 * @param {string} params.address - 邮箱地址
 * @returns {Promise<object>} 分配结果对象
 * @throws {Error} 当邮箱地址无效、用户不存在或达到邮箱上限时抛出异常
 */
export async function assignMailboxToUser(db, { userId = null, username = null, address }) {
  const { getCachedUserQuota, invalidateUserQuotaCache } = await import('./cacheHelper.js');
  
  const normalized = String(address || '').trim().toLowerCase();
  if (!normalized) {
    throw new Error('邮箱地址无效');
  }
  // 查询或创建邮箱
  const mailboxId = await getOrCreateMailboxId(db, normalized);

  // 获取用户 ID
  let uid = userId;
  if (!uid) {
    const uname = String(username || '').trim().toLowerCase();
    if (!uname) {
      throw new Error('缺少用户标识');
    }
    const r = await db.prepare('SELECT id FROM users WHERE username = ? LIMIT 1').bind(uname).all();
    if (!r.results || !r.results.length) {
      throw new Error('用户不存在');
    }
    uid = r.results[0].id;
  }

  // 使用缓存校验上限
  const quota = await getCachedUserQuota(db, uid);
  if (quota.used >= quota.limit) {
    throw new Error('已达到邮箱上限');
  }

  // 绑定（唯一约束避免重复）
  await db.prepare('INSERT OR IGNORE INTO user_mailboxes (user_id, mailbox_id) VALUES (?, ?)').bind(uid, mailboxId).run();
  
  // 使缓存失效，下次查询时会重新获取
  invalidateUserQuotaCache(uid);
  
  return { success: true };
}

/**
 * 获取用户的所有邮箱列表
 * @param {object} db - 数据库连接对象
 * @param {number} userId - 用户ID
 * @param {number} limit - 查询数量限制，默认100
 * @returns {Promise<Array<object>>} 用户邮箱列表数组，包含地址、创建时间和置顶状态
 */
export async function getUserMailboxes(db, userId, limit = 100) {
  const sql = `
    SELECT m.address, m.created_at, um.is_pinned,
           COALESCE(m.can_login, 0) AS can_login
    FROM user_mailboxes um
    JOIN mailboxes m ON m.id = um.mailbox_id
    WHERE um.user_id = ?
    ORDER BY um.is_pinned DESC, datetime(m.created_at) DESC
    LIMIT ?
  `;
  const { results } = await db.prepare(sql).bind(userId, Math.min(limit, 200)).all();
  return results || [];
}

/**
 * 取消邮箱分配，解除用户与邮箱的绑定关系
 * @param {object} db - 数据库连接对象
 * @param {object} params - 取消分配参数对象
 * @param {number} params.userId - 用户ID，可选
 * @param {string} params.username - 用户名，可选（userId和username至少提供一个）
 * @param {string} params.address - 邮箱地址
 * @returns {Promise<object>} 取消分配结果对象
 * @throws {Error} 当邮箱地址无效、用户不存在或邮箱未分配给该用户时抛出异常
 */
export async function unassignMailboxFromUser(db, { userId = null, username = null, address }) {
  const { invalidateUserQuotaCache } = await import('./cacheHelper.js');
  
  const normalized = String(address || '').trim().toLowerCase();
  if (!normalized) {
    throw new Error('邮箱地址无效');
  }
  
  // 获取邮箱ID
  const mailboxId = await getMailboxIdByAddress(db, normalized);
  if (!mailboxId) {
    throw new Error('邮箱不存在');
  }

  // 获取用户ID
  let uid = userId;
  if (!uid) {
    const uname = String(username || '').trim().toLowerCase();
    if (!uname) {
      throw new Error('缺少用户标识');
    }
    const r = await db.prepare('SELECT id FROM users WHERE username = ? LIMIT 1').bind(uname).all();
    if (!r.results || !r.results.length) {
      throw new Error('用户不存在');
    }
    uid = r.results[0].id;
  }

  // 检查绑定关系是否存在
  const checkRes = await db.prepare('SELECT id FROM user_mailboxes WHERE user_id = ? AND mailbox_id = ? LIMIT 1')
    .bind(uid, mailboxId).all();
  if (!checkRes.results || checkRes.results.length === 0) {
    throw new Error('该邮箱未分配给该用户');
  }

  // 删除绑定关系
  await db.prepare('DELETE FROM user_mailboxes WHERE user_id = ? AND mailbox_id = ?')
    .bind(uid, mailboxId).run();
  
  // 使缓存失效
  invalidateUserQuotaCache(uid);
  
  return { success: true };
}

/**
 * 根据 Telegram Chat ID 获取用户
 * @param {object} db - 数据库连接对象
 * @param {string} chatId - Telegram Chat ID
 * @returns {Promise<object|null>} 用户信息对象，如果不存在返回null
 */
export async function getUserByTelegramId(db, chatId) {
  if (!chatId) {return null;}
  const { results } = await db.prepare('SELECT id, username, role, mailbox_limit, can_send, telegram_chat_id FROM users WHERE telegram_chat_id = ? LIMIT 1').bind(String(chatId)).all();
  return results && results.length > 0 ? results[0] : null;
}

/**
 * 获取邮箱的最新邮件
 * @param {object} db - 数据库连接对象
 * @param {number} mailboxId - 邮箱ID
 * @returns {Promise<object|null>} 最新邮件对象
 */
export async function getLatestMessage(db, mailboxId) {
  if (!mailboxId) {return null;}
  const { results } = await db.prepare('SELECT id, sender, subject, preview, verification_code, received_at FROM messages WHERE mailbox_id = ? ORDER BY received_at DESC LIMIT 1').bind(mailboxId).all();
  return results && results.length > 0 ? results[0] : null;
}

/**
 * 获取系统中所有邮箱的总数量
 * @param {object} db - 数据库连接对象
 * @returns {Promise<number>} 系统中所有邮箱的总数量
 */
export async function getTotalMailboxCount(db) {
  const { getCachedSystemStat } = await import('./cacheHelper.js');
  
  try {
    // 使用缓存避免频繁的 COUNT 全表扫描
    return await getCachedSystemStat(db, 'total_mailboxes', async(db) => {
      const result = await db.prepare('SELECT COUNT(1) AS count FROM mailboxes').all();
      return result?.results?.[0]?.count || 0;
    });
  } catch (error) {
    console.error('获取系统邮箱总数失败:', error);
    return 0;
  }
}

/**
 * 记录域名访问（用于自动发现）
 * @param {object} db - 数据库连接对象
 * @param {string} domain - 域名
 * @returns {Promise<void>}
 */
export async function recordDomain(db, domain) {
  const d = String(domain || '').trim().toLowerCase();
  if (!d || d.includes('localhost') || d.includes('127.0.0.1')) {return;}
    
  // 尝试更新 last_seen_at 和 is_active
  const res = await db.prepare('UPDATE domains SET last_seen_at = CURRENT_TIMESTAMP, is_active = 1 WHERE domain = ?').bind(d).run();
    
  // 如果没有更新到记录（说明不存在），则插入
  if (res.meta && res.meta.changes === 0) {
    await db.prepare('INSERT OR IGNORE INTO domains (domain, is_active) VALUES (?, 1)').bind(d).run();
  }
}

let lastSyncTime = 0;
const SYNC_INTERVAL = 60000; // 1分钟同步一次

/**
 * 同步域名列表（自动识别添加和删除）
 * @param {object} db - 数据库连接对象
 * @param {Array<string>} currentDomains - 当前环境变量中的域名列表
 * @param {boolean} force - 是否强制同步
 * @returns {Promise<void>}
 */
export async function syncDomains(db, currentDomains, force = false) {
  const now = Date.now();
  if (!force && (now - lastSyncTime < SYNC_INTERVAL)) {
    return;
  }
  lastSyncTime = now;

  if (!Array.isArray(currentDomains) || currentDomains.length === 0) {return;}

  const normalizedCurrent = currentDomains
    .map(d => String(d || '').trim().toLowerCase())
    .filter(d => d && !d.includes('localhost') && !d.includes('127.0.0.1'));
    
  const currentSet = new Set(normalizedCurrent);

  // 1. 获取数据库中所有当前标记为活跃的域名
  const { results } = await db.prepare('SELECT domain FROM domains WHERE is_active = 1').all();
  const dbActiveDomains = (results || []).map(r => r.domain);
  const dbActiveSet = new Set(dbActiveDomains);

  // 2. 找出需要停用的域名 (在DB中活跃，但不在环境变量中)
  const toDeactivate = dbActiveDomains.filter(d => !currentSet.has(d));

  // 3. 找出需要添加或激活的域名 (在环境变量中)
  // 这一步其实可以通过遍历 normalizedCurrent 调用 recordDomain 来完成
  // 但为了性能，我们可以只针对“不在DB活跃列表”的域名调用 recordDomain，
  // 对于已经在DB活跃列表的，我们也可以选择不更新 last_seen_at 或者批量更新。
  // 为了简单和保证 last_seen_at 更新，我们还是对所有 currentDomains 调用 recordDomain 比较稳妥，
  // 但为了减少数据库压力，可以只对 "不在dbActiveSet" 的调用 recordDomain，
  // 对于 "在dbActiveSet" 的，也许不需要每次都更新 last_seen_at？
  // 用户需求是“自动识别”，所以只要保证状态正确即可。
    
  // 批量处理停用
  if (toDeactivate.length > 0) {
    const placeholders = toDeactivate.map(() => '?').join(',');
    await db.prepare(`UPDATE domains SET is_active = 0 WHERE domain IN (${placeholders})`)
      .bind(...toDeactivate).run();
  }

  // 批量处理激活/更新
  // 我们对所有当前域名执行 recordDomain，确保它们存在且活跃
  // 为了避免 N 次 SQL，我们可以优化。但考虑到域名数量通常很少（<20），循环调用 recordDomain 问题不大。
  // 而且 recordDomain 内部是 1 次 SQL (UPDATE) 或 2 次 (UPDATE + INSERT)。
  // 如果想要极致优化，可以先过滤。
    
  const toAddOrUpdate = normalizedCurrent;
  for (const domain of toAddOrUpdate) {
    await recordDomain(db, domain);
  }
}

/**
 * 获取所有活跃域名
 * @param {object} db - 数据库连接对象
 * @returns {Promise<Array<string>>} 域名列表
 */
export async function getActiveDomains(db) {
  const { results } = await db.prepare('SELECT domain FROM domains WHERE is_active = 1 ORDER BY last_seen_at DESC').all();
  return (results || []).map(r => r.domain);
}

/**
 * 获取域名统计信息
 * @param {object} db - 数据库连接对象
 * @returns {Promise<object>} { active, inactive, total }
 */
export async function getDomainStats(db) {
  const activeRes = await db.prepare('SELECT COUNT(1) as count FROM domains WHERE is_active = 1').all();
  const totalRes = await db.prepare('SELECT COUNT(1) as count FROM domains').all();
  const active = activeRes.results?.[0]?.count || 0;
  const total = totalRes.results?.[0]?.count || 0;
  return {
    active,
    inactive: total - active,
    total
  };
}

export async function isSenderBlocked(db, sender) {
  const s = String(sender || '').trim().toLowerCase();
  if (!s) {return false;}
  const at = s.lastIndexOf('@');
  let domain = '';
  if (at > -1 && at < s.length - 1) {
    domain = s.slice(at + 1);
  }
  const patterns = [];
  patterns.push(s);
  if (domain) {
    patterns.push(domain);
  }
  if (!patterns.length) {return false;}
  const placeholders = patterns.map(() => '?').join(',');
  const res = await db.prepare(
    `SELECT 1 FROM blocked_senders WHERE (type = 'email' AND pattern IN (${placeholders}))
         OR (type = 'domain' AND pattern IN (${placeholders})) LIMIT 1`
  ).bind(...patterns, ...patterns).all();
  return !!(res?.results && res.results.length > 0);
}

export async function listBlockedSenders(db, limit = 100, offset = 0) {
  const l = Math.min(Math.max(Number(limit) || 20, 1), 200);
  const o = Math.max(Number(offset) || 0, 0);
  const { results } = await db.prepare('SELECT id, pattern, type, reason, created_at FROM blocked_senders ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .bind(l, o).all();
  return results || [];
}

export async function addBlockedSender(db, pattern, type = 'email', reason = null) {
  const p = String(pattern || '').trim().toLowerCase();
  const t = type === 'domain' ? 'domain' : 'email';
  if (!p) {return null;}
  await db.prepare('INSERT INTO blocked_senders (pattern, type, reason) VALUES (?, ?, ?)')
    .bind(p, t, reason || null).run();
  const { results } = await db.prepare('SELECT id, pattern, type, reason, created_at FROM blocked_senders WHERE pattern = ? AND type = ? ORDER BY id DESC LIMIT 1')
    .bind(p, t).all();
  return results?.[0] || null;
}

export async function deleteBlockedSender(db, id) {
  const rid = Number(id || 0);
  if (!rid) {return 0;}
  const res = await db.prepare('DELETE FROM blocked_senders WHERE id = ?').bind(rid).run();
  return res?.meta?.changes || 0;
}

export async function setMessagePinned(db, messageId, isPinned) {
  const mid = Number(messageId || 0);
  const pinVal = isPinned ? 1 : 0;
  if (!mid) {return false;}
  const res = await db.prepare('UPDATE messages SET is_pinned = ? WHERE id = ?')
    .bind(pinVal, mid).run();
  return (res?.meta?.changes || 0) > 0;
}

let lastMessageCleanupTime = 0;
const MESSAGE_CLEANUP_INTERVAL = 60 * 60 * 1000;

export async function cleanupOldMessages(db, days = 60, force = false) {
  const now = Date.now();
  if (!force && now - lastMessageCleanupTime < MESSAGE_CLEANUP_INTERVAL) {
    return 0;
  }
  lastMessageCleanupTime = now;
  const defaultDays = Math.max(1, Number(days) || 60);
  const mailboxRes = await db.prepare('SELECT id, retention_days FROM mailboxes').all();
  const mailboxes = mailboxRes?.results || [];
  let totalDeleted = 0;
  if (!mailboxes.length) {
    const cutoff = new Date(now - defaultDays * 86400000).toISOString();
    const res = await db.prepare('DELETE FROM messages WHERE is_pinned = 0 AND datetime(received_at) < datetime(?)').bind(cutoff).run();
    return res?.meta?.changes || 0;
  }
  for (const mb of mailboxes) {
    const daysForMailbox = Math.max(1, Number(mb.retention_days || defaultDays));
    const cutoff = new Date(now - daysForMailbox * 86400000).toISOString();
    const res = await db.prepare('DELETE FROM messages WHERE mailbox_id = ? AND is_pinned = 0 AND datetime(received_at) < datetime(?)')
      .bind(mb.id, cutoff).run();
    if (res?.meta?.changes) {
      totalDeleted += res.meta.changes;
    }
  }
  return totalDeleted;
}
