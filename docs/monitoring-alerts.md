# 📊 监控与告警配置指南

> 最后更新：2026年1月11日

## 🔍 监控概览

临时邮箱服务提供多层监控体系，确保服务稳定性和性能。

## 📈 Cloudflare Workers Analytics

### 基础指标监控

```json
{
  "requests": "总请求数",
  "errors": "错误请求数", 
  "cpu_time": "CPU使用时间",
  "duration": "请求处理时长",
  "subrequests": "子请求数量"
}
```

### 配置步骤

1. **启用 Workers Analytics**
   ```bash
   # 在 wrangler.toml 中启用
   [analytics_engine]
   binding = "ANALYTICS"
   dataset = "temp_mail_analytics"
   ```

2. **自定义日志事件**
   ```javascript
   // 在代码中添加自定义事件
   ANALYTICS.writeDataPoint({
     indexes: ['api_request'],
     blobs: [request.method, request.url],
     doubles: [Date.now(), response.status]
   });
   ```

## 🚨 告警规则配置

### 关键告警指标

| 指标 | 阈值 | 严重程度 | 检查频率 |
|------|------|----------|----------|
| 错误率 | > 5% | P0 | 1分钟 |
| 平均响应时间 | > 2000ms | P1 | 5分钟 |
| CPU 时间 | > 100ms/请求 | P1 | 5分钟 |
| 内存使用 | > 128MB | P2 | 10分钟 |
| 邮箱创建失败率 | > 10% | P0 | 1分钟 |

### Cloudflare 告警配置

```bash
# 使用 wrangler 创建告警
wrangler alerts create \
  --name "high-error-rate" \
  --type workers \
  --threshold 5 \
  --comparison above \
  --duration 5 \
  --notification-email admin@example.com
```

## 📋 健康检查配置

### API 健康检查端点

```javascript
// 在 server.js 中添加健康检查
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: Date.now(),
    checks: {
      database: await checkDatabase(),
      r2_storage: await checkR2Storage(),
      cache: await checkCache(),
      rate_limit: await checkRateLimit()
    }
  };
  
  return Response.json(health);
});
```

### 外部监控服务

```yaml
# uptime-kuma 配置示例
- name: "Temp Email API"
  url: "https://your-worker.workers.dev/health"
  method: GET
  expectedStatus: 200
  timeout: 10
  interval: 60
  retries: 3
```

## 🔄 性能优化监控

### 缓存命中率监控

```javascript
// 在 cacheHelper.js 中添加统计
const cacheStats = {
  hits: 0,
  misses: 0,
  get hitRate() {
    return this.hits / (this.hits + this.misses) || 0;
  }
};

// 记录缓存访问
function getFromCache(key) {
  if (CACHE.has(key)) {
    cacheStats.hits++;
    return CACHE.get(key);
  }
  cacheStats.misses++;
  return null;
}
```

### 数据库查询性能

```sql
-- D1 性能监控查询
SELECT 
  COUNT(*) as total_queries,
  AVG(duration) as avg_duration,
  MAX(duration) as max_duration
FROM 
  d1_queries 
WHERE 
  timestamp > datetime('now', '-1 hour');
```

## 📊 日志分析配置

### Workers Logpush

```toml
# wrangler.toml 配置
[[logpush]]
dataset = "workers"
destination = "datadog"

[logpush.fields]
include = ["ClientIP", "RayID", "RequestHeaders", "ResponseStatus"]
```

### 结构化日志格式

```javascript
// 在 logger.js 中优化日志格式
const structuredLog = {
  timestamp: new Date().toISOString(),
  level: 'info',
  message: 'API request processed',
  context: {
    method: request.method,
    path: request.url,
    status: response.status,
    userAgent: request.headers.get('User-Agent'),
    rayId: request.headers.get('CF-Ray-ID'),
    duration: Date.now() - startTime
  }
};
```

## 🛡️ 安全监控

### 异常访问检测

```javascript
// 在 rateLimit.js 中添加安全监控
function detectSuspiciousActivity(ip, path) {
  const key = `suspicious:${ip}`;
  const count = (await CACHE.get(key)) || 0;
  
  if (count > 10) {
    // 触发告警
    logger.warn('Suspicious activity detected', { ip, path, count });
    
    // 可选：临时封禁IP
    await CACHE.set(key, count + 1, 3600); // 封禁1小时
  }
}
```

### API 滥用检测

| 行为模式 | 阈值 | 动作 |
|----------|------|------|
| 频繁邮箱创建 | > 10次/分钟 | 限制访问 |
| 大量邮件发送 | > 50封/小时 | 临时封禁 |
| 异常用户代理 | 未知UA模式 | 记录日志 |

## 🔧 故障排除工具

### 实时调试端点

```javascript
// 仅开发环境启用
if (ENVIRONMENT === 'development') {
  app.get('/debug/cache', (req, res) => {
    return Response.json({
      stats: cacheStats,
      entries: Array.from(CACHE.entries())
    });
  });
}
```

### 性能分析工具

```bash
# 使用 wrangler 性能分析
wrangler tail --format pretty
wrangler dev --inspect
```

## 📋 监控检查清单

- [ ] 配置 Workers Analytics
- [ ] 设置基础告警规则
- [ ] 实现健康检查端点
- [ ] 配置日志推送
- [ ] 监控缓存命中率
- [ ] 设置数据库性能监控
- [ ] 配置安全异常检测
- [ ] 测试告警通知

## 🚀 最佳实践

1. **分层监控**：从基础设施到应用层的全面监控
2. **预警机制**：在问题发生前预警，而非事后报警
3. **自动化响应**：尽可能自动化故障恢复
4. **持续优化**：基于监控数据持续优化性能
5. **文档完善**：确保团队了解监控体系和响应流程