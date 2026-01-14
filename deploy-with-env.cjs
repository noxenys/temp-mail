#!/usr/bin/env node

/**
 * 智能部署脚本 - 支持环境变量的D1数据库配置
 * 自动获取数据库ID并设置环境变量，避免部署失败
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 颜色输出函数
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log('red', `❌ ${message}`);
  process.exit(1);
}

function success(message) {
  log('green', `✅ ${message}`);
}

function info(message) {
  log('blue', `ℹ️ ${message}`);
}

function warn(message) {
  log('yellow', `⚠️ ${message}`);
}

function updateWranglerConfig(databaseId) {
  try {
    const wranglerContent = fs.readFileSync('wrangler.toml', 'utf8');
    let updatedContent = wranglerContent;
    
    // 替换具体的数据库ID或占位符
    updatedContent = updatedContent.replace(
      /database_id = "[a-f0-9-]+"/g,
      `database_id = "${databaseId}"`
    ).replace(
      /database_id = "\${D1_DATABASE_ID}"/g,
      `database_id = "${databaseId}"`
    );
    
    fs.writeFileSync('wrangler.toml', updatedContent);
    success(`已更新 wrangler.toml 中的数据库绑定: ${databaseId}`);
  } catch (error) {
    warn(`无法更新 wrangler.toml: ${error.message}`);
  }
}

async function main() {
  info('开始智能部署流程...');
  
  // 检查wrangler是否安装
  try {
    execSync('npx wrangler --version', { stdio: 'ignore' });
  } catch (e) {
    error('wrangler未安装，请先运行: npm install -g wrangler');
  }
  
  // 检查是否已登录Cloudflare
  try {
    execSync('npx wrangler whoami', { stdio: 'ignore' });
    success('Cloudflare账户已登录');
  } catch (e) {
    error('请先登录Cloudflare账户: npx wrangler login');
  }
  
  // 获取数据库列表
  info('获取D1数据库列表...');
  let d1ListOutput;
  try {
    d1ListOutput = execSync('npx wrangler d1 list --json', { encoding: 'utf8' });
  } catch (e) {
    error('获取数据库列表失败，请检查网络连接和账户权限');
  }
  
  let databases;
  try {
    databases = JSON.parse(d1ListOutput);
  } catch (e) {
    error('解析数据库列表失败');
  }
  
  // 查找temp_mail_db数据库
  const targetDb = databases.find(db => db.name === 'temp_mail_db');
  
  if (!targetDb) {
    warn('未找到temp_mail_db数据库，将自动创建...');
    
    try {
      // 创建数据库
      execSync('npx wrangler d1 create temp_mail_db', { stdio: 'inherit' });
      success('数据库创建成功');
      
      // 重新获取数据库列表
      d1ListOutput = execSync('npx wrangler d1 list --json', { encoding: 'utf8' });
      databases = JSON.parse(d1ListOutput);
      const newDb = databases.find(db => db.name === 'temp_mail_db');
      
      if (!newDb) {
        error('数据库创建后未找到，请手动检查');
      }
      
      // 初始化数据库表结构
      info('初始化数据库表结构...');
      execSync(`npx wrangler d1 execute ${newDb.id} --file=./d1-init.sql`, { stdio: 'inherit' });
      success('数据库表结构初始化完成');
      
      // 更新 wrangler.toml
      updateWranglerConfig(newDb.id);
      
      // 设置环境变量
      process.env.D1_DATABASE_ID = newDb.id;
      
    } catch (e) {
      error('数据库创建或初始化失败');
    }
  } else {
    success(`找到数据库: ${targetDb.name} (ID: ${targetDb.id})`);
    
    // 更新 wrangler.toml
    updateWranglerConfig(targetDb.id);
    
    // 设置环境变量
    process.env.D1_DATABASE_ID = targetDb.id;
    
    // 检查数据库表结构
    info('检查数据库表结构...');
    try {
      execSync(`npx wrangler d1 execute ${targetDb.id} --command="SELECT COUNT(*) FROM sqlite_master WHERE type='table';"`, { stdio: 'ignore' });
      success('数据库表结构正常');
    } catch (e) {
      warn('数据库表结构可能不完整，尝试重新初始化...');
      try {
        execSync(`npx wrangler d1 execute ${targetDb.id} --file=./d1-init.sql`, { stdio: 'inherit' });
        success('数据库表结构重新初始化完成');
      } catch (initError) {
        error('数据库表结构初始化失败');
      }
    }
  }
  
  // 验证环境变量是否设置
  if (!process.env.D1_DATABASE_ID) {
    error('环境变量D1_DATABASE_ID未设置');
  }
  
  info(`使用数据库ID: ${process.env.D1_DATABASE_ID}`);
  
  // 执行部署
  info('开始部署到Cloudflare Workers...');
  try {
    execSync('npx wrangler deploy', { stdio: 'inherit', env: { ...process.env } });
    success('部署成功！');
  } catch (e) {
    error('部署失败，请检查错误信息');
  }
  
  // 部署后验证
  info('验证部署结果...');
  try {
    execSync('npx wrangler d1 execute temp_mail_db --command="PRAGMA table_info(messages);"', { stdio: 'ignore' });
    success('数据库连接验证成功');
  } catch (e) {
    warn('数据库连接验证失败，但部署可能仍然成功');
  }
  
  success('智能部署流程完成！');
  info('访问您的Worker URL开始使用临时邮箱服务');
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 运行主函数
if (require.main === module) {
  main().catch(error => {
    console.error('部署脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { main };
