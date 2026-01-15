# GitHub Actions 部署配置指南

## 🔧 修复部署失败问题

### 问题分析
当前部署失败的主要原因是缺少必要的GitHub Secrets配置。

### 项目部署架构说明

本项目提供两种互补的部署方式：

#### 1. **GitHub Actions 一键部署**（本仓库内置 `ci.yml`）
- **用途**：通过 GitHub Actions 自动部署到 Cloudflare Workers
- **触发条件**：push 到 main 分支或在 Actions 中手动触发
- **需要配置**：GitHub Secrets（至少 `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`）

#### 2. **Cloudflare 控制台一键部署（Deploy with Workers 按钮）**
- **用途**：在 Cloudflare Dashboard 中通过 "Deploy to Workers" 按钮从 Git 仓库部署
- **触发条件**：用户在 Cloudflare 控制台点击部署按钮
- **需要配置**：在 Cloudflare 控制台中完成 Git 集成和环境变量配置（本仓库不包含 `deploy.yml` 文件）

### 解决方案

#### 1. 配置GitHub Secrets（针对GitHub Actions部署）
在GitHub仓库中设置以下Secrets：

**必需配置：**
- `CLOUDFLARE_API_TOKEN` - Cloudflare API Token
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare Account ID

**设置步骤：**
1. 前往您的GitHub仓库
2. 点击 Settings → Secrets and variables → Actions
3. 点击 "New repository secret"
4. 添加上述两个Secrets

#### 2. 获取Cloudflare配置信息

**获取Account ID：**
1. 登录Cloudflare控制台
2. 在右上角选择您的账户
3. 在左侧菜单中找到"Workers & Pages"
4. 在页面中可以看到您的Account ID

**创建API Token：**
1. 登录Cloudflare控制台
2. 前往 My Profile → API Tokens
3. 点击 "Create Token"
4. 使用 **"Edit Cloudflare Workers"** 模板（推荐为本项目单独创建一个 Token）
5. 确认权限中至少包含：
   - Workers：对脚本的读取/编辑/部署权限（模板默认会勾选）
   - 如需让脚本自动管理 D1 或 R2，可额外勾选 D1 Databases / R2 Storage 的编辑权限
6. 生成并复制 Token，并将其填入 GitHub Secrets 中的 `CLOUDFLARE_API_TOKEN`

### 验证部署
配置完成后，GitHub Actions 应该能够正常部署。您可以通过以下方式验证：

1. 手动触发工作流：
   - 前往仓库的 **Actions** 标签页
   - 选择 **Deploy to Cloudflare Workers** 工作流
   - 点击 **Run workflow**

2. 或者推送新的更改到 `main` 分支

### 同步作者仓库的更新（上游同步示例）

如果您是通过 **Fork 本仓库 + GitHub Actions** 部署的，建议配置上游（upstream）远程，以便跟随作者更新：

1. 在本地克隆您的 Fork 仓库：

```bash
git clone https://github.com/<your-name>/temp-mail.git
cd temp-mail
```

2. 添加上游远程（指向作者仓库）：

```bash
git remote add upstream https://github.com/noxenys/temp-mail.git
```

3. 需要同步最新代码时，在本地执行：

```bash
git fetch upstream
git merge upstream/main
```

4. 将合并后的代码推送回您的 Fork 仓库（会触发 Actions 部署）：

```bash
git push origin main
```

完成以上步骤后，您的仓库会跟随作者仓库保持更新，GitHub Actions 会在您 `push` 到自己的仓库时自动重新部署到您的 Cloudflare 账户。

### 故障排除
如果仍然失败，请检查：
- Secrets是否正确配置
- Cloudflare账户是否有足够的权限
- 网络连接是否正常

## 📞 支持
如果遇到问题，请参考：
- [Cloudflare Workers文档](https://developers.cloudflare.com/workers/)
- [GitHub Actions文档](https://docs.github.com/en/actions)
