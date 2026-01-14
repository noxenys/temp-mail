# 数据库设置指南

## 问题描述
在 GitHub Actions 环境中，由于认证限制，无法自动完成 D1 数据库的初始化。您需要在 Cloudflare Dashboard 中手动完成数据库初始化。

## 解决方案

### 方法一：通过 Cloudflare Dashboard 手动初始化

1. **登录 Cloudflare Dashboard**
   - 访问 https://dash.cloudflare.com/
   - 选择您的账户和 Workers & Pages 服务

2. **创建 D1 数据库**
   - 在左侧菜单中点击 "Workers & Pages"
   - 选择 "D1" 选项卡
   - 点击 "Create database"
   - 输入数据库名称：`temp_mail_db`
   - 选择区域（推荐选择离您用户最近的区域）
   - 点击 "Create"

3. **获取数据库 ID**
   - 创建完成后，在数据库列表中点击 `temp_mail_db`
   - 在数据库详情页面找到 "Database ID"
   - 复制这个 ID

4. **在 GitHub Secrets 中设置数据库 ID**
   - 在 GitHub 仓库中，进入 "Settings" → "Secrets and variables" → "Actions"
   - 添加或更新 `D1_DATABASE_ID` secret，值为上一步复制的数据库 ID

5. **手动执行数据库初始化脚本**
   - 在 D1 数据库详情页面，点击 "Query" 选项卡
   - 复制 `d1-init.sql` 文件中的全部内容
   - 粘贴到查询编辑器中
   - 点击 "Run" 执行初始化

### 方法二：使用 Wrangler CLI 手动初始化（推荐）

如果您有本地开发环境，可以使用以下命令手动初始化数据库：

```bash
# 1. 安装 Wrangler
npm install -g wrangler

# 2. 登录 Cloudflare
wrangler login

# 3. 创建数据库
wrangler d1 create temp_mail_db

# 4. 获取数据库 ID 并设置到 GitHub Secrets
wrangler d1 list
# 复制 temp_mail_db 的 UUID

# 5. 初始化数据库
wrangler d1 execute temp_mail_db --file=d1-init.sql

# 或者使用基础初始化脚本（如果完整脚本有问题）
wrangler d1 execute temp_mail_db --file=d1-init-basic.sql
```



## 数据库初始化脚本说明

### d1-init.sql
完整的数据库初始化脚本，包含所有表结构和初始数据。

### d1-init-basic.sql
基础初始化脚本，只创建必要的表结构，不包含初始数据。

## 验证数据库初始化

初始化完成后，您可以通过以下方式验证：

1. **在 Cloudflare Dashboard 中验证**
   - 进入 D1 数据库的 "Query" 页面
78→   - 执行：`SELECT name FROM sqlite_master WHERE type='table';`
79→   - 应该能看到 `mailboxes`, `messages`, `users`, `user_mailboxes`, `sent_emails` 等表

2. **使用 Wrangler CLI 验证**
   ```bash
   wrangler d1 execute temp_mail_db --command="SELECT COUNT(*) FROM mailboxes;"
   ```

## 故障排除

### 常见问题

1. **SQLITE_AUTH 错误**
   - 原因：认证信息不正确或过期
   - 解决方案：重新登录 `wrangler login` 或检查 API token

2. **数据库不存在错误**
   - 原因：数据库 ID 不正确或数据库已被删除
   - 解决方案：重新创建数据库并更新 GitHub Secrets

3. **表已存在错误**
   - 原因：数据库已经初始化过
   - 解决方案：跳过初始化步骤或删除重建数据库

### 获取帮助

如果遇到问题，请参考：
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- 检查项目中的其他文档文件

## 自动部署流程

一旦数据库初始化完成，后续的 GitHub Actions 部署将正常工作，因为：
- 数据库已经存在并初始化
- 数据库 ID 已正确配置在 GitHub Secrets 中
- 部署脚本会跳过数据库初始化步骤

---

**注意**：首次部署后，请务必完成数据库初始化，否则应用程序可能无法正常工作。
