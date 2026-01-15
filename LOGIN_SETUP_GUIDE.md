# 登录系统配置指南

## 🔍 问题分析

你遇到的登录问题（使用 `admin/123456` 无法登录）是由于**环境变量未正确配置**导致的。

### 根本原因
- **`JWT_SECRET` 已设置** ✅ 这是好的（用于会话签名）
- **但 `ADMIN_PASSWORD` 未设置** ❌ 这是导致登录失败的关键原因

根据登录系统的逻辑，当 `ADMIN_PASSWORD` 未设置时，超级管理员登录会失败，然后系统会尝试其他登录方式，但如果没有其他用户，最终都会失败。

## 🛠️ 解决方案

我已经更新了部署脚本，现在需要你按照以下步骤配置环境变量：

### 步骤1：在GitHub仓库中设置Secrets

1. 进入你的GitHub仓库页面
2. 点击 **Settings** 选项卡
3. 在左侧菜单中找到 **Secrets and variables** → **Actions**
4. 点击 **New repository secret** 按钮，添加以下secrets：

#### 必需的环境变量：
```
名称: ADMIN_PASSWORD
值: 你的超级管理员密码（例如：123456）
```

```
名称: GUEST_PASSWORD
值: 访客账号密码（可选，只读演示账号）
```

```
名称: JWT_SECRET
值: 你的JWT签名密钥（随机字符串，必需）
```

```
名称: MAIL_DOMAIN
值: 你的邮箱域名（例如：example.com）
```

#### 可选的环境变量：
```
名称: ADMIN_NAME
值: admin（默认值，可不设置）
```

### 步骤2：重新触发部署

1. 提交代码更改到GitHub
2. 或者手动触发GitHub Actions：
   - 进入GitHub仓库的 **Actions** 选项卡
   - 选择 **Deploy to Cloudflare Workers** 工作流
   - 点击 **Run workflow** 按钮

### 步骤3：测试登录

部署完成后，使用以下凭据登录：
- **用户名**: `admin`
- **密码**: 你在 `ADMIN_PASSWORD` 中设置的密码

## 📋 登录系统验证流程

系统按照以下优先级进行认证：

### 1. 超级管理员认证（最高优先级）
- **用户名**: 必须与 `ADMIN_NAME` 环境变量匹配（默认 `admin`）
- **密码**: 必须与 `ADMIN_PASSWORD` 环境变量精确匹配

### 2. 普通用户认证
- **用户名**: 在数据库 `users` 表中查找
- **密码**: 使用密码哈希验证

### 3. 邮箱登录
- **用户名**: 有效的邮箱地址
- **密码**: 邮箱地址本身

## 🔧 技术细节

已通过以下文件支持环境变量配置：

### 1. GitHub Actions 工作流文件
- `.github/workflows/ci.yml` 会把 `ADMIN_PASSWORD`, `JWT_SECRET`, `JWT_TOKEN`, `MAIL_DOMAIN`, `D1_DATABASE_ID` 等 Secrets 作为环境变量传递给部署步骤

### 2. 部署脚本
- `deploy-github-actions.js`：在 GitHub Actions 中读取这些环境变量，将它们写入 Worker 的 Secrets，并根据 `D1_DATABASE_ID` 更新 `wrangler.toml` 中的 D1 绑定，最后构建并部署到 Cloudflare Workers。它本身不会在 CI 内创建或初始化 D1 数据库，数据库需要按 `DATABASE_SETUP_GUIDE.md` 事先创建并初始化，或通过本地脚本（如 `npm run deploy`、`npm run d1:execute-basic:remote`）完成。

## ⚠️ 注意事项

1. **密码安全**: 确保 `ADMIN_PASSWORD` 使用强密码
2. **JWT安全**: `JWT_SECRET` 应该是随机生成的强密钥
3. **域名配置**: `MAIL_DOMAIN` 应该是你拥有的有效域名
4. **测试登录**: 部署完成后立即测试登录功能

## 🔄 故障排除

如果仍然无法登录，请检查：

1. **GitHub Actions日志**: 查看部署过程中是否有错误
2. **环境变量设置**: 确认所有secrets都已正确设置
3. **密码匹配**: 确保登录时使用的密码与 `ADMIN_PASSWORD` 完全一致
4. **用户名大小写**: 系统会自动将用户名转换为小写，使用 `admin`（小写）

## 📞 获取帮助

如果按照上述步骤操作后仍然无法登录，请提供：
1. GitHub Actions部署日志
2. 登录时返回的具体错误信息
3. 你的环境变量配置情况

这样我可以提供更具体的帮助。
