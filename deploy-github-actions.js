#!/usr/bin/env node

// GitHub Actions 专用部署脚本
// 这个脚本确保在 GitHub Actions 环境中正确部署

import { execSync } from 'child_process';

console.log('🚀 开始 GitHub Actions 部署流程...');

try {
  // 1. 检查 Wrangler 是否已安装
  console.log('📦 检查 Wrangler 安装...');
  execSync('wrangler --version', { stdio: 'inherit' });
  
  // 2. 创建 D1 数据库（如果不存在）
  console.log('🗄️ 检查并创建 D1 数据库...');
  try {
    execSync('wrangler d1 create temp_mail_db --remote', { stdio: 'inherit' });
    console.log('✅ D1 数据库创建成功');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️ D1 数据库已存在，跳过创建');
    } else {
      console.warn('⚠️ D1 数据库创建失败，但继续部署:', error.message);
    }
  }
  
  // 3. 执行基础数据库初始化
  console.log('🔧 执行数据库初始化...');
  try {
    execSync('wrangler d1 execute temp_mail_db --remote --file=d1-init-basic.sql', { stdio: 'inherit' });
    console.log('✅ 数据库初始化成功');
  } catch (error) {
    console.warn('⚠️ 数据库初始化失败，但继续部署:', error.message);
  }
  
  // 4. 部署到 Cloudflare Workers
  console.log('☁️ 部署到 Cloudflare Workers...');
  execSync('wrangler deploy', { stdio: 'inherit' });
  
  console.log('✅ 部署完成！');
} catch (error) {
  console.error('❌ 部署失败:', error.message);
  process.exit(1);
}