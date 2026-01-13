﻿# 📧 TempMail - 现代化临时邮箱服务

# 📋 目录
- [项目概述](#-项目概述)
- [🌟 功能特性](#-功能特性)
- [🏗️ 系统架构](#️-系统架构)
- [📸 项目展示](#-项目展示)
- [🚀 部署指南](#-部署指南)
- [🔄 版本与路线图](#-版本与路线图)
- [🔧 配置与部署](#-配置与部署)
- [📋 API 文档](#-api-文档)
- [🧪 测试与质量保证](#-测试与质量保证)
- [📊 监控与告警](#-监控与告警)
- [🔄 CI/CD 自动化](#-cicd-自动化)
- [📁 项目结构](#-项目结构)
- [🗄️ 数据库结构](#️-数据库结构)
- [🗂️ Wrangler 配置](#️-wrangler-配置)
- [🔐 环境变量](#-环境变量)
- [🔍 代码质量](#-代码质量)
- [🗄️ D1 数据库操作](#️-d1-数据库操作)
- [📄 API 接口](#-api-接口)
- [🛡️ 安全特性](#️-安全特性)
- [🚀 快速开始（Quick Start）](#-快速开始quick-start)
- [⚙️ 配置（Configuration）](#️-配置configuration)
- [🚀 部署（Deploy）](#-部署deploy)
- [❓ 常见问题（Troubleshooting）](#-常见问题troubleshooting)
- [🤝 贡献](#-贡献)
- [📄 许可证](#-许可证)

# 📖 项目概述

这是一个基于 Cloudflare Workers 和 D1 数据库的临时邮箱服务，具有现代化界面和丰富的管理功能。

# 🌟 功能特性

## 🎨 现代化界面
- 🌈 **毛玻璃效果**：采用现代化的毛玻璃（Glassmorphism）设计风格
- 🎯 **简约美观**：浅色背景，动态渐变，视觉效果出色
- 📱 **响应式设计**：完美适配桌面和移动设备
- 🌙 **深色模式**：自动检测系统主题偏好，提供舒适的夜间浏览体验
- ✨ **动画效果**：平滑的过渡动画和微交互反馈
- 🎨 **CSS变量系统**：采用CSS变量系统实现主题定制和动态样式切换，支持深度个性化

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
- 🔖 **邮件标签**：支持邮件分类和标签功能
- 📁 **邮件归档**：支持邮件归档和恢复

## 📱 移动端优化
- 📱 **移动端专用样式**：专为移动设备优化的CSS样式（app-mobile.css）
- 🎯 **触摸友好**：优化触摸操作体验，支持手势操作
- 📐 **响应式布局**：在小屏幕上提供最佳的布局和交互体验
- ⬇️ **下拉刷新**：支持下拉刷新邮件列表
- 📱 **底部导航**：移动端友好的底部导航栏设计
- 📝 **简化操作**：移动端简化的邮件查看和操作流程

## 🔧 技术特性
- ⚡ **基于 Cloudflare**：利用全球网络，访问速度快
- 💾 **D1 数据库**：可靠的数据存储，支持数据持久化
- 🔁 **智能初始化**：自动检测数据库状态，避免重复初始化导致的数据丢失
- 🔐 **安全认证**：内置登录系统，保护数据安全
- 🎯 **API 完善**：提供完整的 RESTful API 接口
- 🚀 **缓存系统**：内存缓存系统（表结构、邮箱ID、用户配额、统计数据）
- 🛡️ **速率限制**：基于IP和API路径的请求频率控制
- 📊 **日志系统**：结构化日志记录系统（INFO、WARN、ERROR级别）
- 🧪 **测试框架**：完整的单元测试和集成测试套件（Vitest + ESLint）
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

## 🏗️ 系统架构

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

## 📸 项目展示
### 体验地址： `https://tempmail.noxen.de5.net`

### 体验账号： 
- 访客用户名：guest
- 访客密码：123456

## 🚀 部署指南

### 方案一：Cloudflare 一键部署（推荐）

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/noxenys/temp-email)

点击上方按钮，使用 Cloudflare 官方的一键部署功能，无需本地环境配置。

### 方案二：GitHub Actions 自动部署

适合希望自动同步更新且隐私隔离的用户。无需按钮授权，所有密钥保存在你自己的 Fork 仓库。

**步骤：**
- Fork 仓库到你的 GitHub 账户
- 在 Fork 仓库 Settings → Secrets and variables → Actions 添加以下 Secrets（至少前五项）：
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
  - `MAIL_DOMAIN`
  - `ADMIN_PASSWORD`
  - `JWT_TOKEN`
  - 可选：`ADMIN_NAME`、`GUEST_PASSWORD`、`RESEND_API_KEY` 或 `RESEND_TOKEN`、`FORWARD_RULES`
- 打开 Actions，选择"Manual Deploy (Workers)"并运行工作流
- 首次部署后，系统会自动检测并初始化数据库（如尚未初始化）。如需手动初始化数据库：运行 `npm run d1:execute-basic:remote`
- 在 Cloudflare Email Routing 中添加 catch‑all，并绑定到该 Worker

### 方案三：本地一键部署

如果你希望在本地环境部署，可以使用以下命令：

```bash
# 安装依赖
npm install

# 一键部署（自动创建数据库和初始化）
npm run deploy
```

**前提条件**:
*   已安装 [Node.js](https://nodejs.org/) (>= 20.0.0)
*   已安装 [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
*   已配置 Cloudflare API Token 和账户 ID
*   拥有一个 Cloudflare 账户

**部署步骤**:

1.  **克隆或 Fork 本仓库**

    ```bash
    git clone https://github.com/noxenys/temp-email.git
    cd temp-email
    ```

2.  **安装依赖**

    ```bash
    npm install
    ```

3.  **配置环境变量**：在仓库 Settings → Secrets and variables → Actions 中配置以下环境变量：
   - `MAIL_DOMAIN`：你的邮箱域名，多个域名用逗号分隔
   - `ADMIN_PASSWORD`：管理员密码
   - `JWT_TOKEN`：用于 API 认证的令牌
   - `JWT_SECRET`：用于 API 认证的 JWT 密钥
   - `D1_DATABASE_ID`：D1数据库ID（智能部署脚本会自动设置）

4.  **部署到 Cloudflare**

    ```bash
    npm run deploy
    ```

    智能部署脚本会自动：
    - 检测并创建D1数据库 (`temp_email_db`)
    - 初始化数据库表结构
    - 设置环境变量
    - 部署到Cloudflare Workers
    - 创建R2存储桶 (`temp-mail-eml`)

    或者使用直接部署（不包含智能初始化）：
    ```bash
    npm run deploy:direct
    ```

5.  **配置邮件路由**

    为了接收邮件，你需要在 Cloudflare 控制台设置邮件路由：
    - 进入 Cloudflare Dashboard → Workers & Pages → Email Routing
    - 添加邮件路由规则，将 `*${MAIL_DOMAIN}` 路由到你的 Worker
    - 确保域名已正确配置并激活邮件路由

### 邮件路由配置（必需用于收取真实邮件）

如果需要接收真实邮件，需要在 Cloudflare 控制台配置邮件路由：

1. 进入域名的 Email Routing 设置
2. 添加 Catch-all 规则
3. 目标设置为 Worker: `temp-email`

### 设置自定义域名（可选）

在 Worker 设置中添加自定义域名，或使用 workers.dev 子域名。

## 🔄 版本与路线图

### V1
- 前后端基础功能与认证体系
- 邮箱生成、历史记录、邮件列表与详情、清空/删除
- 智能验证码提取与复制、一键复制邮件内容
- 自动刷新与基本的 UI 交互

### V2
- [x] 前端模板解耦合：将首页 UI 从 `public/app.js` 内联模板拆分为独立的 `public/templates/app.html`，降低耦合、便于维护
- [x] 发件（Resend）与发件箱：支持通过 Resend 发送邮件、自定义发件显示名（`fromName`）
- [x] 加邮箱置顶功能，提升用户体验
- [X] 路由逻辑优化 防止首页泄露

### V3
#### 登录与权限
- [X] 新增登录系统与三层权限：超级管理员（Strict Admin）/ 高级用户（Admin）/ 普通用户（User）。
- [X] 默认严格管理员用户名来自 `ADMIN_NAME`（默认 `admin`），密码来自 `ADMIN_PASSWORD`。

#### 管理后台（用户管理）
- [X] 入口：登录后右上角"用户管理"（严格管理员和演示模式默认显示）。
- [X] 查看用户列表（用户名、角色、是否可发件、邮箱上限/已用、创建时间）。
- [X] 查看某个用户的邮箱列表。
- [X] 创建用户（用户名/密码/角色）。
- [X] 编辑用户（改名、改密码、切换角色、是否允许发件、调整邮箱上限）。
- [X] 删除用户（不会删除邮箱实体与邮件，仅解除绑定关系）。
- [X] 分配邮箱给指定用户（支持批量，前端做格式校验）。

### V3.5
#### 性能优化
- [X] **极大提升响应速度**：优化数据库查询效率，减少延迟，显著改善用户体验
- [X] **前端资源优化**：减少静态资源加载时间，提升页面渲染速度

#### 存储增强
- [X] **R2 存储原邮件**：新增 Cloudflare R2 对象存储支持，用于保存邮件原始内容
- [X] **混合存储策略**：D1 数据库存储邮件元数据，R2 存储完整邮件内容，优化存储成本

#### 移动端适配
- [X] **手机端完美适配**：全面优化移动设备体验，响应式设计更加流畅
- [X] **移动端专属界面**：针对手机屏幕优化的界面布局和交互方式
- [X] **触控优化**：优化触屏操作体验，支持手势操作

- [X] 添加支持邮箱单点登陆
- [X] 添加全局邮箱管理功能，支持限制单个邮箱登陆
- [X] 添加邮箱搜索功能，便捷寻找指定邮箱
- [X] 添加随机人名生成邮箱功能
- [X] 列表和卡片两种展示方式

### V4.5
- [X] **多域名发送配置**：支持为不同域名配置不同的Resend API密钥，实现智能发送
- [X] **配置格式扩展**：支持键值对、JSON、单密钥三种配置格式，兼容旧版配置
- [X] **智能API选择**：系统根据发件人域名自动选择对应的API密钥进行发送
- [X] **批量发送优化**：批量发送时自动按域名分组，并行处理提升发送效率

### V5.0
- [X] **SQL优化**：大幅降低数据库行读取数，提升查询性能
- [X] **邮箱管理增强**：添加邮箱管理页面，支持根据域名筛选和登录权限筛选
- [X] **兼容性升级**：更新至2026-01-11兼容性日期，支持最新Cloudflare Workers特性
- [X] **性能优化**：优化 HTMLRewriter 使用方式，提升页面渲染性能
- [X] **现代化UI**：引入CSS变量系统，实现深色模式和主题定制
- [X] **移动端优化**：全面优化移动端体验，包括专用CSS样式和交互优化
- [X] **邮箱搜索**：增加邮箱搜索和筛选功能
- [X] **邮件归档**：支持邮件归档和标签功能

### V5.5（规划中）
- [ ] **AI邮件分类**：集成AI能力，自动分类和标记邮件类型
- [ ] **智能回复**：基于AI的智能邮件回复建议功能
- [ ] **多语言支持**：支持多语言界面和邮件内容处理
- [ ] **高级安全**：增强的安全防护和威胁检测能力

## 🔧 配置与部署

### 快速部署

1. 点击上方 "Deploy to Cloudflare Workers" 按钮
2. 登录 Cloudflare 账户
3. 配置环境变量
4. 完成部署

## 🛠️ 环境变量配置
### 必需环境变量
- `MAIL_DOMAIN`：用于生成临时邮箱的域名，支持多个，使用逗号或空格分隔（如 `example.com, domain2.com`）
  - 示例：`MAIL_DOMAIN="example.com,domain2.com"`
  - 注意：确保已在 Cloudflare Email Routing 中添加 catch-all 规则，并绑定到该 Worker
- `ADMIN_PASSWORD`：后台访问密码（严格管理员登录）
  - 示例：`ADMIN_PASSWORD="your_secure_password"`
- `JWT_TOKEN` 或 `JWT_SECRET`：JWT 签名密钥（二选一，推荐使用 JWT_TOKEN）
  - 示例：`JWT_TOKEN="your_jwt_token"` 或 `JWT_SECRET="your_jwt_secret_key"`
- `D1_DATABASE_ID`：D1 数据库ID（用于绑定数据库连接）
  - 示例：`D1_DATABASE_ID="your_d1_database_id_here"`
  - 注意：此ID在创建D1数据库后自动生成，部署脚本会自动处理

### 可选环境变量
- `GUEST_PASSWORD`：访客登录密码（可选，启用 guest 账号）
  - 示例：`GUEST_PASSWORD="guest_access_password"`
- `ADMIN_NAME`：严格管理员用户名（默认 `admin`）
  - 示例：`ADMIN_NAME="myadmin"`
- `ADMIN_PASS`：与 ADMIN_PASSWORD 等价的别名（可选）
  - 示例：`ADMIN_PASS="your_admin_password"`
- `RESEND_API_KEY` / `RESEND_TOKEN`：Resend 发件配置。支持单密钥、多域名键值对、JSON格式
- `FORWARD_RULES`：邮件转发（转发到指定邮箱）。支持两种格式：`JSON 数组` 或 `逗号分隔 KV`
  - JSON格式示例：`FORWARD_RULES='[{"source":"*@example.com","target":"user@gmail.com"}]'`
  - KV格式示例：`FORWARD_RULES="*@example.com=user@gmail.com,*@domain.com=user2@gmail.com"`

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

详见《[V3 版本更新日志](docs/v3.md)》。

## 📁 项目结构

```
temp-mail/
├── worker.js                 # 主 Worker 入口文件
├── wrangler.toml             # Cloudflare 配置文件
├── package.json              # 项目依赖配置
├── .env.example              # 环境变量示例
├── d1-init-basic.sql         # D1 数据库初始化脚本
├── DATABASE_SETUP_GUIDE.md   # 数据库配置指南
├── docs/                     # 文档目录
│   ├── api.md                # API 接口文档
│   ├── v3.md                 # V3 版本更新日志
│   └── ...
├── src/                      # 源码目录
│   ├── server.js             # 服务器主逻辑
│   ├── routes/               # 路由处理模块
│   │   ├── mailbox.js        # 邮箱管理路由
│   │   ├── email.js          # 邮件处理路由
│   │   └── admin.js          # 管理员路由
│   ├── utils/                # 工具函数
│   │   ├── validation.js     # 输入验证
│   │   ├── crypto.js         # 加密工具
│   │   └── logger.js         # 日志记录
│   └── middleware/           # 中间件
│       ├── auth.js           # 认证中间件
│       └── cors.js           # CORS 中间件
├── public/                   # 静态资源
│   ├── html/                 # HTML 页面
│   │   ├── index.html        # 主页面
│   │   ├── mailbox.html      # 邮箱管理页面
│   │   ├── mailboxes.html    # 邮箱列表页面
│   │   ├── login.html        # 登录页面
│   │   └── admin.html        # 管理员页面
│   ├── css/                  # 样式文件
│   │   ├── app.css           # 主样式文件
│   │   ├── app-mobile.css    # 移动端专用样式
│   │   ├── mailbox.css       # 邮箱页面样式
│   │   ├── mailboxes.css     # 邮箱列表样式
│   │   ├── login.css         # 登录页面样式
│   │   └── admin.css         # 管理员页面样式
│   ├── js/                   # 客户端脚本
│   │   ├── app.js            # 主应用逻辑
│   │   ├── app-mobile.js     # 移动端专用逻辑
│   │   ├── mailbox.js        # 邮箱管理逻辑
│   │   ├── mailboxes.js      # 邮箱列表逻辑
│   │   ├── login.js          # 登录逻辑
│   │   ├── admin.js          # 管理员功能逻辑
│   │   ├── app-router.js     # 应用路由
│   │   ├── auth-guard.js     # 认证守卫
│   │   ├── storage.js        # 本地存储管理
│   │   ├── toast-utils.js    # 提示消息工具
│   │   └── mock.js           # 模拟数据
│   ├── templates/            # HTML模板片段
│   │   ├── footer.html       # 页脚模板
│   │   ├── loading.html      # 加载动画模板
│   │   ├── loading-inline.html # 内联加载动画
│   │   └── toast.html        # 提示消息模板
│   ├── favicon.svg           # 网站图标
└── ...
└── tests/                    # 测试文件
    ├── unit/                 # 单元测试
    └── integration/          # 集成测试
```

## 🗄️ 数据库结构

使用 Cloudflare D1 数据库存储：

- **mailboxes** 表：存储邮箱账户信息
  - id: 邮箱唯一标识符
  - address: 邮箱地址
  - created_at: 创建时间
  - expires_at: 过期时间

- **emails** 表：存储邮件信息
  - id: 邮件唯一标识符
  - mailbox_id: 关联邮箱ID
  - subject: 邮件主题
  - from: 发件人
  - to: 收件人
  - body: 邮件正文
  - received_at: 接收时间
  - size: 邮件大小

- **sessions** 表：存储用户会话信息
  - id: 会话ID
  - mailbox_id: 关联邮箱ID
  - created_at: 创建时间
  - expires_at: 过期时间

## 🗂️ Wrangler 配置

使用 Wrangler v4 配置：

**D1 数据库绑定**：
```toml
[[d1_databases]]
binding = "temp_email_db"  # 绑定名称，与代码中保持一致
database_name = "temp_email_db"
database_id = "your-database-id-here"  # 在部署时会被替换
```

**兼容性日期**：
```toml
compatibility_date = "2026-01-11"
```

## 🔐 环境变量

- `D1_DATABASE_ID`: D1 数据库 ID
- `JWT_TOKEN`: JWT 认证令牌
- `JWT_SECRET`: JWT 密钥
- `RESEND_API_KEY`: Resend API 密钥
- `RESEND_TOKEN`: Resend 令牌
- `ADMIN_PASSWORD`: 管理员密码
- `FORWARD_RULES`: 邮件转发规则
- `MAX_EMAIL_SIZE`: 最大邮件大小限制
- `EMAIL_RETENTION_DAYS`: 邮件保留天数

## 🧪 测试与质量保证

### 运行测试

```bash
# 安装依赖
npm install

# 代码检查
npm run lint

# 类型检查
npm run type-check

# 构建项目
npm run build
```

目前项目包含以下质量保证措施：
- **代码检查**：ESLint 配置确保代码风格一致性
- **类型检查**：TypeScript 类型安全检查
- **构建验证**：确保代码能够正确打包

## 🔍 代码质量

```bash
# 代码检查
npm run lint

# 自动修复可修复的问题
npm run lint:fix

# 类型检查
npm run type-check

# 构建项目
npm run build
```

## 🗄️ D1 数据库操作

```bash
# 初始化远程数据库（创建表结构）
npm run d1:setup

# 执行 SQL 查询（交互模式）
npm run d1:query

# 执行 SQL 文件
npx wrangler d1 execute temp_email_db --remote --file=path/to/file.sql

# 本地开发数据库操作
npx wrangler d1 execute temp_email_db --local --file=path/to/file.sql

# 数据库备份
npx wrangler d1 backup create temp_email_db

# 查看数据库信息
npx wrangler d1 info temp_email_db

# 查看数据库内容
npx wrangler d1 execute temp_email_db --local --command="SELECT * FROM mailboxes LIMIT 10"

# 清空测试数据
npx wrangler d1 execute temp_email_db --local --command="DELETE FROM emails; DELETE FROM mailboxes;"
```

## 📄 API 接口

### 基础接口
- **健康检查**：`GET /api/health`
  - 返回服务状态信息
  - 包含版本号、数据库连接状态等

### 邮箱相关
- **创建邮箱**：`POST /api/mailbox`
  - 请求体：`{ "address": "user@domain.com" }`
  - 返回邮箱信息和访问令牌
- **获取邮箱列表**：`GET /api/mailboxes`
  - 需要管理员权限
- **删除邮箱**：`DELETE /api/mailbox/:id`
  - 需要管理员权限或邮箱拥有者

### 邮件相关
- **获取邮件列表**：`GET /api/emails?mailboxId=:id&limit=20&page=1`
  - 获取指定邮箱的邮件列表
  - 支持分页查询
- **获取邮件详情**：`GET /api/email/:id`
  - 获取单封邮件的详细内容
- **删除邮件**：`DELETE /api/email/:id`
  - 删除指定邮件

### 认证相关
- **登录**：`POST /api/login`
  - 验证邮箱和密码
  - 返回访问令牌
- **验证令牌**：`GET /api/auth/verify`
  - 验证JWT令牌有效性

### 系统接口
- **获取系统统计**：`GET /api/stats`
  - 返回邮箱总数、邮件总数等统计信息
- **获取配置信息**：`GET /api/config`
  - 返回系统配置信息

### 用户管理（管理后台）
- **管理员登录**：`POST /api/admin/login`
  - 使用环境变量设置的管理员密码登录
- **获取用户列表**：`GET /api/admin/users`
  - 分页获取所有用户信息
- **删除用户**：`DELETE /api/admin/user/:id`
  - 删除指定用户及其邮箱

## 🛡️ 安全特性

- **代码隔离**：所有用户输入都经过严格验证和转义
- **环境变量保护**：敏感信息通过环境变量管理，不硬编码在代码中
- **自动测试**：持续集成包含安全漏洞扫描
- **权限控制**：严格的访问控制机制，区分普通用户和管理员权限
- **JWT 认证**：使用 JWT 实现安全的会话管理和跨域认证
- **输入验证**：对所有用户输入进行严格验证和过滤，防止注入攻击
- **HTTPS 强制**：强制使用 HTTPS 连接，确保数据传输安全

## 🧪 测试与质量保证

### 测试覆盖范围

- **单元测试**：核心工具函数（随机ID生成、邮箱验证、时间格式化等）
- **集成测试**：认证功能（JWT令牌、密码哈希等）
- **模拟环境**：Cloudflare Workers 运行时环境模拟
- **覆盖率报告**：支持文本、HTML、LCOV格式的覆盖率报告

### 测试配置

- **测试框架**：Vitest（快速、轻量级的测试运行器）
- **代码检查**：ESLint（代码质量检查）
- **类型检查**：TypeScript（类型安全）
- **覆盖率**：@vitest/coverage-v8（覆盖率统计）

## 📈 监控与告警

### 健康检查端点

项目提供健康检查端点，可用于监控服务状态：

```bash
# 健康检查
curl -X GET https://your-worker.workers.dev/api/health

# 响应示例
{
  "status": "healthy",
  "timestamp": "2026-01-11T00:00:00Z",
  "version": "v5.0",
  "database": "connected",
  "r2": "connected"
}
```

### 告警配置

参考 `docs/monitoring-alerts.md` 配置监控告警：

- **错误率告警**：当错误率超过阈值时触发
- **响应时间告警**：当平均响应时间异常时触发
- **资源使用告警**：监控数据库和存储使用情况
- **自定义告警**：根据业务需求配置自定义告警规则

### 性能优化监控

- **缓存命中率**：监控缓存系统性能
- **数据库查询性能**：监控D1数据库查询效率
- **R2存储性能**：监控对象存储读写性能
- **内存使用**：监控Worker内存使用情况

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

- 数据库名称为 `temp_email_db`，绑定名为 `TEMP_MAIL_DB`
- R2存储桶名称为 `temp-mail-eml`，绑定名为 `MAIL_EML`
- 智能部署脚本会自动处理数据库创建和环境变量配置



## 🚀 快速开始（Quick Start）

**环境要求**：Node.js 20+

```bash
# 安装依赖
npm install

# 本地开发（默认端口 8787）
npm run dev
```

**邮箱访问路径**：
- 首页：`/`
- 邮箱管理：`/html/mailbox.html`

## ⚙️ 配置（Configuration）

**D1 数据库配置**：
- 绑定名：`temp_email_db`（与 wrangler.toml 一致）

**环境变量配置**：
使用 `wrangler secret put` 命令注入以下环境变量：
- `JWT_TOKEN`
- `RESEND_API_KEY` 
- `ADMIN_PASSWORD`

**wrangler.toml 配置**：
```toml
compatibility_date = "2026-01-11"
database_id = "${D1_DATABASE_ID}"  # 需由 CI/本地环境提供
```

## 🚀 部署（Deploy）

**数据库初始化**：
```bash
# 创建 D1 数据库
npx wrangler d1 create temp_email_db

# 执行基础初始化脚本
npx wrangler d1 execute temp_email_db --remote --file=d1-init-basic.sql
```

**部署命令**：
```bash
# 预检后部署（推荐）
npm run deploy:checked

# 直接部署（保留原有逻辑）
npm run deploy
```

## ❓ 常见问题（Troubleshooting）

**Error 1101（Worker threw exception）**：
- 检查 `server.js` 是否已显式 `import logger`
- 检查 `wrangler.toml` 的 `[[d1_databases]]` 是否为 `binding = "temp_email_db"` 且 `database_id` 已注入
- 确认已执行 `d1-init-basic.sql`
- 未配置 `RESEND_API_KEY` 的路由会返回 501（预期）而不是抛异常

**本地/线上环境差异**：
- 如使用 `${D1_DATABASE_ID}` 占位，需在 CI 或本地 shell 注入该变量

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进项目！

## 📄 许可证

本项目采用 Apache License 2.0 许可证 - 详见 [LICENSE](./LICENSE) 文件。

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## 🆘 支持

如遇到问题，请：

1. 查看 GitHub Issues
2. 查看文档目录中的相关文档
3. 提交新的 Issue 描述问题