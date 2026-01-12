import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createJWT, verifyJWT, hashPassword, verifyPassword } from './authentication.js';

describe('认证功能测试', () => {
  beforeEach(() => {
    vi.stubGlobal('process', {
      env: { JWT_SECRET: 'test-secret-key' }
    });
  });

  describe('JWT令牌', () => {
    it('应该创建和验证有效的JWT令牌', async() => {
      const payload = { userId: '123', username: 'testuser' };
      const token = await createJWT(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      const decoded = await verifyJWT(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.username).toBe(payload.username);
    });

    it('应该拒绝无效的JWT令牌', async() => {
      await expect(verifyJWT('invalid-token')).rejects.toThrow();
    });

    it('应该拒绝过期的JWT令牌', async() => {
      const payload = { userId: '123', exp: Math.floor(Date.now() / 1000) - 3600 };
      const token = await createJWT(payload);
      
      await expect(verifyJWT(token)).rejects.toThrow();
    });
  });

  describe('密码哈希', () => {
    it('应该正确哈希和验证密码', async() => {
      const password = 'test-password-123';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password);
      
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('应该拒绝错误的密码', async() => {
      const password = 'test-password-123';
      const wrongPassword = 'wrong-password';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });
});