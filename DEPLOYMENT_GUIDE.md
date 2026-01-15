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

> ⚠️ **重要提示**：请将所有 Worker 运行时环境变量（如 `MAIL_DOMAIN`, `JWT_SECRET` 等）配置在 GitHub Secrets 中。
> 每次 Actions 部署都会用 Secrets 中的配置覆盖 Cloudflare 控制台中的设置。如果你只在 Cloudflare 修改了变量，下次部署时会被覆盖！

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

### 一键部署功能概览
- 使用 GitHub Actions 工作流，将代码自动部署到 Cloudflare Workers（不包含数据库创建和自动测试步骤）。
- 使用本地脚本 `npm run deploy` 时，会结合仓库内的 D1 初始化脚本，自动创建并初始化 `temp_mail_db` 数据库，并更新 `wrangler.toml` 中的数据库绑定配置。
- 测试与代码检查可通过本地运行 `npm run test`、`npm run lint` 等脚本完成；当前默认工作流仅构建并部署，不会自动执行 Vitest 测试。
 - 注意：如果你选择“Fork + GitHub Actions 自动部署”这一路径，请将 Worker 运行时所需的环境变量统一配置在 GitHub Secrets 中，不要再在 Cloudflare 控制台为同一个 Worker 手动填写同名变量。因为每次 Actions 重新拉取代码并部署时，工作流会按 Secrets 再次写入变量，从而覆盖你在 Cloudflare 控制台中手动添加/修改的值。

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
