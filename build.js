import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 使用 terser 进行代码压缩和混淆
function minifyCode(code) {
  try {
    // 简单的字符串压缩（实际生产环境应使用 terser）
    let minified = code
      // 移除注释
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
      // 移除多余空白
      .replace(/\s+/g, ' ')
      .trim();
    
    return minified;
  } catch (error) {
    console.warn('压缩失败，使用原始代码:', error.message);
    return code;
  }
}

// 主构建函数
function build() {
  console.log('🔧 开始构建混淆版本...');
  
  try {
    // 读取原始 worker.js 文件
    const workerPath = path.join(__dirname, 'worker.js');
    const originalCode = fs.readFileSync(workerPath, 'utf8');
    
    console.log('📊 原始文件大小:', originalCode.length, '字符');
    
    // 压缩代码
    const minifiedCode = minifyCode(originalCode);
    
    console.log('📊 压缩后大小:', minifiedCode.length, '字符');
    console.log('📈 压缩率:', ((1 - minifiedCode.length / originalCode.length) * 100).toFixed(2) + '%');
    
    // 创建备份目录
    const backupDir = path.join(__dirname, '.backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    // 备份原始文件
    const backupPath = path.join(backupDir, 'worker.js.backup');
    fs.writeFileSync(backupPath, originalCode);
    
    // 写入压缩后的代码
    fs.writeFileSync(workerPath, minifiedCode);
    
    console.log('✅ 构建完成！');
    console.log('📁 原始文件已备份到:', backupPath);
    console.log('🔒 压缩后的文件已保存到:', workerPath);
    console.log('⚠️  注意：此版本已压缩，代码可读性降低');
    
  } catch (error) {
    console.error('❌ 构建失败:', error.message);
    process.exit(1);
  }
}

// 恢复原始文件的函数（用于开发）
function restore() {
  try {
    const backupPath = path.join(__dirname, '.backup', 'worker.js.backup');
    const workerPath = path.join(__dirname, 'worker.js');
    
    if (fs.existsSync(backupPath)) {
      const originalCode = fs.readFileSync(backupPath, 'utf8');
      fs.writeFileSync(workerPath, originalCode);
      console.log('✅ 原始文件已恢复！');
    } else {
      console.log('⚠️  未找到备份文件');
    }
  } catch (error) {
    console.error('❌ 恢复失败:', error.message);
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
if (args.includes('--restore')) {
  restore();
} else {
  build();
}