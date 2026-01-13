#!/usr/bin/env node

// GitHub Actions 专用部署脚本
// 这个脚本确保在 GitHub Actions 环境中正确部署

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

console.log('🚀 开始 GitHub Actions 部署流程...');

// 数据库配置
const DATABASE_NAME = 'temp_email_db';
const DATABASE_BINDING = 'TEMP_MAIL_DB';

async function updateWranglerConfig(databaseId) {
  // 检查是否存在 wrangler.toml 文件
  try {
    const wranglerContent = readFileSync('wrangler.toml', 'utf8');
    
    // 更新数据库绑定信息
    const updatedContent = wranglerContent.replace(
      new RegExp(`\\[\\[d1_databases\\]\\]\\s*name = \"${DATABASE_NAME}\"\\s*database_id = \"[a-f0-9-]+\"`, 'g'),
      `[[d1_databases]]\nname = "${DATABASE_NAME}"\ndatabase_id = "${databaseId}"`
    );
    
    writeFileSync('wrangler.toml', updatedContent);
    console.log(`✅ 已更新 wrangler.toml 中的数据库绑定: ${databaseId}`);
  } catch (error) {
    console.log('ℹ️ 未找到 wrangler.toml 文件，创建新的配置文件');
    
    // 创建新的 wrangler.toml 文件
    const wranglerConfig = `name = "temp-email"
compatibility_date = "2024-01-01"

[[d1_databases]]
name = "${DATABASE_NAME}"
database_id = "${databaseId}"
binding = "${DATABASE_BINDING}"

[env.production]
name = "temp-email"

[[env.production.d1_databases]]
name = "${DATABASE_NAME}"
database_id = "${databaseId}"
binding = "${DATABASE_BINDING}"`;
    
    writeFileSync('wrangler.toml', wranglerConfig);
    console.log(`✅ 已创建 wrangler.toml 文件并设置数据库绑定: ${databaseId}`);
  }
}

async function getDatabaseId() {
  try {
    // 移除 --remote 参数，使用默认的本地/远程自动检测
    const dbList = execSync('npx wrangler d1 list --json', { encoding: 'utf8' });
    const databases = JSON.parse(dbList);
    
    const db = databases.find(d => d.name === DATABASE_NAME);
    if (db) {
      return db.uuid;
    }
  } catch (error) {
    console.log('⚠️ 无法获取数据库列表:', error.message);
  }
  return null;
}

try {
  // 1. 检查 Wrangler 是否可用
  console.log('📦 检查 Wrangler 可用性...');
  execSync('npx wrangler --version', { stdio: 'inherit' });
  
  // 2. 设置 Cloudflare 认证
  console.log('🔐 设置 Cloudflare 认证...');
  if (process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID) {
    // 设置环境变量供 wrangler 使用
    process.env.CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    process.env.CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
    console.log('✅ Cloudflare 认证已设置');
  } else {
    console.warn('⚠️ Cloudflare 认证信息未提供，数据库操作可能失败');
  }
  
  // 3. 创建 D1 数据库（如果不存在）
  console.log('🗄️ 检查并创建 D1 数据库...');
  try {
    // 先检查数据库是否已存在
    const dbList = execSync(`npx wrangler d1 list --json`, { encoding: 'utf8' });
    const databases = JSON.parse(dbList);
    
    const existingDb = databases.find(d => d.name === DATABASE_NAME);
    if (existingDb) {
      console.log('ℹ️ D1 数据库已存在，跳过创建');
      
      // 获取现有数据库ID并确保配置正确
      await updateWranglerConfig(existingDb.uuid);
    } else {
      // 创建新数据库
      execSync(`npx wrangler d1 create ${DATABASE_NAME}`, { stdio: 'inherit' });
      console.log('✅ D1 数据库创建成功');
      
      // 获取新创建的数据库ID并更新配置
      const databaseId = await getDatabaseId();
      if (databaseId) {
        await updateWranglerConfig(databaseId);
      }
    }
  } catch (error) {
    console.warn('⚠️ 检查或创建数据库时出错，但继续部署:', error.message);
    // 即使出错也要尝试获取现有数据库ID
    const databaseId = await getDatabaseId();
    if (databaseId) {
      await updateWranglerConfig(databaseId);
    }
  }
  
  // 3. 检查数据库是否已初始化（通过检查表是否存在）
  console.log('🔍 检查数据库是否已初始化...');
  let isDatabaseInitialized = false;
  try {
    // 首先检查数据库是否存在
    const dbList = execSync(`npx wrangler d1 list --json`, { encoding: 'utf8' });
    const databases = JSON.parse(dbList);
    
    const existingDb = databases.find(d => d.name === DATABASE_NAME);
    if (!existingDb) {
      console.log('⚠️ 数据库不存在，需要重新创建和初始化');
      isDatabaseInitialized = false;
    } else {
      // 数据库存在，再检查是否已初始化
      try {
        const checkResult = execSync(`npx wrangler d1 execute ${DATABASE_NAME} --command="SELECT name FROM sqlite_master WHERE type=\'table\' AND name=\'mailboxes\'"`, { encoding: 'utf8' });
        if (checkResult.includes('mailboxes')) {
          isDatabaseInitialized = true;
          console.log('✅ 数据库已初始化，跳过初始化步骤');
        } else {
          console.log('ℹ️ 数据库存在但未初始化，准备初始化...');
        }
      } catch (checkError) {
        console.log('ℹ️ 无法检查数据库表状态，准备初始化...');
      }
    }
  } catch (error) {
    console.log('ℹ️ 无法确认数据库初始化状态，准备初始化...');
  }

  // 4. 只有在数据库未初始化时才执行初始化
  if (!isDatabaseInitialized) {
    console.log('🔧 执行数据库初始化...');
    try {
      execSync(`npx wrangler d1 execute ${DATABASE_NAME} --file=d1-init.sql`, { stdio: 'inherit' });
      console.log('✅ 数据库初始化成功');
    } catch (error) {
      console.error('❌ 数据库初始化失败:', error.message);
      // 尝试使用基础初始化脚本作为备选方案
      try {
        console.log('🔄 尝试使用基础初始化脚本...');
        execSync(`npx wrangler d1 execute ${DATABASE_NAME} --file=d1-init-basic.sql`, { stdio: 'inherit' });
        console.log('✅ 数据库基础初始化成功');
      } catch (fallbackError) {
        console.warn('⚠️ 基础初始化也失败，但继续部署:', fallbackError.message);
      }
    }
  } else {
    console.log('⏭️ 数据库已存在，跳过初始化步骤');
  }
  
  // 4. 设置环境变量（如果提供了）
  console.log('🔧 设置环境变量...');
  
  // 首先确保D1_DATABASE_ID环境变量已设置
  let databaseId = await getDatabaseId();
  if (databaseId) {
    process.env.D1_DATABASE_ID = databaseId;
    console.log(`✅ 已设置D1_DATABASE_ID环境变量: ${databaseId}`);
  }
  
  const envVars = [
    // 必需环境变量
    { name: 'ADMIN_PASSWORD', value: process.env.ADMIN_PASSWORD },
    { name: 'JWT_TOKEN', value: process.env.JWT_TOKEN },
    { name: 'JWT_SECRET', value: process.env.JWT_SECRET },
    { name: 'MAIL_DOMAIN', value: process.env.MAIL_DOMAIN },
    { name: 'D1_DATABASE_ID', value: process.env.D1_DATABASE_ID },
    
    // 可选环境变量（不填写不影响项目正常使用）
    { name: 'GUEST_PASSWORD', value: process.env.GUEST_PASSWORD },
    { name: 'ADMIN_USERNAME', value: process.env.ADMIN_USERNAME },
    { name: 'ADMIN_PASS', value: process.env.ADMIN_PASS },
    { name: 'RESEND_API_KEY', value: process.env.RESEND_API_KEY },
    { name: 'RESEND_TOKEN', value: process.env.RESEND_TOKEN },
    { name: 'FORWARD_RULES', value: process.env.FORWARD_RULES },
    { name: 'CACHE_TTL', value: process.env.CACHE_TTL }
  ];
  
  for (const envVar of envVars) {
    if (envVar.value) {
      try {
        execSync(`npx wrangler secret put ${envVar.name}`, {
          input: envVar.value,
          stdio: ['pipe', 'inherit', 'inherit']
        });
        console.log(`✅ 已设置环境变量: ${envVar.name}`);
      } catch (error) {
        console.warn(`⚠️ 设置环境变量 ${envVar.name} 失败:`, error.message);
      }
    } else {
      console.log(`ℹ️ 未提供环境变量: ${envVar.name}`);
    }
  }
  
  // 5. 构建项目
  console.log('🔨 构建项目...');
  execSync('npm run build', { stdio: 'inherit' });

  // 6. 部署到 Cloudflare Workers
  console.log('☁️ 部署到 Cloudflare Workers...');
  execSync('npx wrangler deploy', { stdio: 'inherit' });
  
  console.log('✅ 部署完成！');
} catch (error) {
  console.error('❌ 部署失败:', error.message);
  process.exit(1);
}