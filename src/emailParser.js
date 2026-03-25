 
/**
 * 解析邮件正文，提取文本和HTML内容
 * @param {string} raw - 原始邮件内容
 * @returns {object} 包含text和html属性的对象
 */
export function parseEmailBody(raw) {
  if (!raw) {return { text: '', html: '' };}
  const { headers: topHeaders, body: topBody } = splitHeadersAndBody(raw);
  return parseEntity(topHeaders, topBody);
}

/**
 * 解析邮件实体内容，处理单体和多部分内容
 * @param {object} headers - 邮件头部对象
 * @param {string} body - 邮件正文内容
 * @returns {object} 包含text和html属性的对象
 */
function parseEntity(headers, body) {
  // 注意：boundary 区分大小写，不能对 content-type 整体小写后再提取
  const ctRaw = headers['content-type'] || '';
  const ct = ctRaw.toLowerCase();
  const transferEnc = (headers['content-transfer-encoding'] || '').toLowerCase();
  const boundary = getBoundary(ctRaw);

  // 单体：text/html 或 text/plain
  if (!ct.startsWith('multipart/')) {
    const decoded = decodeBodyWithCharset(body, transferEnc, ct);
    const isHtml = ct.includes('text/html');
    const isText = ct.includes('text/plain') || !isHtml;
    // 某些邮件不带 content-type 或是 message/rfc822 等，将其作为纯文本尝试
    if (!ct || ct === '') {
      const guessHtml = guessHtmlFromRaw(decoded || body || '');
      if (guessHtml) {return { text: '', html: guessHtml };}
    }
    return { text: isText ? decoded : '', html: isHtml ? decoded : '' };
  }

  // 复合：递归解析，优先取 text/html，再退回 text/plain
  let text = '';
  let html = '';
  if (boundary) {
    const parts = splitMultipart(body, boundary);
    for (const part of parts) {
      const { headers: ph, body: pb } = splitHeadersAndBody(part);
      const pct = (ph['content-type'] || '').toLowerCase();
      // 对转发/嵌套邮件的更强兼容：
      // 1) message/rfc822（完整原始邮件作为 part）
      // 2) text/rfc822-headers（仅头部）后常跟随一个 text/html 或 text/plain 部分
      // 3) 某些服务会将原始邮件整体放在 text/plain/base64 中，里面再包含 HTML 片段
      if (pct.startsWith('multipart/')) {
        const nested = parseEntity(ph, pb);
        if (!html && nested.html) {html = nested.html;}
        if (!text && nested.text) {text = nested.text;}
      } else if (pct.startsWith('message/rfc822')) {
        const nested = parseEmailBody(pb);
        if (!html && nested.html) {html = nested.html;}
        if (!text && nested.text) {text = nested.text;}
      } else if (pct.includes('rfc822-headers')) {
        // 跳过纯头部，尝试在后续 part 中抓取正文
        continue;
      } else {
        const res = parseEntity(ph, pb);
        if (!html && res.html) {html = res.html;}
        if (!text && res.text) {text = res.text;}
      }
      if (text && html) {break;}
    }
  }

  // 如果仍无 html，尝试在原始体里直接抓取 HTML 片段（处理某些非标准邮件）
  if (!html) {
    // 尝试从各 part 的原始体里猜测 HTML（有些邮件未正确声明 content-type）
    html = guessHtmlFromRaw(body);
    // 如果仍为空，且 text 存在 HTML 痕迹（如标签密集），尝试容错解析
    if (!html && /<\w+[\s\S]*?>[\s\S]*<\/\w+>/.test(body || '')) {
      html = body;
    }
  }
  // 如果还没有 html，但有 text，用简单换行转 <br> 的方式提供可读 html
  if (!html && text) {
    html = textToHtml(text);
  }
  return { text, html };
}

/**
 * 分割邮件头部和正文
 * @param {string} input - 包含头部和正文的完整邮件内容
 * @returns {object} 包含headers对象和body字符串的对象
 */
function splitHeadersAndBody(input) {
  const idx = input.indexOf('\r\n\r\n');
  const idx2 = idx === -1 ? input.indexOf('\n\n') : idx;
  const sep = idx !== -1 ? 4 : (idx2 !== -1 ? 2 : -1);
  if (sep === -1) {return { headers: {}, body: input };}
  const rawHeaders = input.slice(0, (idx !== -1 ? idx : idx2));
  const body = input.slice((idx !== -1 ? idx : idx2) + sep);
  return { headers: parseHeaders(rawHeaders), body };
}

/**
 * 解析邮件头部字符串为对象
 * @param {string} rawHeaders - 原始头部字符串
 * @returns {object} 头部字段对象，键为小写的头部名称
 */
function parseHeaders(rawHeaders) {
  const headers = {};
  const lines = rawHeaders.split(/\r?\n/);
  let lastKey = '';
  for (const line of lines) {
    if (/^\s/.test(line) && lastKey) {
      headers[lastKey] += ' ' + line.trim();
      continue;
    }
    const m = line.match(/^([^:]+):\s*(.*)$/);
    if (m) {
      lastKey = m[1].toLowerCase();
      headers[lastKey] = m[2];
    }
  }
  return headers;
}

/**
 * 从Content-Type头部中提取boundary分隔符
 * @param {string} contentType - Content-Type头部值
 * @returns {string} boundary分隔符，如果没有找到返回空字符串
 */
function getBoundary(contentType) {
  if (!contentType) {return '';}
  // 不改变大小写以保留 boundary 原值；用不区分大小写的匹配
  const m = contentType.match(/boundary\s*=\s*"?([^";\r\n]+)"?/i);
  return m ? m[1].trim() : '';
}

/**
 * 根据boundary分隔符分割多部分邮件正文
 * @param {string} body - 多部分邮件正文
 * @param {string} boundary - boundary分隔符
 * @returns {Array<string>} 分割后的部分数组
 */
function splitMultipart(body, boundary) {
  // 容错：RFC 规定分隔行形如 "--boundary" 与终止 "--boundary--"；
  // 这里允许前后空白、以及行中仅包含该标记
  const delim = '--' + boundary;
  const endDelim = delim + '--';
  const lines = body.split(/\r?\n/);
  const parts = [];
  let current = [];
  let inPart = false;
  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (line.trim() === delim) {
      if (inPart && current.length) {parts.push(current.join('\n'));}
      current = [];
      inPart = true;
      continue;
    }
    if (line.trim() === endDelim) {
      if (inPart && current.length) {parts.push(current.join('\n'));}
      break;
    }
    if (inPart) {current.push(rawLine);}
  }
  return parts;
}

/**
 * 根据传输编码解码邮件正文
 * @param {string} body - 编码的正文内容
 * @param {string} transferEncoding - 传输编码类型（base64、quoted-printable等）
 * @returns {string} 解码后的正文内容
 */
function decodeBody(body, transferEncoding) {
  if (!body) {return '';}
  const enc = transferEncoding.trim();
  if (enc === 'base64') {
    const cleaned = body.replace(/\s+/g, '');
    try {
      const bin = atob(cleaned);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {bytes[i] = bin.charCodeAt(i);}
      try {
        return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      } catch (err) {
        void err;
        return bin;
      }
    } catch (err) {
      void err;
      return body;
    }
  }
  if (enc === 'quoted-printable') {
    return decodeQuotedPrintable(body);
  }
  // 7bit/8bit/binary 直接返回
  return body;
}

/**
 * 根据Content-Type中的charset和传输编码解码正文
 * @param {string} body - 编码的正文内容
 * @param {string} transferEncoding - 传输编码类型
 * @param {string} contentType - Content-Type头部值，包含charset信息
 * @returns {string} 解码后的正文内容
 */
function decodeBodyWithCharset(body, transferEncoding, contentType) {
  const decodedRaw = decodeBody(body, transferEncoding);
  // base64/qp 已按 utf-8 解码为字符串；若 charset 指定为 gbk/gb2312 等，尝试再次按该编码解码
  const m = /charset\s*=\s*"?([^";]+)/i.exec(contentType || '');
  const charset = (m && m[1] ? m[1].trim().toLowerCase() : '') || 'utf-8';
  if (!decodedRaw) {return '';}
  if (charset === 'utf-8' || charset === 'utf8' || charset === 'us-ascii') {return decodedRaw;}
  try {
    const bytes = new Uint8Array(decodedRaw.split('').map(c => c.charCodeAt(0)));
    return new TextDecoder(charset, { fatal: false }).decode(bytes);
  } catch (err) {
    void err;
    return decodedRaw;
  }
}

/**
 * 解码Quoted-Printable编码的内容
 * @param {string} input - Quoted-Printable编码的字符串
 * @returns {string} 解码后的字符串
 */
function decodeQuotedPrintable(input) {
  const s = input.replace(/=\r?\n/g, '');
  const bytes = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '=' && i + 2 < s.length) {
      const hex = s.substring(i + 1, i + 3);
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16));
        i += 2;
        continue;
      }
    }
    bytes.push(ch.charCodeAt(0));
  }
  try {
    return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
  } catch (err) {
    void err;
    return s;
  }
}

/**
 * 从原始内容中猜测并提取HTML片段
 * @param {string} raw - 原始内容
 * @returns {string} 提取的HTML内容，如果没有找到返回空字符串
 */
function guessHtmlFromRaw(raw) {
  if (!raw) {return '';}
  const lower = raw.toLowerCase();
  let hs = lower.indexOf('<html');
  if (hs === -1) {hs = lower.indexOf('<!doctype html');}
  if (hs !== -1) {
    const he = lower.lastIndexOf('</html>');
    if (he !== -1) {return raw.slice(hs, he + 7);}
  }
  return '';
}

/**
 * 转义HTML特殊字符
 * @param {string} s - 需要转义的字符串
 * @returns {string} 转义后的字符串
 */
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'': '&#39;' }[c] || c));
}

/**
 * 将纯文本转换为HTML格式，保持空白格式
 * @param {string} text - 纯文本内容
 * @returns {string} HTML格式的内容
 */
function textToHtml(text) {
  return `<div style="white-space:pre-wrap">${escapeHtml(text)}</div>`;
}

/**
 * 将HTML内容转换为纯文本，去除标签、脚本、样式等
 * @param {string} html - HTML内容
 * @returns {string} 转换后的纯文本内容
 */
function stripHtml(html) {
  const s = String(html || '');
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, (_, n) => {
      try { return String.fromCharCode(parseInt(n, 10)); } catch (err) { void err; return ' '; }
    })
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 从邮件主题、文本和HTML中智能提取验证码（3-8位数字，支持各种分隔与多语言）
 * 覆盖：纯数字、带分隔(空格/横线/点/逗号)、主题/正文/URL参数、多语言关键词、宽松兜底
 */
export function extractVerificationCode({ subject = '', text = '', html = '' } = {}) {
  const subjectText = String(subject || '');
  const textBody = String(text || '');
  const htmlBody = stripHtml(html);
  const sources = {
    subject: subjectText,
    body: `${textBody} ${htmlBody}`.trim()
  };

  const minLen = 3;
  const maxLen = 8;

  function normalizeDigits(s) {
    const digits = String(s || '').replace(/\D+/g, '');
    if (digits.length >= minLen && digits.length <= maxLen) { return digits; }
    return '';
  }

  // 分隔符：空格、横线、点、逗号、下划线、不间断空格等（覆盖 123 456 / 123-456 / 123.456 / 123,456）
  const SEP_CLASS_RE = /[\u00A0\s–—_.·•∙‧,''-]/;
  const CODE_CHUNK_RE = new RegExp(`([0-9](?:${SEP_CLASS_RE.source}?[0-9]){2,7})`);
  const KW_RE = /(?:verification|one[-\s]?time|two[-\s]?factor|2fa|security|auth|login|confirm|code|otp|pin|password|digit|number|enter|provided|above|below|following|as\s+follows|use\s+the\s+following|验证码|校验码|驗證碼|確認碼|認證碼|登录码|动态码|临时验证码|一次性|有效期|認証コード|인증코드|코드)/i;

  const NOT_DIGIT_20 = /[^\n\r\d]{0,20}/;
  const NOT_DIGIT_30 = /[^\n\r\d]{0,30}/;
  const NOT_DIGIT_80 = /[^\n\r\d]{0,80}/;
  const NOT_DIGIT_150 = /[^\n\r\d]{0,150}/;
  const LB_NO_DIGIT = /(?<!\d)/;
  const LA_NO_DIGIT = /(?!\d)/;

  function tryReturn(n, body, subj) {
    if (!n) {
      return null;
    }
    if (n.length === 3) {
      const ctx = (body + ' ' + (subj || '')).toLowerCase();
      if (!/(?:pin|3[- ]?digit|three\s*digit|验证码|校验码|코드|security\s*code)/i.test(ctx)) { return null; }
    }
    if (!isLikelyNonVerificationCode(n, body)) { return n; }
    return null;
  }

  // 1) 从 URL 参数中提取 ?code=123456 或 &code=123456（常见于邮件内链接）
  const urlCodeMatch = sources.body.match(/[?&]code=([0-9]{3,8})(?:&|$|[^\d])/i);
  if (urlCodeMatch && urlCodeMatch[1]) {
    const n = urlCodeMatch[1];
    if (n.length >= 4 && !isLikelyNonVerificationCode(n, sources.body)) { return n; }
  }

  // 2) subject 关键词 + 数字（双向）
  const subjectOrdereds = [
    new RegExp(`${KW_RE.source}${NOT_DIGIT_20.source}${LB_NO_DIGIT.source}${CODE_CHUNK_RE.source}${LA_NO_DIGIT.source}`, 'i'),
    new RegExp(`${LB_NO_DIGIT.source}${CODE_CHUNK_RE.source}${LA_NO_DIGIT.source}${NOT_DIGIT_20.source}${KW_RE.source}`, 'i')
  ];
  for (const r of subjectOrdereds) {
    const m = sources.subject.match(r);
    if (m && m[1]) {
      const n = normalizeDigits(m[1]);
      if (n && (n.length >= 4 || /(?:pin|otp|code|验证码)\s*(?:for|is|:)?/i.test(sources.subject))) {
        const out = tryReturn(n, sources.body, sources.subject);
        if (out) {
          return out;
        }
      }
    }
  }

  // 3) 正文 关键词 + 数字（双向，30 字符内）
  const bodyOrdereds = [
    new RegExp(`${KW_RE.source}${NOT_DIGIT_30.source}${LB_NO_DIGIT.source}${CODE_CHUNK_RE.source}${LA_NO_DIGIT.source}`, 'i'),
    new RegExp(`${LB_NO_DIGIT.source}${CODE_CHUNK_RE.source}${LA_NO_DIGIT.source}${NOT_DIGIT_30.source}${KW_RE.source}`, 'i')
  ];
  for (const r of bodyOrdereds) {
    const m = sources.body.match(r);
    if (m && m[1]) {
      const n = normalizeDigits(m[1]);
      const out = tryReturn(n, sources.body, sources.subject);
      if (out) {
        return out;
      }
    }
  }

  // 4) 宽松 80 字符
  const looseBodyOrdereds = [
    new RegExp(`${KW_RE.source}${NOT_DIGIT_80.source}${LB_NO_DIGIT.source}${CODE_CHUNK_RE.source}${LA_NO_DIGIT.source}`, 'i'),
    new RegExp(`${LB_NO_DIGIT.source}${CODE_CHUNK_RE.source}${LA_NO_DIGIT.source}${NOT_DIGIT_80.source}${KW_RE.source}`, 'i')
  ];
  for (const r of looseBodyOrdereds) {
    const m = sources.body.match(r);
    if (m && m[1]) {
      const n = normalizeDigits(m[1]);
      const out = tryReturn(n, sources.body, sources.subject);
      if (out) {
        return out;
      }
    }
  }

  // 5) 主题或正文有 OTP/验证码 提示时，正文中任意 3-8 位数字（首过筛的为准）
  const subjectHasOtpHint = /(?:otp|verification|验证码|校验码|code|confirm|login|auth|pin|enter|安全|一次性)\s*(?:for|is|:)?/i.test(sources.subject);
  const bodyHasOtpHint = /(?:otp|verification|验证码|校验码|your\s+code|enter\s+(?:the\s+)?code|code\s+is|provided\s+above|above|below|as\s+follows|安全码|登录码|临时|一次性|有效期)/i.test(sources.body);
  if ((subjectHasOtpHint || bodyHasOtpHint) && sources.body) {
    const anyCodeRe = new RegExp(`${LB_NO_DIGIT.source}${CODE_CHUNK_RE.source}${LA_NO_DIGIT.source}`, 'g');
    let match;
    while ((match = anyCodeRe.exec(sources.body)) !== null) {
      const n = normalizeDigits(match[1]);
      const out = tryReturn(n, sources.body, sources.subject);
      if (out) {
        return out;
      }
    }
  }

  // 6) 超宽松 150 字符兜底
  const ultraLoose = [
    new RegExp(`${KW_RE.source}${NOT_DIGIT_150.source}${LB_NO_DIGIT.source}${CODE_CHUNK_RE.source}${LA_NO_DIGIT.source}`, 'i'),
    new RegExp(`${LB_NO_DIGIT.source}${CODE_CHUNK_RE.source}${LA_NO_DIGIT.source}${NOT_DIGIT_150.source}${KW_RE.source}`, 'i')
  ];
  for (const r of ultraLoose) {
    const m = sources.body.match(r);
    if (m && m[1]) {
      const n = normalizeDigits(m[1]);
      const out = tryReturn(n, sources.body, sources.subject);
      if (out) {
        return out;
      }
    }
  }

  return '';
}

/**
 * 从邮件中提取登录/验证链接
 * @param {object} params - 提取参数对象
 * @returns {string} 提取的链接，未找到返回空字符串
 */
export function extractLoginLink({ text = '', html = '' } = {}) {
  const textBody = String(text || '');
  const htmlBody = String(html || '');

  const linkRe = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1[^>]*>(.*?)<\/a>/gi;
  let match;

  // 按钮/链接文字关键词（中英 + 常见 CTA）
  const btnKeywords = /登录|验证|确认|打开|点击|授权|激活|Login|Log\s*in|Verify|Confirm|Sign\s*in|Get\s*started|Authorize|Activate|Continue|Click\s*here|Magic\s*link/i;

  // 1a. 先按按钮文字匹配
  while ((match = linkRe.exec(htmlBody)) !== null) {
    const href = match[2];
    const linkText = match[3];
    const cleanText = linkText.replace(/<[^>]+>/g, '').trim();
    if (btnKeywords.test(cleanText) && href.match(/^https?:\/\//i) && !isLikelyPublicLink(href)) {
      return decodeHtmlEntities(href);
    }
  }

  // 协议相对 URL 转为 https
  function ensureAbsolute(h) {
    if (!h) {
      return h;
    }
    const trimmed = h.trim();
    if (/^\/\//.test(trimmed)) { return 'https:' + trimmed; }
    return trimmed;
  }

  // 1b. 再按 href 本身是否像“登录/验证/魔法链接”（不依赖按钮文字，避免漏掉）
  const authPathPattern = /\/(verify|confirm|auth|login|magic|sign[-_]?in|activate|authorize|one[-_]?time|otp|verify[-_]?email|confirm[-_]?email|reset[-_]?password|sign[-_]?up|accept[-_]?invite|invitation|validate|authenticate)(?:[-_]?(?:link|magic|token|email))?/i;
  const hrefAuthLike = (href) => {
    const h = ensureAbsolute(href);
    if (!h || !h.match(/^https?:\/\//i) || isLikelyPublicLink(h)) {
      return false;
    }
    const hasToken = /[?&]token=/i.test(h);
    const hasCode = /[?&]code=/i.test(h);
    return (hasToken || (hasCode && authPathPattern.test(h)) || authPathPattern.test(h));
  };
  linkRe.lastIndex = 0;
  while ((match = linkRe.exec(htmlBody)) !== null) {
    const href = decodeHtmlEntities(match[2]);
    const absolute = ensureAbsolute(href);
    if (hrefAuthLike(absolute)) { return cleanUrl(absolute); }
  }

  // 2. 合并折行 URL（以 = 或 & 结尾的片段与下一行拼接后再识别）
  const mergedForUrls = mergeWrappedUrls(textBody + '\n' + htmlBody);

  // 3. 从整段文本中提取所有 URL（含 https 与协议相对），再筛选“认证类”并取最优
  const urlRe = /https?:\/\/[^\s<>"'()]+/gi;
  const protocolRelativeRe = /(?:^|[\s"'<>(])(\/\/[^\s<>"'()]+)/gi;
  const candidates = [];
  let urlMatch;
  while ((urlMatch = urlRe.exec(mergedForUrls)) !== null) {
    candidates.push(urlMatch[0]);
  }
  while ((urlMatch = protocolRelativeRe.exec(mergedForUrls)) !== null) {
    if (urlMatch[1]) { candidates.push(ensureAbsolute(urlMatch[1])); }
  }

  const authParams = /[?&](token|code|key|auth|magic|secret|v|verify|state)=/i;
  const isMagicLink = (u) => /magic[-_]?link|verify[-_]?magic|sign[-_]?in|one[-_]?time/i.test(u) && /[?&]token=/i.test(u);

  const authUrls = candidates.filter((url) => (authParams.test(url) || authPathPattern.test(url)) && !isLikelyPublicLink(url));
  if (authUrls.length === 0) {
    return '';
  }

  const magicLinks = authUrls.filter(isMagicLink);
  const toReturn = magicLinks.length > 0 ? magicLinks : authUrls;
  const best = toReturn.reduce((a, b) => (a.length >= b.length ? a : b));
  return cleanUrl(best);
}

/**
 * 合并折行 URL：把以 = 或 & 结尾的行与下一行拼成一段，便于正则匹配完整 URL
 */
function mergeWrappedUrls(text) {
  if (!text || !text.includes('\n')) {
    return text;
  }
  return text.replace(/([=&])\s*\r?\n\s*/g, '$1');
}

function isLikelyPublicLink(url) {
  const u = url.toLowerCase();
  // 排除：社交媒体、隐私/条款、退订、偏好设置、追踪、静态资源、通用营销链接
  if (u.includes('unsubscribe') || u.includes('privacy') || u.includes('terms') ||
      u.includes('view in browser') || u.includes('viewinbrowser') || u.includes('preferences') ||
      u.includes('manage subscription') || u.includes('email preferences') ||
      u.includes('tracking') || u.includes('open?') || u.includes('/open?') ||  // 追踪像素/打开追踪
      u.includes('facebook.com') || u.includes('twitter.com') || u.includes('linkedin.com') ||
      u.includes('instagram.com') || u.includes('youtube.com') ||
      /\.(png|jpg|jpeg|gif|webp|css|js|woff2?)(\?|$)/i.test(u) ||
      u.endsWith('.png') || u.endsWith('.jpg') || u.endsWith('.css') || u.endsWith('.js') || u.endsWith('.gif')) {
    return true;
  }
  return false;
}

function decodeHtmlEntities(str) {
  return str.replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'');
}

function cleanUrl(url) {
  return url.replace(/[.,;>)]+$/, '');
}

/**
 * 判断数字是否可能不是验证码（用于过滤误匹配）
 * @param {string} digits - 提取的数字
 * @param {string} context - 上下文文本
 * @returns {boolean} 如果可能不是验证码返回true
 */
function isLikelyNonVerificationCode(digits, context = '') {
  if (!digits) {return true;}
  const lowerContext = String(context || '').toLowerCase();

  // 如果上下文明确在讲验证码/验证，则不要因为“年份/地址样式”误判丢掉
  // 例如：某些模板可能把验证码后面紧跟产品名（大写开头），容易被地址模式误伤。
  const verificationIndicators = /(?:verification|code|otp|one[-\s]?time|2fa|auth|login|confirm|security|pin|动态码|校验码|验证码|临时|一次性|认证)/i;
  if (verificationIndicators.test(lowerContext)) { return false; }
  
  // 排除年份（2000-2099，常见于邮件日期、活动年份等）
  const year = parseInt(digits, 10);
  if (digits.length === 4 && year >= 2000 && year <= 2099) {
    return true;
  }
  
  // 排除常见的邮政编码模式（5位数字，且上下文包含地址相关词汇）
  if (digits.length === 5) {
    if (lowerContext.includes('address') || 
        lowerContext.includes('street') || 
        lowerContext.includes('zip') ||
        lowerContext.includes('postal') ||
        /\b[a-z]{2,}\s+\d{5}\b/i.test(context)) { // 如 "CA 94114"
      return true;
    }
  }
  
  // 排除包含在明显的地址格式中的数字（如 "1000 Sofia"）
  // 仅当上下文确实像“地址”时才启用，避免把验证码后紧跟的标题/产品名误判为地址。
  const addressIndicators = /(?:address|street|zip|postal|city|state|province|country|road|st\.?|ave|avenue|blvd|lane|dr\.?|drive|suite|apt|unit|building|no\.?|number)/i;
  if (addressIndicators.test(lowerContext)) {
    const addressPattern = new RegExp(`\\b${digits}\\s+[A-Z][a-z]+(?:,|\\b)`, 'i');
    if (addressPattern.test(context)) { return true; }
  }
  
  return false;
}
