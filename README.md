# 📧 Temp-Mail - 现代化临时邮箱服务

# 📋 目录
- [📖 项目概述](#-项目概述)
- [📸 项目展示](#-项目展示)
- [🌟 功能特性](#-功能特性)
- [🤖 Telegram Bot 集成](#-telegram-bot-集成)
- [🏗️ 系统架构](#️-系统架构)
- [🚀 部署指南](#-部署指南)
  - [推荐部署方式](#推荐部署方式)
  - [方案一：Cloudflare 一键部署](#方案一cloudflare-一键部署)
  - [方案二：GitHub Actions 自动部署](#方案二github-actions-自动部署推荐生产环境)
  - [方案三：本地一键部署](#方案三本地一键部署)
  - [📧 配置邮件路由](#-配置邮件路由重要)
- [🛠️ 环境变量配置](#️-环境变量配置)
- [👨‍💻 开发者指南](#-开发者指南)
  - [🗄️ 数据库结构](#️-数据库结构)
  - [🗂️ Wrangler 配置](#️-wrangler-配置)
  - [🗄️ D1 数据库操作](#️-d1-数据库操作)
  - [📋 API 文档](#-api-文档)
  - [🧪 测试与质量保证](#-测试与质量保证)
  - [📊 监控与告警](#-监控与告警)
  - [🔄 CI/CD 自动化](#-cicd-自动化)
  - [🛡️ 安全特性](#️-安全特性)
- [❓ 常见问题](#-常见问题)
- [🔄 版本与路线图](#-版本与路线图)
  - [🔮 未来路线图 (Roadmap)](#-未来路线图-roadmap)
- [🤝 贡献](#-贡献)
- [📄 许可证](#-许可证)

# 📖 项目概述

这是一个基于 Cloudflare Workers 和 D1 数据库的临时邮箱服务，具有现代化界面和丰富的管理功能。

# 📸 项目展示
### 体验地址： `https://tempmail.noxen.de5.net`

> 说明：该地址为官方 Demo / 体验环境，示例配置为 `SITE_MODE=demo`，并已启用访客模式（`GUEST_ENABLED=true` + `GUEST_PASSWORD`）。自建部署默认视为 `selfhost` 模式：不会显示“共享环境/演示站”提示，也不会默认暴露访客入口。

### 体验账号： 
- 访客用户名：guest
- 访客密码：123456

# 🌟 功能特性

## 🎨 现代化界面
- 🎯 **冷静工具化风格**：深蓝背景 + 白色卡片，强调信息密度与可读性
- 🔵 **单一品牌色体系**：全站统一使用品牌蓝作为主色，按钮/链接/选中态一脉相承
- ✨ **克制的动效**：统一 180–220ms 过渡，只保留轻微阴影与亮度变化，无大幅位移/缩放
- 🌈 **签名级渐变细节**：仅在登录卡片与页面级主卡片使用 2px 顶部蓝→蓝紫渐变签名线，禁止大面积渐变背景
- 📱 **响应式布局**：桌面与移动端都有针对性布局和交互优化
- 🌙 **深色登录体验**：登录页为现代深色单卡片设计，配合高对比度文字与输入框

## 📧 邮箱管理
- 🎲 **智能生成**：随机生成临时邮箱地址，支持自定义长度和域名
- 📋 **历史记录**：自动保存历史生成的邮箱，方便重复使用
- 🗑️ **便捷删除**：支持删除单个邮箱和批量管理
- 🔄 **一键切换**：快速在不同邮箱间切换
- 🔍 **搜索功能**：支持快速搜索和筛选邮箱
- 📊 **邮箱统计**：显示每个邮箱的邮件数量和活动状态

## 🛠️ 用户管理功能
- **角色与权限**: 三层权限模型（严格管理员 Strict Admin / 高级用户 Admin / 普通用户 User），严格管理员拥有全部权限
- **用户列表**: 查看用户名、角色、邮箱上限/已用、是否允许发件、创建时间等关键信息
- **用户邮箱**: 查看指定用户名下的邮箱列表，支持一键复制邮箱地址
- **一键跳转邮箱视角**: 在管理后台点击某个用户的邮箱，可直接跳转到首页并自动选中该邮箱收件箱，便于从“管理员视角”快速切换到“普通用户视角”查看邮件
- **创建用户**: 通过用户名/密码/角色创建新用户
- **编辑用户**: 支持改名、重置密码、角色切换、发件权限开关、调整邮箱上限
- **分配邮箱**: 批量为用户分配邮箱地址（支持多行粘贴，自动格式校验）
- **删除用户**: 解除用户与邮箱的绑定关系（不会删除邮箱实体与邮件数据）
- **前端权限防护**: 管理页进入前进行快速鉴权，未授权自动跳转，避免内容闪现
- **操作确认与反馈**: 关键操作提供二次确认弹窗与统一 Toast 提示，操作状态与结果清晰可见

## 💌 邮件功能
- 📧 **实时接收**：自动接收和显示邮件，支持HTML和纯文本
- 🔄 **自动刷新**：选中邮箱后每8秒自动检查新邮件
- 🔍 **智能预览**：自动提取和高亮显示验证码内容
- 📖 **详细查看**：优化的邮件详情显示，支持完整内容渲染
- 📋 **一键复制**：智能识别验证码并优先复制，或复制完整邮件内容
- 🗑️ **灵活删除**：支持删除单个邮件或清空整个邮箱
- ✉️ **发件支持（Resend）**：已接入 Resend，可使用临时邮箱地址发送邮件并查看发件记录（发件箱），支持自定义发件显示名（`fromName`）与批量/定时/取消等能力。**V4.5新增**：支持多域名配置，智能选择API密钥。详情见《[Resend 密钥获取与配置教程](docs/resend.md)》

- 🛡️ **风控与反滥用**：支持按发件邮箱 / 域名维度的黑名单拦截，阻止垃圾与滥用邮件进入收件箱
- 🌟 **重要邮件保护**：支持将邮件标记为“置顶/重要”，自动清理时会跳过这些邮件；支持按邮箱自定义保留天数
- 🧩 **后台运维面板**：后台支持查看和管理黑名单、邮箱登录权限与保留策略，便于日常运维
- 🤖 **Bot 收信支持**：可通过 Telegram Bot 管理邮箱、拉取最新邮件和验证码，在聊天界面收取/查看临时邮箱的收件情况

## 🤖 Telegram Bot 集成

- 启用条件：配置 `TELEGRAM_BOT_TOKEN` 和 `TELEGRAM_CHAT_ID` 环境变量。
- Webhook 自动设置行为：
  - 管理员或 guest 登录后台并打开管理页面时，系统会根据当前访问域名自动将 Telegram Webhook 设置为 `当前域名/telegram/webhook`（例如：`https://your-worker.workers.dev/telegram/webhook`）。
  - 如果自动设置失败或你需要指定其他地址，可在后台使用「设置 Webhook / 重新连接」按钮手动修复。
- 命令列表自动配置：
  - 系统会自动调用 Telegram 的 `setMyCommands` 接口，将下方列出的核心命令同步到 Bot 的命令菜单中，无需在 BotFather 中手动配置。
- 核心命令：
  - `/start`：显示欢迎信息和可用命令列表。
  - `/new [域名]`：创建一个新邮箱（可选指定域名，如 `/new example.com`）。未指定时会从当前活跃域名中随机选择后缀。
  - `/list`：查看当前 Telegram 账号绑定的邮箱列表。
  - `/latest [邮箱]`：查看指定邮箱的最新一封邮件（不填时默认取最近的邮箱）。
  - `/code [邮箱]`：快速获取最新邮件中的验证码或登录链接。
  - `/emails [邮箱]`：列出指定邮箱最近几封邮件（含主题、时间和验证码/链接）。
  - `/domains`：查看当前可用的域名列表。
  - `/domainstats`：查看各域名的使用统计。
  - `/id`：查看当前 Chat ID，便于配置到 `TELEGRAM_CHAT_ID`。
- 典型使用示例：

```text
/start
👋 欢迎使用临时邮箱 Bot！...

/new
✅ 成功创建邮箱：
foo123@example.com

/latest foo123@example.com
📧 最新邮件 (...):
发件人: ...
主题: ...
验证码: 123456
```

- 实现位置：`src/telegram.js`。

## 📱 移动端优化
- 📱 **移动端专用样式**：专为移动设备优化的CSS样式（app-mobile.css）
- 🎯 **触摸友好**：优化触摸操作体验，按钮和点击目标放大、留白增大
- 📐 **响应式布局**：通过 CSS 媒体查询与 app-mobile.js，在手机上自动切换为单列布局，并重排侧栏/历史邮箱视图
- 🧭 **视图分级导航**：移动端将首页拆分为“生成邮箱 / 历史邮箱 / 收件箱”三级视图，顶部使用分段按钮和返回栈管理导航，而不是固定底部导航栏
- ✉️ **二级页操作条**：在移动端收件箱视图中，将“发送邮件/清空邮件”等操作收拢为吸顶操作条，提升可触达性
- 🔄 **自动刷新体验优化**：移动端同样支持自动刷新邮件列表，刷新按钮收纳为标题栏图标，避免占用竖屏空间
- 📝 **简化操作**：移动端隐藏部分非核心控件，只保留最常用的收件/发件操作，减少干扰

## 🔧 技术特性
- ⚡ **基于 Cloudflare**：利用全球网络，访问速度快
- 💾 **D1 数据库**：可靠的数据存储，支持数据持久化
- 🔁 **智能初始化**：自动检测数据库状态，避免重复初始化导致的数据丢失
- 🔐 **安全认证**：内置登录系统，保护数据安全
- 🎯 **API 完善**：提供完整的 RESTful API 接口
- 🚀 **缓存系统**：内存缓存系统（表结构、邮箱ID、用户配额、统计数据）
- 🛡️ **速率限制**：基于IP和API路径的请求频率控制
- 📊 **日志系统**：结构化日志记录系统（INFO、WARN、ERROR级别）
- 🧪 **测试框架**：已集成 Vitest 与 ESLint 脚本，当前仓库未包含业务侧测试用例，建议按需补充
- 📈 **监控告警**：Cloudflare Workers Analytics 监控和告警配置
- 🔄 **CI/CD**：GitHub Actions 自动化测试和部署流水线
- 🔐 **环境变量配置**：支持通过环境变量灵活配置，便于CI/CD集成
- 🎨 **CSS现代化**：使用CSS变量、渐变、滤镜等现代CSS特性
- 📱 **响应式设计**：采用移动优先的设计理念，确保跨设备兼容性

#### 性能优化
- **数据库优化**：优化 SQL 查询语句，减少数据库负载
- **缓存策略**：合理使用缓存，提升响应速度
- **资源压缩**：对静态资源进行压缩，减少传输时间
- **CDN 分发**：利用 Cloudflare CDN 加速静态资源分发
- **连接池管理**：优化数据库连接池配置，提高并发处理能力
- **代码分割**：按需加载 JavaScript 模块，减少初始加载时间

# 🏗️ 系统架构

### 核心组件

- **Cloudflare Workers**：无服务器计算平台，处理HTTP请求和业务逻辑
- **D1 Database**：SQL数据库，存储邮箱、邮件和用户信息
- **R2 Storage**：对象存储，保存完整的邮件内容（EML格式）
- **Email Routing**：邮件路由服务，将收到的邮件转发到Worker处理
- **Workers KV**：键值存储，用于缓存和会话管理（可选）

### 数据流向

1. **邮件接收**：外部邮件 → Cloudflare Email Routing → Worker → R2 (EML文件) → D1 (元数据)
2. **邮件发送**：用户请求 → Worker → Resend API → 外部邮件服务器
3. **数据访问**：用户请求 → Worker → D1 (元数据) → R2 (完整内容) → 响应用户

# 🚀 部署指南

## 推荐部署方式

- 生产环境和长期维护：推荐 **Fork 本仓库 + GitHub Actions 自动部署**，每次更新从上游拉取最新代码后，由 Actions 自动发布到你自己的 Cloudflare 账户。
- 快速体验与个人使用：可使用下方的 **Cloudflare 一键部署按钮**，在自己的账户下快速创建一个独立实例，适合体验和小规模使用。

> 一键部署创建的 Worker 不会自动跟踪本仓库后续提交。如需持续获得更新，建议 fork 本仓库并使用 GitHub Actions 或本地 wrangler 部署。

## 方案一：Cloudflare 一键部署

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/noxenys/temp-mail)

点击上方按钮，使用 Cloudflare 官方的 "Deploy to Workers" 功能，无需本地环境配置。

**在 Cloudflare 控制台需要做的事情：**

1. 完成一键部署向导后，进入 Worker 详情页：`Workers & Pages → 你的 Worker → Settings → Variables`。
2. 在 **Environment Variables / Secrets** 中添加以下**必需变量**：
   - `MAIL_DOMAIN`：你的域名（如 `example.com`）。
   - `JWT_SECRET`：随机生成的密钥字符串。
   - `ADMIN_PASSWORD`：管理后台密码（强烈建议）。

> 📝 **详细配置说明**：请参考下文 [🛠️ 环境变量配置](#️-环境变量配置) 章节获取完整变量列表（含 Bot、Resend、转发规则等）。

> ✅ Cloudflare 一键部署 **不需要配置 `D1_DATABASE_ID`**，D1 绑定会由界面或后续脚本自动完成。

## 方案二：GitHub Actions 自动部署（推荐生产环境）

适合希望自动同步更新且隐私隔离的用户。无需按钮授权，所有密钥保存在你自己的 Fork 仓库，适合作为**生产环境的主力部署方式**。

**基本步骤：**
- Fork 本仓库到你的 GitHub 账户
- 在 Fork 仓库 Settings → Secrets and variables → Actions 添加以下 Secrets：
  - **CI/CD 必需**：
    - `CLOUDFLARE_API_TOKEN`：具有 Workers 和 D1 编辑权限的 API 令牌。
    - `CLOUDFLARE_ACCOUNT_ID`：Cloudflare 账户 ID。
  - **运行时配置**（会自动写入 Worker）：
    - `MAIL_DOMAIN`：你的域名。
    - `JWT_SECRET`：随机密钥。
    - `D1_DATABASE_ID`：你的 D1 数据库 ID。
    - `ADMIN_PASSWORD`：管理后台密码。
    - 其他可选变量（`TELEGRAM_BOT_TOKEN`, `RESEND_API_KEY` 等）请参考 [🛠️ 环境变量配置](#️-环境变量配置)。
- 打开 GitHub 仓库的 Actions 页面，选择 **Deploy to Cloudflare Workers** 工作流并运行，完成首次部署
- 后续更新流程：
  - 在本地或 GitHub 上从上游仓库同步最新代码（例如：`git pull upstream main`，再 `git push origin main`）
  - 每次 push 到你的仓库后，GitHub Actions 会重新构建并部署到你自己的 Cloudflare 账户
- 在 Cloudflare Email Routing 中添加 catch‑all，并绑定到该 Worker

> ⚠️ **重要提示**：如果使用 GitHub Actions 部署，请务必在 GitHub 仓库的 **Settings → Secrets and variables** 中配置所有环境变量（包括 `MAIL_DOMAIN`, `JWT_SECRET` 等）。
>
> 原因是：GitHub Actions 部署时会覆盖 Cloudflare 控制台中手动设置的环境变量。如果你只在 Cloudflare 控制台修改了变量，下次 Actions 自动部署时，这些修改会被 GitHub Secrets 中的配置（或空值）覆盖。

## 方案三：本地一键部署

如果你希望**在本地终端用 wrangler 部署**，可以使用下面流程：

```bash
# 克隆项目
git clone https://github.com/noxenys/temp-mail.git
cd temp-mail

# 安装依赖
npm install

# 一键部署（自动创建数据库和初始化）
npm run deploy
```

**前提条件**：
- 已安装 [Node.js](https://nodejs.org/) (>= 20.0.0)
- 已安装 [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- 已通过 `wrangler login` 登录 Cloudflare 账户，或在终端导出 `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`

**部署时会自动完成**：
- 检测并创建 D1 数据库 (`temp_mail_db`)
- 初始化数据库表结构（使用 `d1-init-basic.sql`）
- 部署到 Cloudflare Workers
- 创建 R2 存储桶 (`temp-mail-eml`)

> 💡 更详细的本地部署和数据库初始化说明，请参考根目录的 `DEPLOYMENT_GUIDE.md`、`DATABASE_SETUP_GUIDE.md`。

## 📧 配置邮件路由（重要）

无论采用哪种部署方式，为了让 Worker 能收到邮件，都**必须**配置 Cloudflare Email Routing：

1. 进入 Cloudflare Dashboard → 选择你的域名 → **Email Routing**。
2. 启用 Email Routing（如果尚未启用）。
3. 进入 **Routes** 标签页，点击 **Create rule**。
4. 创建 **Catch-all address** 规则：
   - **Action**: `Send to a Worker`
   - **Destination**: 选择你部署好的 Worker（如 `temp-mail`）
   - **Status**: `Active`
   - 点击 **Save**。

> ⚠️ 注意：你的 `MAIL_DOMAIN` 环境变量必须与此处配置的域名一致。

### 设置自定义域名（可选）

在 Worker 设置中添加自定义域名（Triggers → Custom Domains），可以使用更短的 API 域名，而非默认的 `*.workers.dev`。

# 🛠️ 环境变量配置
本项目涉及两类环境变量：
- **Worker 运行时变量**：在 Cloudflare Workers 上运行服务时必须/可选的配置。
- **部署辅助变量**：仅在使用 GitHub Actions 等自动化脚本时需要的变量。

> 如果你只想“照着表填变量”，可以先看这张速查表，再往下看详细解释。

| 变量名 | 是否必需 | 作用一句话说明 | 一般在哪里配 |
| ------ | -------- | --------------- | ------------ |
| `ADMIN_PASSWORD` | 强烈推荐 | 管理后台严格管理员密码 | Cloudflare Worker Secrets / GitHub Secrets |
| `JWT_SECRET` | 必需 | 登录会话签名密钥，所有登录都依赖它 | Cloudflare Worker Secrets / GitHub Secrets |
| `MAIL_DOMAIN` | 必需 | 用来生成临时邮箱的域名列表 | Cloudflare Worker Variables / GitHub Secrets |
| `ADMIN_NAME` | 可选 | 管理员用户名，默认 `admin` | Cloudflare Worker Variables / GitHub Secrets |
| `CACHE_TTL` | 可选 | Worker 内缓存有效期，降低 D1 访问频率 | Cloudflare Worker Variables |
| `CLOUDFLARE_ACCOUNT_ID` | 部署用 | 指定要操作的 Cloudflare 帐号 | GitHub Secrets / 本地终端环境变量 |
| `CLOUDFLARE_API_TOKEN` | 部署用 | Cloudflare API Token（在 Dashboard 的 API Tokens 页面生成） | GitHub Secrets / 本地终端环境变量 |
| `D1_DATABASE_ID` | 部署用 | 绑定到哪个 D1 数据库（只在 CI 脚本中用） | GitHub Secrets |
| `EMAIL_RETENTION_DAYS` | 可选 | 全局默认邮件保留天数（单个邮箱没配置时用它） | Cloudflare Worker Variables / Secrets |
| `FORWARD_RULES` | 可选 | 邮件自动转发规则，转发到常用邮箱 | Cloudflare Worker Secrets / Variables |
| `GUEST_PASSWORD` | 可选 | 访客账号的登录密码（隐藏演示用） | Cloudflare Worker Secrets / GitHub Secrets |
| `GUEST_ENABLED` | 可选 | 显式开启访客入口和访客提示条 | Cloudflare Worker Secrets / GitHub Secrets |
| `JWT_TOKEN` | 可选 | 根管理员令牌（万能管理密钥，用于脚本/调试） | Cloudflare Worker Secrets / GitHub Secrets |
| `MAIL_LOCALPART_MIN_LEN` / `MAIL_LOCALPART_MAX_LEN` | 可选 | 随机邮箱前缀长度范围 | Cloudflare Worker Variables |
| `MAX_EMAIL_SIZE` | 可选预留 | 预留的“单封邮件最大尺寸”配置，当前代码尚未启用限制 | Cloudflare Worker Secrets |
| `RESEND_API_KEY` | 可选 | Resend 发件密钥，开启“发件箱”功能 | Cloudflare Worker Secrets / GitHub Secrets |
| `TELEGRAM_BOT_TOKEN` | 可选 | Telegram Bot 的访问令牌 | Cloudflare Worker Secrets |
| `TELEGRAM_CHAT_ID` | 可选 | 默认接收通知的 Telegram 会话 ID | Cloudflare Worker Variables |
| `SITE_MODE` | 可选 | 控制登录页提示条模式（`demo` / `selfhost`） | Cloudflare Worker Variables / Secrets |
| `SHOW_DEMO_BANNER` | 废弃 | 旧版演示站提示开关，新版本中不再生效 | Cloudflare Worker Variables / Secrets |

> 提示：如果你通过 **GitHub Actions** 部署本项目，**请不要在 Cloudflare 控制台中添加或编辑任何环境变量**。所有环境变量都应该只配置在 GitHub Secrets / 本地环境中，Actions 部署时会把这些值写入 Worker，并覆盖控制台中原有的同名配置。

> Cloudflare API Token 权限建议：
> - 在 Cloudflare Dashboard → **My Profile → API Tokens** 中，使用官方模板 **“Edit Cloudflare Workers”** 创建一个新的 Token；
> - 确保至少勾选 Workers 相关的编辑权限（模板会自动带上）；
> - 如果希望脚本自动管理 D1 数据库 / R2 存储桶，可额外为该 Token 打开对应资源的编辑权限（D1 Databases / R2 Storage），不要勾选与你项目无关的多余权限；
> - 推荐只为这个项目单独创建一个 Token，避免复用到其他无关服务。

### Worker 运行时必需变量
- `MAIL_DOMAIN`：用于生成临时邮箱的域名，支持多个，使用逗号或空格分隔（如 `example.com, domain2.com`）
  - 示例：`MAIL_DOMAIN="example.com,domain2.com"`
  - 用途：前端展示可用域名列表，Worker 根据这些域名接收/生成邮箱地址
  - 注意：确保已在 Cloudflare Email Routing 中添加 catch-all 规则，并绑定到该 Worker
- `JWT_SECRET`：JWT 会话签名密钥（必填）
  - 示例：`JWT_SECRET="your_jwt_secret_key"`
  - 用途：用于登录会话的签名与校验，影响所有基于 Cookie/JWT 的登录
- `ADMIN_PASSWORD`：后台访问密码（严格管理员登录，生产环境强烈建议配置）
  - 示例：`ADMIN_PASSWORD="your_secure_password"`
  - 用途：管理员账号的登录密码，用于进入管理后台

### Worker 运行时可选变量
- `JWT_TOKEN`：根管理员令牌（Root Admin Override，可选但推荐配置）
  - 示例：`JWT_TOKEN="your_root_admin_token"`
  - 用途：携带该令牌即可直接以最高管理员身份访问受保护接口，便于脚本/调试
- `GUEST_PASSWORD`：访客登录密码（可选）
  - 示例：`GUEST_PASSWORD="guest_access_password"`
  - 用途：为访客账号设置统一密码，用于只读或受限访问
- `GUEST_ENABLED`：访客模式开关（可选）
  - 可选值：`true` / `1`，默认关闭
  - 用途：显式开启登录页的“访客账号登录”按钮与访客模式提示；未开启时，自建站默认不会展示访客入口。
- `SITE_MODE`：站点模式控制（可选）
  - 可选值：`demo` / `selfhost`，默认视为 `selfhost`
  - 当为 `demo` 时：登录页展示“官方体验站 / 共享环境”提示条，访客登录进入首页时顶部会出现“体验站 / 共享环境”横幅，并附带部署文档链接，部分功能可能受限
  - 当为 `selfhost` 时：不展示 Demo 提示条和顶部横幅；即便存在访客账号，也不会把自建站标记为“共享环境/仅演示”
- `SHOW_DEMO_BANNER`：旧版兼容开关（已废弃，保留向后兼容）
  - 说明：早期版本用于控制演示站提示条，新版本中登录页提示完全由 `SITE_MODE` 控制，`SHOW_DEMO_BANNER` 不再影响界面显示。新部署请不要再使用该变量，仅旧版本升级场景可暂时保留。
- `ADMIN_NAME`：严格管理员用户名（默认 `admin`）
  - 示例：`ADMIN_NAME="myadmin"`
  - 用途：管理员登录使用的用户名，对应后台的严格管理员
- `ADMIN_PASS`：与 `ADMIN_PASSWORD` 等价的别名（可选）
  - 示例：`ADMIN_PASS="your_admin_password"`
- `RESEND_API_KEY` / `RESEND_TOKEN` / `RESEND`：Resend 发件配置。支持单密钥、多域名键值对、JSON 格式
  - 用途：启用发件功能，将邮件通过 Resend API 发出
- `FORWARD_RULES`：邮件转发（转发到指定邮箱）。支持两种格式：`JSON 数组` 或 `逗号分隔 KV`
  - JSON 格式示例：`FORWARD_RULES='[{"source":"*@example.com","target":"user@gmail.com"}]'`
  - KV 格式示例：`FORWARD_RULES="*@example.com=user@gmail.com,*@domain.com=user2@gmail.com"`
  - 用途：将收到的邮件自动转发到你的常用邮箱
- `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`：用于启用 Telegram Bot 登录协助与系统告警推送（可选）
  - 用途：通过 Telegram 接收登录链接、系统异常告警等通知
- `MAIL_LOCALPART_MIN_LEN` / `MAIL_LOCALPART_MAX_LEN`：邮箱前缀随机长度区间（可选）
  - 示例：`MAIL_LOCALPART_MIN_LEN="4"`, `MAIL_LOCALPART_MAX_LEN="16"`
  - 用途：控制生成邮箱的本地部分（@ 前）最小和最大长度。Telegram Bot 等服务在未显式指定长度时，会在该区间内随机选择长度生成前缀。
- `EMAIL_RETENTION_DAYS`：默认邮件保留天数（天，可选）
  - 示例：`EMAIL_RETENTION_DAYS="60"`
  - 用途：作为系统级默认保留天数，当某个邮箱未设置专属保留策略时使用；未配置时默认 60 天
- `MAX_EMAIL_SIZE`：单封邮件允许的最大大小（字节，可选）
  - 示例：`MAX_EMAIL_SIZE="1048576"`（约 1MB）
  - 用途：预留变量，目前代码中尚未启用限制，可用于后续限制单封邮件大小，避免异常大邮件占用资源
- `CACHE_TTL`：本地缓存 TTL 配置（秒，可选）
  - 示例：`CACHE_TTL="60"`
  - 用途：控制 Worker 内缓存一些查询结果的时间，降低 D1 访问频率

### 部署辅助变量（CI/CD 用）
- `D1_DATABASE_ID`：D1 数据库 ID（仅在使用 GitHub Actions 智能部署脚本时必填）
  - 示例：`D1_DATABASE_ID="your_d1_database_id_here"`
  - 用途：CI 流水线中自动替换 wrangler.toml 里的占位符，完成数据库绑定
  - 注意：本地手动部署时可以不设置，由 wrangler 控制台或命令行直接配置 `database_id`

### RESEND_API_KEY / RESEND_TOKEN 多域名配置说明

支持三种配置格式，满足不同场景需求：

1. **单密钥格式**（向后兼容）
   ```
   RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxx"
   ```

2. **键值对格式**（推荐）
   ```
   RESEND_API_KEY="domain1.com=re_key1,domain2.com=re_key2"
   ```

3. **JSON格式**
   ```
   RESEND_API_KEY='{"domain1.com":"re_key1","domain2.com":"re_key2"}'
   ```

**使用说明：**
- 发送邮件时，系统会根据发件人邮箱域名自动选择对应的API密钥
- 如果发件人域名未配置对应密钥，发送将失败
- 批量发送时会自动按域名分组，并行处理以提升效率
- 单密钥格式兼容旧版配置，可直接升级使用

**配置工作原理：**
系统在发送邮件时会执行以下步骤：
1. **提取发件人域名**：从发件人邮箱地址（如 `user@domain1.com`）中提取域名部分（`domain1.com`）
2. **查找对应密钥**：在配置中查找与该域名匹配的API密钥
3. **智能选择密钥**：使用匹配的API密钥调用Resend API发送邮件
4. **批量优化**：批量发送时，系统会自动按域名分组，并行处理以提升效率


# 👨‍💻 开发者指南

## 🗄️ 数据库结构

使用 Cloudflare D1 数据库存储业务数据，核心表结构如下（详见 d1-init.sql）：

- **mailboxes** 表：存储邮箱账户信息
  - 主要列：`id`, `address`, `local_part`, `domain`, `password_hash`,
    `created_at`, `last_accessed_at`, `expires_at`, `is_pinned`, `can_login`,
    `retention_days`

- **messages** 表：存储接收邮件的元数据及 R2 对象位置
  - 主要列：`id`, `mailbox_id`, `sender`, `to_addrs`, `subject`,
    `verification_code`, `preview`, `r2_bucket`, `r2_object_key`,
    `received_at`, `is_read`, `is_pinned`

- **users** 表：登录用户信息
  - 主要列：`id`, `username`, `password_hash`, `role`, `can_send`,
    `mailbox_limit`, `created_at`, `telegram_chat_id`, `telegram_username`

- **user_mailboxes** 表：用户与邮箱的绑定关系
  - 主要列：`user_id`, `mailbox_id`, `is_pinned`, `created_at`
  - 用于实现“用户级置顶”与配额统计

- **sent_emails** 表：Resend 发件记录
  - 主要列：`from_addr`, `to_addrs`, `subject`, `status`, `resend_id`,
    `created_at`, `updated_at`, `scheduled_at`

- **domains** 表：可用域名列表及活跃状态

- **blocked_senders** 表：黑名单规则（按邮箱/域名匹配）

## 🗂️ Wrangler 配置

使用 Wrangler v4 配置：

**D1 数据库绑定**：
```toml
[[d1_databases]]
binding = "temp_mail_db"  # 绑定名称，与代码中保持一致
database_name = "temp_mail_db"
database_id = "your-database-id-here"  # 在部署时会被替换
```

**兼容性日期**：
```toml
compatibility_date = "2026-01-11"
```

## 🗄️ D1 数据库操作

```bash
# 初始化远程数据库（创建表结构）
npm run d1:setup

# 执行 SQL 查询（交互模式）
npm run d1:query

# 执行 SQL 文件
npx wrangler d1 execute temp_mail_db --remote --file=path/to/file.sql

# 本地开发数据库操作
npx wrangler d1 execute temp_mail_db --local --file=path/to/file.sql

# 数据库备份
npx wrangler d1 backup create temp_mail_db

# 查看数据库信息
npx wrangler d1 info temp_mail_db

# 查看数据库内容
npx wrangler d1 execute temp_mail_db --local --command="SELECT * FROM mailboxes LIMIT 10"

# 清空测试数据
npx wrangler d1 execute temp_mail_db --local --command="DELETE FROM messages; DELETE FROM mailboxes;"
```

## 📋 API 文档

### 根管理员令牌（Root Admin Override）

- 当请求携带与环境变量 `JWT_TOKEN` 相同的令牌时，将被视为最高管理员（strictAdmin），可绕过常规身份验证。
- 支持三种携带方式（任一即可）：
  - Authorization 头：`Authorization: Bearer <JWT_TOKEN>`
  - 自定义头：`X-Admin-Token: <JWT_TOKEN>`
  - URL 查询参数：`?admin_token=<JWT_TOKEN>`
- 适用范围：所有 `/api/*` 接口、`/api/session`、`/receive` 以及管理页访问判定。

完整接口说明已迁移至独立文档，包含登录认证、邮箱与邮件、发件（Resend）以及"用户管理"相关接口。

- 查看文档：[`docs/api.md`](docs/api.md)

### 基础接口速览
- **健康检查**：`GET /api/health`
- **创建邮箱**：`POST /api/mailbox`
- **获取邮箱列表**：`GET /api/mailboxes` (Admin)
- **获取邮件列表**：`GET /api/emails?mailbox=<邮箱>&limit=20`
- **获取邮件详情**：`GET /api/email/:id`
- **登录**：`POST /api/login`
- **获取系统统计**：`GET /api/stats`

## 🛡️ 安全特性

- **代码隔离**：所有用户输入都经过严格验证和转义
- **环境变量保护**：敏感信息通过环境变量管理，不硬编码在代码中
- **自动测试**：持续集成包含安全漏洞扫描
- **权限控制**：严格的访问控制机制，区分普通用户和管理员权限
- **JWT 认证**：使用 JWT 实现安全的会话管理和跨域认证
- **输入验证**：对所有用户输入进行严格验证和过滤，防止注入攻击
- **HTTPS 强制**：强制使用 HTTPS 连接，确保数据传输安全

## 🧪 测试与质量保证

### 运行本地检查
 
```bash
# 安装依赖
npm install
 
# 可选：运行 Vitest 测试（当前仓库未附带业务测试用例，如需请自行添加）
npm test
 
# 代码检查
npm run lint
 
# 自动修复可修复的问题
npm run lint:fix
 
# 类型检查
npm run type-check
 
# 构建项目
npm run build
```
 
目前项目推荐的质量检查包括：
- **代码检查**：使用 ESLint 保持代码风格与基本问题检测
- **类型检查**：通过 TypeScript 做静态类型校验
- **构建验证**：确保代码能够正确打包并在 Workers 环境运行

## 📊 监控与告警

### 健康检查建议
 
目前代码中未内置专用的 `/api/health` 健康检查端点，你可以按需在 `src/apiHandlers.js` 中增加只读检测逻辑（例如探测 D1 / R2 可用性），并将其作为监控探针使用。

### 告警配置

参考 `docs/monitoring-alerts.md` 配置监控告警：
- **错误率告警**：当错误率超过阈值时触发
- **响应时间告警**：当平均响应时间异常时触发
- **资源使用告警**：监控数据库和存储使用情况
- **自定义告警**：根据业务需求配置自定义告警规则

## 🔄 CI/CD 自动化

项目配置了 GitHub Actions CI/CD 流水线，实现一键自动化部署：
### 部署流程

1. **代码检查**：ESLint 代码质量检查
2. **类型检查**：TypeScript 类型安全检查
3. **构建验证**：确保项目能正确构建
4. **一键部署**：自动部署到 Cloudflare Workers，包含数据库创建和初始化

### 触发方式

- **自动触发**：推送代码到 `main` 分支时自动部署
- **手动触发**：在 GitHub Actions 页面手动运行部署工作流

### 数据库与存储配置

- 数据库名称为 `temp_mail_db`，绑定名为 `temp_mail_db`
- R2存储桶名称为 `temp-mail-eml`，绑定名为 `MAIL_EML`
- 智能部署脚本会自动处理数据库创建和环境变量配置

# ❓ 常见问题

**Error 1101（Worker threw exception）**：
- 检查 `server.js` 是否已显式 `import logger`
- 检查 `wrangler.toml` 的 `[[d1_databases]]` 是否为 `binding = "temp_mail_db"` 且 `database_id` 已注入
- 确认已执行 `d1-init-basic.sql`
- 未配置 `RESEND_API_KEY` 的路由会返回 501（预期）而不是抛异常

**本地/线上环境差异**：
- 如使用 `${D1_DATABASE_ID}` 占位，需在 CI 或本地 shell 注入该变量


# 🔄 版本与路线图

## V1

- 前后端基础功能与认证体系
- 邮箱生成、历史记录、邮件列表与详情、清空/删除
- 智能验证码提取与复制、一键复制邮件内容
- 自动刷新与基本的 UI 交互

## V2

- 前端模板解耦合：将首页 UI 从 `public/app.js` 内联模板拆分为独立的 `public/templates/app.html`，降低耦合、便于维护
- 发件（Resend）与发件箱：支持通过 Resend 发送邮件、自定义发件显示名（fromName）
- 邮箱置顶功能：支持将常用邮箱置顶，提升使用体验
- 路由逻辑优化：防止未授权情况下直接访问首页泄露信息

## V3

### 登录与权限

- 新增登录系统与三层权限：超级管理员（Strict Admin）/ 高级用户（Admin）/ 普通用户（User）
- 严格管理员用户名来自 `ADMIN_NAME`（默认 `admin`），密码来自 `ADMIN_PASSWORD`

### 管理后台（用户管理）

- 入口：登录后右上角“用户管理”（严格管理员和演示模式默认显示）
- 查看用户列表（用户名、角色、是否可发件、邮箱上限/已用、创建时间）
- 查看某个用户的邮箱列表
- 创建用户（用户名/密码/角色）
- 编辑用户（改名、改密码、切换角色、是否允许发件、调整邮箱上限）
- 删除用户（不会删除邮箱实体与邮件，仅解除绑定关系）
- 分配邮箱给指定用户（支持批量，前端做格式校验）

## V3.5

### 性能优化

- 提升响应速度：优化数据库查询与索引，减少延迟
- 前端资源优化：减少静态资源加载时间，提升页面渲染速度

### 存储增强

- R2 存储原邮件：新增 Cloudflare R2 对象存储支持，用于保存邮件原始内容
- 混合存储策略：D1 存元数据，R2 存完整邮件内容，优化成本与性能

### 移动端适配

- 手机端适配：优化移动设备体验，整体响应式布局更流畅
- 移动端专属界面：针对手机屏幕的界面布局和交互方式
- 触控优化：提升触屏操作体验
- 支持邮箱单点登录
- 全局邮箱管理：支持限制单个邮箱登录
- 邮箱搜索：便捷查找指定邮箱
- 随机人名生成邮箱
- 列表和卡片两种展示方式

## V4.5

- 多域名发送配置：支持为不同域名配置不同的 Resend API 密钥
- 配置格式扩展：支持键值对、JSON、单密钥三种配置格式，兼容旧版
- 智能 API 选择：根据发件人域名自动选择对应密钥
- 批量发送优化：批量发送时按域名分组并行处理，提升效率

## V5.0

- SQL 优化：降低数据库行读取数，提升查询性能
- 邮箱管理增强：添加邮箱管理页面，支持按域名和登录权限筛选
- 兼容性升级：更新至 `2026-01-11` 兼容性日期，支持最新 Workers 特性
- 性能优化：优化 `HTMLRewriter` 使用方式，提升页面渲染性能
- 现代化 UI：引入 CSS 变量系统，实现深色模式和主题定制
- 移动端优化：进一步优化移动端样式与交互
- 邮箱搜索与筛选：增强邮箱搜索和筛选能力
- 邮件归档与标签：预留归档和标签能力（规划中）

## V6.0

- 风控与反滥用：新增黑名单系统，支持按邮箱或域名拦截恶意发件人，并提供可视化管理界面
- 重要邮件保护：新增邮件加星（Pin）功能，被标记的邮件将长期保留，避免被自动清理
- 灵活留存策略：支持为特定邮箱设置自定义的邮件保留时长（retention days）
- 管理后台升级：新增独立黑名单管理页面，优化管理员权限验证逻辑

## 🔮 未来路线图 (Roadmap)

### 🌟 体验进化 (Experience)

- 多语言支持（i18n）：支持中/英等多语言界面
- 附件支持：集成 Cloudflare R2，支持邮件附件解析、存储与下载
- 桌面通知：基于 Web Push 的新邮件系统通知
- AI 辅助：智能分类与回复建议

### ⚡ 极客与开发者 (Hardcore)

- Webhook 集成：支持自定义回调 URL，邮件到达自动推送 JSON
- API Key 管理：提供长效 API 密钥，方便脚本调用与第三方集成
- 自定义域名：支持后台动态管理域名列表，无需修改代码重新部署

### 🛡️ 服务与运营 (Service)

- 数据洞察：可视化仪表盘，展示系统吞吐、活跃度与健康状态
- 邮件互联：灵活自动转发规则，与其他邮箱服务无缝流转


# 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进项目！

# 📄 许可证

本项目采用 Apache License 2.0 许可证 - 详见 [LICENSE](./LICENSE) 文件。

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

# 🆘 支持

如遇到问题，请：

1. 查看 GitHub Issues
2. 查看文档目录中的相关文档
3. 提交新的 Issue 描述问题
