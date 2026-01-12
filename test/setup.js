// 测试环境设置
import { beforeEach, afterEach, vi } from 'vitest';
import { webcrypto as nodeWebcrypto } from 'node:crypto';

// 模拟 Cloudflare Workers 环境
globalThis.caches = {
  default: {
    async match() { return null; },
    async put() {},
    async delete() { return false; }
  }
};

// 模拟环境变量
globalThis.process = {
  env: {
    JWT_SECRET: 'test-secret-key',
    MAIL_DOMAIN: 'test.example.com',
    FORWARD_RULES: '{}',
    ADMIN_PASSWORD: 'test-admin-password'
  }
};

// 模拟数据库连接
globalThis.TEMP_MAIL_DB = {
  prepare: vi.fn(() => ({
    bind: vi.fn(() => ({
      all: vi.fn(() => ({ results: [], success: true })),
      run: vi.fn(() => ({ success: true })),
      first: vi.fn(() => ({}))
    }))
  }))
};

// 模拟 R2 存储桶
globalThis.MAIL_EML = {
  put: vi.fn(() => Promise.resolve()),
  get: vi.fn(() => Promise.resolve(null)),
  delete: vi.fn(() => Promise.resolve())
};

// 模拟静态资源
globalThis.ASSETS = {
  fetch: vi.fn(() => Promise.resolve(new Response()))
};

if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = nodeWebcrypto;
}

// 清理模拟
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.resetAllMocks();
});
