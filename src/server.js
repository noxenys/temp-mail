import { initDatabase } from './database.js';
import { handleEmailReceive } from './apiHandlers.js';
import { createRouter, authMiddleware } from './routes.js';
import { createAssetManager } from './assetManager.js';
import { getDatabaseWithValidation } from './dbConnectionHelper.js';
import { rateLimitMiddleware } from './rateLimit.js';
import * as logger from './logger.js';

export default {
  /**
   * HTTP请求处理器，处理所有到达Worker的HTTP请求
   * @param {Request} request - HTTP请求对象
   * @param {object} env - 环境变量对象，包含数据库连接、配置等
   * @param {object} ctx - 上下文对象，包含执行上下文信息
   * @returns {Promise<Response>} HTTP响应对象
   */
  async fetch(request, env, ctx) {
    void ctx;
    const startTime = Date.now();
    const logId = logger.generateLogId ? logger.generateLogId() : `req-${Date.now()}`;
    let response;
    let url;
    
    try {
      url = new URL(request.url);
      let DB;
      
      // 记录请求开始
      logger.info('HTTP请求开始', {
        method: request.method,
        path: url.pathname,
        query: Object.fromEntries(url.searchParams)
      }, logId);
      
      // 验证环境变量
      if (!env) {
        logger.error('环境配置错误', null, {}, logId);
        return new Response('环境配置错误', { status: 500 });
      }
      
      // API速率限制检查
      const rateLimitResult = rateLimitMiddleware(request, url.pathname);
      if (rateLimitResult && rateLimitResult.status) {
        logger.warn('请求被速率限制', {
          path: url.pathname,
          status: rateLimitResult.status
        }, logId);
        return new Response(rateLimitResult.body, {
          status: rateLimitResult.status,
          headers: rateLimitResult.headers
        });
      }
      
      try {
        DB = await getDatabaseWithValidation(env);
        logger.debug('数据库连接成功', {}, logId);
      } catch (error) {
        logger.error('数据库连接失败', error, {}, logId);
        // 生产环境返回通用错误信息，避免泄露敏感信息
        return new Response('服务器内部错误', { status: 500 });
      }
      
      // 支持多个域名：使用逗号/空格分隔，创建地址时取第一个为默认显示
      const MAIL_DOMAINS = (env.MAIL_DOMAIN || 'temp.example.com')
        .split(/[,\s]+/)
        .map(d => d.trim())
        .filter(Boolean);

      // 初始化数据库（initDatabase内部已处理幂等性）
      await initDatabase(DB);
      logger.debug('数据库初始化完成', {}, logId);

      // 创建路由器并添加认证中间件
      const router = createRouter();
      router.use(authMiddleware);
      
      // 处理API路由
      const context = {
        env: env,
        DB: DB,
        MAIL_DOMAINS: MAIL_DOMAINS
      };
      const apiResponse = await router.handle(request, context);
      if (apiResponse) {
        response = apiResponse;
        logger.info('API路由处理完成', {
          status: apiResponse.status,
          path: url.pathname
        }, logId);
        return apiResponse;
      }
      
      // 处理静态资源
      const assetManager = createAssetManager();
      const assetResponse = await assetManager.handleAssetRequest(request, env, MAIL_DOMAINS);
      if (assetResponse) {
        response = assetResponse;
        logger.info('静态资源处理完成', {
          status: assetResponse.status,
          path: url.pathname
        }, logId);
        return assetResponse;
      }
      
      // 处理未匹配的路由
      response = new Response('Not Found', { status: 404 });
      logger.warn('路由未匹配', {
        path: url.pathname,
        method: request.method
      }, logId);
      return response;
    } catch (error) {
      logger.error('服务器内部错误', error, {
        method: request.method,
        path: url ? url.pathname : ''
      }, logId);
      response = new Response('服务器内部错误', { status: 500 });
      return response;
    } finally {
      // 记录请求完成
      const endTime = Date.now();
      const duration = endTime - startTime;
      const statusCode = response ? response.status : 500;
      
      logger.info('HTTP请求完成', {
        method: request.method,
        path: url ? url.pathname : '',
        status: statusCode,
        duration: duration
      }, logId);
    }
  },

  /**
   * 邮件接收处理器，处理所有到达的邮件消息
   * @param {object} message - 邮件消息对象，包含邮件内容、头部信息等
   * @param {object} env - 环境变量对象，包含数据库连接、R2存储等
   * @param {object} ctx - 上下文对象，包含执行上下文信息
   * @returns {Promise<void>} 处理完成后无返回值
   */
  async email(message, env, ctx) {
    void ctx;
    const logId = logger.generateLogId ? logger.generateLogId() : `email-${Date.now()}`;
    
    try {
      logger.info('邮件接收开始', {
        from: message.from,
        to: message.to,
        subject: message.subject?.substring(0, 100)
      }, logId);
      
      const DB = await getDatabaseWithValidation(env);
      
      // 支持多个域名
      const MAIL_DOMAINS = (env.MAIL_DOMAIN || 'temp.example.com')
        .split(/[,\s]+/)
        .map(d => d.trim())
        .filter(Boolean);

      // 初始化数据库
      await initDatabase(DB);
      
      // 处理邮件接收
      const result = await handleEmailReceive(message, DB, MAIL_DOMAINS);
      
      logger.info('邮件处理完成', {
        result: result,
        messageId: message.id
      }, logId);
      
      return result;
    } catch (error) {
      logger.error('邮件处理错误', error, {
        from: message.from,
        to: message.to,
        subject: message.subject
      }, logId);
      throw error;
    }
  }
};