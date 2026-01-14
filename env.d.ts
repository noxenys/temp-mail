/// <reference types="@cloudflare/workers-types" />

interface Env {
  // 数据库绑定
  temp_mail_db: D1Database;
  
  // R2存储桶绑定
  MAIL_EML: R2Bucket;
  
  // 静态资源绑定
  ASSETS: Fetcher;
  
  // 环境变量
  JWT_SECRET: string;
  JWT_TOKEN?: string;
  MAIL_DOMAIN: string;
  FORWARD_RULES?: string;
  RESEND_API_KEY?: string;
  RESEND_TOKEN?: string;
  RESEND?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_PASS?: string;
  ADMIN_USERNAME?: string;
  ADMIN_NAME?: string;
  GUEST_PASSWORD?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  CACHE_TTL?: string;
  
  // 缓存系统类型
  CACHE: {
    tableStructure: Map<string, any>;
    mailboxIds: Map<string, any>;
    userQuotas: Map<string, any>;
    systemStats: Map<string, any>;
  };
}
