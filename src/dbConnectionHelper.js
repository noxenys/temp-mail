/**
 * 数据库连接辅助工具
 * 解决数据库绑定名称硬编码问题，支持动态获取D1数据库连接
 */

// 缓存数据库连接和绑定名称，避免重复查找和日志输出
let _cachedDB = null;
let _cachedBindingName = null;

/**
 * 获取D1数据库连接对象
 * @param {object} env - Cloudflare Workers环境变量对象
 * @returns {object|null} 数据库连接对象，如果未找到返回null
 */
export function getDatabase(env) {
  // 如果已经缓存了数据库连接，直接返回
  if (_cachedDB && _cachedBindingName && env[_cachedBindingName]) {
    return _cachedDB;
  }

  // 简化的数据库绑定名称白名单（按优先级排序）
  const allowedBindings = [
    'temp_mail_db',      // 首选 temp_mail_db
    'DB'                 // 兼容性保留
  ];

  // 遍历白名单中的绑定名称
  for (const bindingName of allowedBindings) {
    if (env[bindingName]) {
      // 验证绑定对象确实是D1数据库（有prepare和batch方法）
      const db = env[bindingName];
      if (db && typeof db === 'object' && 
          typeof db.prepare === 'function' && 
          typeof db.batch === 'function') {
        
        // 首次找到时打印明确的绑定选择日志
        if (_cachedBindingName !== bindingName) {
          console.log(`✅ 数据库绑定已选择: ${bindingName}`);
          _cachedBindingName = bindingName;
        }
        _cachedDB = db;
        return _cachedDB;
      } else {
        console.warn(`⚠️ 绑定 ${bindingName} 存在但不是有效的D1数据库对象`);
      }
    }
  }

  // 未找到有效绑定时提供明确的错误信息
  console.error('❌ 未找到有效的D1数据库绑定');
  console.error('🔧 请检查 wrangler.toml 配置，确保已正确设置以下绑定之一:');
  console.error('   - temp_mail_db (推荐)');
  console.error('   - DB (兼容性)');
  console.error('📖 参考文档: 查看 README.md 中的部署配置说明');
  return null;
}

/**
 * 验证数据库连接是否有效
 * @param {object} db - 数据库连接对象
 * @returns {Promise<boolean>} 连接是否有效
 */
export async function validateDatabaseConnection(db) {
  if (!db) {return false;}
  
  try {
    // 尝试执行一个简单的查询来验证连接
    await db.prepare('SELECT 1').all();
    return true;
  } catch (error) {
    console.error('数据库连接验证失败:', error);
    return false;
  }
}

/**
 * 获取数据库连接并进行验证
 * @param {object} env - 环境变量对象
 * @returns {Promise<D1Database>} 数据库连接对象
 */
export async function getDatabaseWithValidation(env) {
  if (!env || typeof env !== 'object') {
    throw new Error('环境变量配置错误');
  }
  
  // 使用getDatabase函数获取数据库连接，支持白名单绑定名称
  const db = getDatabase(env);
  
  if (!db) {
    throw new Error('数据库连接配置缺失，请检查wrangler.toml中的D1绑定配置');
  }
  
  // 验证数据库对象类型
  if (typeof db.prepare !== 'function' || typeof db.batch !== 'function') {
    throw new Error('数据库连接对象无效');
  }
  
  // 验证数据库连接是否可用
  try {
    const result = await db.prepare('SELECT 1').run();
    if (!result || typeof result.success !== 'boolean') {
      throw new Error('数据库连接测试失败');
    }
    
    if (!result.success) {
      throw new Error('数据库查询执行失败');
    }
    
    return db;
  } catch (error) {
    console.error('数据库连接验证失败:', error);
    throw new Error(`数据库连接验证失败: ${error.message}`);
  }
}