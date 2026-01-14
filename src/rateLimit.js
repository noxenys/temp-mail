/**
 * API速率限制中间件
 * 基于IP和API路径的请求频率控制，防止滥用和DDoS攻击
 */

// 内存缓存，用于存储请求计数（Cloudflare Workers中全局可用）
const rateLimitCache = {};

// 清理过期缓存（每5分钟清理一次）
const cleanupInterval = 5 * 60 * 1000; // 5分钟
let lastCleanup = Date.now();

/**
 * 清理过期的速率限制缓存
 */
function cleanupExpiredCache() {
  const now = Date.now();
  if (now - lastCleanup < cleanupInterval) {return;}
  
  for (const key in rateLimitCache) {
    if (rateLimitCache[key].expiresAt < now) {
      delete rateLimitCache[key];
    }
  }
  lastCleanup = now;
}

/**
 * 生成速率限制缓存键
 * @param {string} ip - 客户端IP地址
 * @param {string} path - API路径
 * @returns {string} 缓存键
 */
function getRateLimitKey(ip, path) {
  return `${ip}:${path}`;
}

/**
 * 速率限制配置
 */
const rateLimitConfig = {
  default: {
    windowMs: 60 * 1000,
    maxRequests: 60,
    message: '请求过于频繁，请稍后再试'
  },
  '/api/login': {
    windowMs: 1 * 60 * 1000,
    maxRequests: 5,
    message: '登录尝试过于频繁，请稍后再试'
  },
  '/api/mail': {
    windowMs: 30 * 1000,
    maxRequests: 30,
    message: '邮件请求过于频繁，请稍后再试'
  },
  '/api/users': {
    windowMs: 60 * 1000,
    maxRequests: 20,
    message: '用户管理操作过于频繁，请稍后再试'
  },
  '/api/mailbox': {
    windowMs: 10 * 60 * 1000,
    maxRequests: 5,
    message: '邮箱创建过于频繁，请稍后再试'
  },
  'mailbox:read': {
    windowMs: 30 * 1000,
    maxRequests: 30,
    message: '该邮箱查询过于频繁，请稍后再试'
  },
  'send:user': {
    windowMs: 60 * 1000,
    maxRequests: 20,
    message: '该用户发件过于频繁，请稍后再试'
  },
  'send:from': {
    windowMs: 60 * 1000,
    maxRequests: 20,
    message: '该发件地址发送过于频繁，请稍后再试'
  },
  'receive:mailbox': {
    windowMs: 60 * 1000,
    maxRequests: 60,
    message: '该邮箱接收邮件过于频繁，请稍后再试'
  }
};

/**
 * 获取客户端真实IP地址
 * @param {Request} request - HTTP请求对象
 * @returns {string} 客户端IP地址
 */
function getClientIP(request) {
  // Cloudflare Workers中获取真实IP的优先级
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  const xRealIp = request.headers.get('x-real-ip');
  const xForwardedFor = request.headers.get('x-forwarded-for');
  
  // 优先使用Cloudflare提供的IP
  if (cfConnectingIp) {return cfConnectingIp;}
  if (xRealIp) {return xRealIp;}
  if (xForwardedFor) {return xForwardedFor.split(',')[0].trim();}
  
  // 默认返回未知IP
  return 'unknown';
}

/**
 * 速率限制中间件
 * @param {Request} request - HTTP请求对象
 * @param {string} path - API路径
 * @returns {object|null} 如果被限制则返回错误响应，否则返回null
 */
export function rateLimitMiddleware(request, path) {
  // 只对API请求进行速率限制
  if (!path.startsWith('/api/')) {
    return null;
  }
  
  // 清理过期缓存
  cleanupExpiredCache();
  
  // 获取客户端IP
  const clientIP = getClientIP(request);
  
  // 获取配置（优先使用路径特定配置，否则使用默认配置）
  const config = rateLimitConfig[path] || rateLimitConfig.default;
  
  // 生成缓存键
  const cacheKey = getRateLimitKey(clientIP, path);
  
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  // 获取或初始化计数
  if (!rateLimitCache[cacheKey]) {
    rateLimitCache[cacheKey] = {
      count: 1,
      firstRequest: now,
      expiresAt: now + config.windowMs
    };
  } else {
    const record = rateLimitCache[cacheKey];
    
    // 如果记录已过期，重置计数
    if (record.firstRequest < windowStart) {
      record.count = 1;
      record.firstRequest = now;
      record.expiresAt = now + config.windowMs;
    } else {
      record.count++;
    }
    
    // 检查是否超过限制
    if (record.count > config.maxRequests) {
      return {
        status: 429,
        body: JSON.stringify({
          success: false,
          error: config.message,
          retryAfter: Math.ceil((record.expiresAt - now) / 1000)
        }),
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((record.expiresAt - now) / 1000).toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(record.expiresAt / 1000).toString()
        }
      };
    }
    
    // 更新过期时间
    record.expiresAt = now + config.windowMs;
  }
  
  // 添加速率限制头信息
  const record = rateLimitCache[cacheKey];
  const remaining = Math.max(0, config.maxRequests - record.count);
  
  return {
    headers: {
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(record.expiresAt / 1000).toString()
    }
  };
}

/**
 * 获取当前速率限制状态（用于调试和监控）
 * @param {string} ip - 客户端IP
 * @param {string} path - API路径
 * @returns {object} 速率限制状态
 */
export function getRateLimitStatus(ip, path) {
  const cacheKey = getRateLimitKey(ip, path);
  const record = rateLimitCache[cacheKey];
  
  if (!record) {
    return { count: 0, remaining: rateLimitConfig.default.maxRequests, resetTime: null };
  }
  
  const config = rateLimitConfig[path] || rateLimitConfig.default;
  const remaining = Math.max(0, config.maxRequests - record.count);
  
  return {
    count: record.count,
    remaining,
    resetTime: record.expiresAt
  };
}

export function checkCustomRateLimit(key, configKey) {
  if (!key) {return null;}
  cleanupExpiredCache();
  const config = rateLimitConfig[configKey] || rateLimitConfig.default;
  const cacheKey = `k:${String(configKey || 'default')}:${String(key)}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;
  if (!rateLimitCache[cacheKey]) {
    rateLimitCache[cacheKey] = {
      count: 1,
      firstRequest: now,
      expiresAt: now + config.windowMs
    };
  } else {
    const record = rateLimitCache[cacheKey];
    if (record.firstRequest < windowStart) {
      record.count = 1;
      record.firstRequest = now;
      record.expiresAt = now + config.windowMs;
    } else {
      record.count++;
    }
    if (record.count > config.maxRequests) {
      return {
        status: 429,
        body: JSON.stringify({
          success: false,
          error: config.message,
          retryAfter: Math.ceil((record.expiresAt - now) / 1000)
        }),
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((record.expiresAt - now) / 1000).toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(record.expiresAt / 1000).toString()
        }
      };
    }
    record.expiresAt = now + config.windowMs;
  }
  const record = rateLimitCache[cacheKey];
  const remaining = Math.max(0, config.maxRequests - record.count);
  return {
    headers: {
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(record.expiresAt / 1000).toString()
    }
  };
}
