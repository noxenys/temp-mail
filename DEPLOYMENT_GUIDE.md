# 临时邮箱服务部署指南

## 🚀 一键部署方案

### 方案一：GitHub Actions 自动部署（推荐）

**步骤：**
1. **Fork 项目**到你的 GitHub 账户
2. **配置 Secrets**：
   - 进入仓库 Settings → Secrets and variables → Actions
   - 添加以下 Secrets：
     - `CLOUDFLARE_API_TOKEN`：你的 Cloudflare API Token
     - `CLOUDFLARE_ACCOUNT_ID`：你的 Cloudflare 账户 ID

3. **触发部署**：
   - 推送代码到 main 分支（自动触发）
   - 或手动触发：Actions → "一键部署到 Cloudflare Workers" → Run workflow

**优势：**
- ✅ 完全自动化
- ✅ 包含测试和代码检查
- ✅ 无需本地环境
- ✅ 支持回滚

### 方案二：本地一键部署

**步骤：**
1. **克隆项目**：
```bash
git clone https://github.com/noxenys/temp-mail.git
cd temp-mail
```

2. **在终端设置 Cloudflare 相关环境变量**：
> 下面以 bash 为例，Windows PowerShell 请使用 `$env:VAR="value"` 形式。

```bash
export CLOUDFLARE_API_TOKEN="你的API Token"
export CLOUDFLARE_ACCOUNT_ID="你的账户ID"
```

3. **一键部署**：
```bash
npm run deploy
```

## 🔧 准备工作

### 1. Cloudflare 账户设置
1. 注册/登录 [Cloudflare账户](https://dash.cloudflare.com)
2. 确保已激活 Workers 服务

### 2. 创建 API Token
1. 访问 [API Tokens页面](https://dash.cloudflare.com/profile/api-tokens)
2. 点击 "Create Token"
3. 使用 "Edit Cloudflare Workers" 模板
4. 复制生成的 Token（只显示一次）

## 📋 部署流程说明

### 一键部署功能
- **自动创建 D1 数据库**（如果不存在）
- **自动初始化数据库表结构**
- **自动部署 Worker 代码**
- **自动运行测试和代码检查**

### 部署后验证
1. 访问你的 Worker 域名：`https://你的worker域名.workers.dev`
2. 测试 API 端点：`https://你的worker域名.workers.dev/api/health`

## 🔒 安全特性

- **代码隐藏**：核心 Worker 逻辑已优化配置，保持代码简洁
- **环境变量保护**：敏感信息通过 Secrets 管理
- **自动测试**：每次部署前运行完整测试套件

## 🛠️ 故障排除

### 常见问题

**错误：CLOUDFLARE_API_TOKEN required**
- 检查 Secrets 配置是否正确
- 确认 Token 权限包含 Workers 编辑权限

**部署失败**
- 查看 GitHub Actions 日志详情
- 检查网络连接和 API 限制

## 📞 支持

如有部署问题，请：
1. 查看 GitHub Actions 日志
2. 检查项目 Issues
3. 提交新的 Issue 描述问题

---

💡 **提示**：推荐使用 GitHub Actions 自动部署，享受完全自动化的部署体验！
