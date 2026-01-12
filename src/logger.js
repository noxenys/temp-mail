/**
 * 结构化日志记录系统
 * 提供统一的日志格式、错误追踪和性能监控
 */

// 日志级别配置
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
};

// 当前日志级别（生产环境默认为WARN）
const CURRENT_LOG_LEVEL = LOG_LEVELS.WARN;

/**
 * 生成日志ID（用于追踪请求链）
 * @returns {string} 唯一的日志ID
 */
function generateLogId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * 结构化日志格式
 * @param {string} level - 日志级别
 * @param {string} message - 日志消息
 * @param {object} context - 上下文信息
 * @param {string} logId - 日志ID
 * @returns {object} 结构化日志对象
 */
function formatLog(level, message, context = {}, logId = null) {
  const timestamp = new Date().toISOString();
  const id = logId || generateLogId();
  
  return {
    id,
    timestamp,
    level,
    message: message || '',
    context: {
      ...context,
      // 添加环境信息
      environment: process.env.NODE_ENV || 'production',
      // 添加Worker信息
      worker: {
        region: process.env.REGION || 'unknown',
        version: process.env.VERSION || 'unknown'
      }
    }
  };
}

/**
 * 输出日志到控制台（结构化JSON格式）
 * @param {object} logEntry - 日志条目
 */
function outputToConsole(logEntry) {
  // 生产环境下只输出ERROR和FATAL级别的日志
  if (CURRENT_LOG_LEVEL > LOG_LEVELS.WARN && logEntry.level !== 'ERROR' && logEntry.level !== 'FATAL') {
    return;
  }
  
  // 使用JSON格式输出，便于日志收集系统解析
  console.log(JSON.stringify(logEntry));
}

/**
 * 记录调试日志
 * @param {string} message - 日志消息
 * @param {object} context - 上下文信息
 * @param {string} logId - 日志ID
 */
export function debug(message, context = {}, logId = null) {
  if (CURRENT_LOG_LEVEL > LOG_LEVELS.DEBUG) {return;}
  
  const logEntry = formatLog('DEBUG', message, context, logId);
  outputToConsole(logEntry);
}

/**
 * 记录信息日志
 * @param {string} message - 日志消息
 * @param {object} context - 上下文信息
 * @param {string} logId - 日志ID
 */
export function info(message, context = {}, logId = null) {
  if (CURRENT_LOG_LEVEL > LOG_LEVELS.INFO) {return;}
  
  const logEntry = formatLog('INFO', message, context, logId);
  outputToConsole(logEntry);
}

/**
 * 记录警告日志
 * @param {string} message - 日志消息
 * @param {object} context - 上下文信息
 * @param {string} logId - 日志ID
 */
export function warn(message, context = {}, logId = null) {
  if (CURRENT_LOG_LEVEL > LOG_LEVELS.WARN) {return;}
  
  const logEntry = formatLog('WARN', message, context, logId);
  outputToConsole(logEntry);
}

/**
 * 记录错误日志
 * @param {string} message - 日志消息
 * @param {Error} error - 错误对象
 * @param {object} context - 上下文信息
 * @param {string} logId - 日志ID
 */
export function error(message, error = null, context = {}, logId = null) {
  const errorContext = {
    ...context,
    error: error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      // 添加错误追踪信息
      cause: error.cause
    } : null
  };
  
  const logEntry = formatLog('ERROR', message, errorContext, logId);
  outputToConsole(logEntry);
}

/**
 * 记录致命错误日志
 * @param {string} message - 日志消息
 * @param {Error} error - 错误对象
 * @param {object} context - 上下文信息
 * @param {string} logId - 日志ID
 */
export function fatal(message, error = null, context = {}, logId = null) {
  const errorContext = {
    ...context,
    error: error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    } : null
  };
  
  const logEntry = formatLog('FATAL', message, errorContext, logId);
  outputToConsole(logEntry);
}

/**
 * 性能监控日志
 * @param {string} operation - 操作名称
 * @param {number} startTime - 开始时间
 * @param {object} context - 上下文信息
 * @param {string} logId - 日志ID
 */
export function performance(operation, startTime, context = {}, logId = null) {
  const duration = Date.now() - startTime;
  const performanceContext = {
    ...context,
    operation,
    duration,
    unit: 'ms'
  };
  
  const logEntry = formatLog('INFO', `性能监控: ${operation}`, performanceContext, logId);
  
  // 只记录超过阈值的操作
  const SLOW_THRESHOLD = 1000; // 1秒
  if (duration > SLOW_THRESHOLD) {
    logEntry.level = 'WARN';
    logEntry.message = `慢操作: ${operation}`;
  }
  
  outputToConsole(logEntry);
}

/**
 * 请求追踪日志
 * @param {Request} request - HTTP请求对象
 * @param {Response} response - HTTP响应对象
 * @param {number} duration - 请求处理时长
 * @param {string} logId - 日志ID
 */
export function requestLog(request, response, duration, logId = null) {
  const url = new URL(request.url);
  
  const context = {
    request: {
      method: request.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('cf-connecting-ip') || 'unknown'
    },
    response: {
      status: response.status,
      size: response.headers.get('content-length') || 'unknown'
    },
    duration,
    unit: 'ms'
  };
  
  const logEntry = formatLog('INFO', 'HTTP请求', context, logId);
  
  // 根据状态码调整日志级别
  if (response.status >= 500) {
    logEntry.level = 'ERROR';
  } else if (response.status >= 400) {
    logEntry.level = 'WARN';
  }
  
  outputToConsole(logEntry);
}

/**
 * 数据库操作日志
 * @param {string} operation - 数据库操作
 * @param {string} query - SQL查询
 * @param {number} duration - 执行时长
 * @param {boolean} success - 是否成功
 * @param {string} logId - 日志ID
 */
export function dbLog(operation, query, duration, success = true, logId = null) {
  const context = {
    operation,
    query: query.substring(0, 200), // 限制查询长度
    duration,
    success,
    unit: 'ms'
  };
  
  const level = success ? 'DEBUG' : 'ERROR';
  const message = success ? '数据库操作' : '数据库操作失败';
  
  const logEntry = formatLog(level, message, context, logId);
  outputToConsole(logEntry);
}

/**
 * 邮件处理日志
 * @param {string} operation - 邮件操作
 * @param {string} from - 发件人
 * @param {string} to - 收件人
 * @param {boolean} success - 是否成功
 * @param {string} logId - 日志ID
 */
export function emailLog(operation, from, to, success = true, logId = null) {
  const context = {
    operation,
    from,
    to,
    success
  };
  
  const level = success ? 'INFO' : 'ERROR';
  const message = success ? '邮件处理' : '邮件处理失败';
  
  const logEntry = formatLog(level, message, context, logId);
  outputToConsole(logEntry);
}

// 导出默认日志实例
export default {
  debug,
  info,
  warn,
  error,
  fatal,
  performance,
  requestLog,
  dbLog,
  emailLog
};