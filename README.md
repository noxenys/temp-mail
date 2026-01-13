﻿# Temp Email - 临时邮箱服务

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/noxenys/temp-email)

## 📋 目录
- [项目概述](#-项目概述)
- [🌟 功能特性](#-功能特性)
- [📸 项目展示](#-项目展示)
- [🔄 版本与路线图](#-版本与路线图)
- [🔧 配置与部署](#-配置与部署)
- [📋 API 文档](#-api-文档)
- [🧪 测试与质量保证](#-测试与质量保证)
- [📊 监控与告警](#-监控与告警)
- [🔄 CI/CD 自动化](#-cicd-自动化)
- [🛠️ 故障排除](#️-故障排除)
- [贡献](#-贡献)
- [许可证](#-许可证)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进项目！

### 开发设置
1. 克隆仓库：
   ```bash
   git clone https://github.com/noxenys/temp-email.git
   cd temp-email
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 复制环境变量模板：
   ```bash
   cp .env.example .env
   # 根据需要编辑 .env 文件
   ```

4. 启动开发服务器：
   ```bash
   npm run dev
   ```

### 贡献步骤
1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 开发脚本
- `npm run dev` - 启动开发服务器
- `npm run build` - 构建项目
- `npm run deploy` - 部署到 Cloudflare Workers
- `npm test` - 运行测试
- `npm run lint` - 检查代码质量

## 📖 项目概述

这是一个基于 Cloudflare Workers 和 D1 数据库的临时邮箱服务，具有现代化界面和丰富的管理功能。

## 🌟 功能特性

### 🎨 现代化界面
- 🌈 **毛玻璃效果**：采用现代化的毛玻璃（Glassmorphism）设计风格
- 🎯 **简约美观**：浅色背景，动态渐变，视觉效果出色
- 📱 **响应式设计**：完美适配桌面和移动设备
- ✨ **动画效果**：平滑的过渡动画和微交互反馈

### 📧 邮箱管理
- 🎲 **智能生成**：随机生成临时邮箱地址，支持自定义长度和域名
- 📋 **历史记录**：自动保存历史生成的邮箱，方便重复使用
- 🗑️ **便捷删除**：支持删除单个邮箱和批量管理
- 🔄 **一键切换**：快速在不同邮箱间切换

### 🛠️ 用户管理功能
- **角色与权限**: 三层权限模型（严格管理员 Strict Admin / 高级用户 Admin / 普通用户 User），严格管理员拥有全部权限
- **用户列表**: 查看用户名、角色、邮箱上限/已用、是否允许发件、创建时间等关键信息
- **用户邮箱**: 查看指定用户名下的邮箱列表，支持一键复制邮箱地址
- **创建用户**: 通过用户名/密码/角色创建新用户
- **编辑用户**: 支持改名、重置密码、角色切换、发件权限开关、调整邮箱上限
- **分配邮箱**: 批量为用户分配邮箱地址（支持多行粘贴，自动格式校验）
- **删除用户**: 解除用户与邮箱的绑定关系（不会删除邮箱实体与邮件数据）
- **前端权限防护**: 管理页进入前进行快速鉴权，未授权自动跳转，避免内容闪现
- **操作确认与反馈**: 关键操作提供二次确认弹窗与统一 Toast 提示，操作状态与结果清晰可见

### 💌 邮件功能
- 📧 **实时接收**：自动接收和显示邮件，支持HTML和纯文本
- 🔄 **自动刷新**：选中邮箱后每8秒自动检查新邮件
- 🔍 **智能预览**：自动提取和高亮显示验证码内容
- 📖 **详细查看**：优化的邮件详情显示，支持完整内容渲染
- 📋 **一键复制**：智能识别验证码并优先复制，或复制完整邮件内容
- 🗑️ **灵活删除**：支持删除单个邮件或清空整个邮箱
- ✉️ **发件支持（Resend）**：已接入 Resend，可使用临时邮箱地址发送邮件并查看发件记录（发件箱），支持自定义发件显示名（`fromName`）与批量/定时/取消等能力。**V4.5新增**：支持多域名配置，智能选择API密钥。详情见《[Resend 密钥获取与配置教程](docs/resend.md)》

### 🔧 技术特性
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

更多展示详见：[展示文档](pic/)

#### 登陆
![登陆页面](pic/dlu.png)

#### 首页
![首页展示](pic/shouye.png)

![单个邮箱首页](./pic/v4/xiugaiquanju.png)
![单个邮箱首页](./pic/v4/liebiao.png)

### 全部邮箱预览
#### [更多展示点击查看](pic/)

### 单个邮箱页
![单个邮箱首页](./pic/v4/youxiang.png)

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

### 🔄 CI/CD 自动化
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

# Temp Email - 临时邮箱服务

基于 Cloudflare Workers 的临时邮箱服务，提供临时邮箱地址和邮件接收功能。

## 🌟 功能特性

- **即时邮箱创建**：无需注册，直接使用临时邮箱
- **邮件接收**：实时接收发送到临时邮箱的邮件
- **D1 数据库存储**：使用 Cloudflare D1 存储邮件数据
- **R2 存储**：使用 R2 存储完整 EML 邮件内容
- **API 接口**：提供 RESTful API 接口
- **自动部署**：支持 GitHub Actions 一键部署

## 🛠 技术栈

- **Cloudflare Workers**：边缘计算平台
- **Cloudflare D1**：SQL 数据库服务
- **Cloudflare R2**：对象存储服务
- **Wrangler**：Cloudflare 开发工具 (v4)
- **Node.js**：运行环境 (>=20.0.0)

## 🚀 快速开始

### 环境准备

1. **安装 Node.js** (>=20.0.0)
2. **安装 Wrangler CLI**:
   ```bash
   npm install -g wrangler
   ```
3. **登录 Cloudflare**:
   ```bash
   wrangler login
   ```

### 本地开发

1. **安装依赖**:
   ```bash
   npm install
   ```

2. **本地开发服务器**:
   ```bash
   npm run dev
   ```

### 数据库初始化

1. **创建并初始化 D1 数据库**:
   ```bash
   npm run d1:setup
   ```

2. **本地数据库操作**:
   ```bash
   # 本地执行 SQL
   npm run d1:execute:local
   
   # 远程执行 SQL
   npm run d1:execute:remote
   ```

## ⚙️ 部署配置

### GitHub Actions 一键部署

1. **配置 GitHub Secrets**:
   - `CLOUDFLARE_API_TOKEN` - Cloudflare API Token
   - `CLOUDFLARE_ACCOUNT_ID` - Cloudflare Account ID

2. **触发部署**:
   - 推送到 main 分支自动触发
   - 或手动运行 GitHub Actions 工作流

### 手动部署

```bash
# 使用部署脚本（推荐）
npm run deploy

# 直接部署
npm run deploy:direct
```

## 📁 项目结构

```
├── worker.js                 # Worker 主文件
├── wrangler.toml            # Wrangler 配置文件
├── d1-init.sql              # D1 数据库初始化脚本
├── d1-init-basic.sql        # D1 基础数据库初始化脚本
├── deploy-github-actions.js # GitHub Actions 部署脚本
├── deploy-with-env.js       # 环境部署脚本
├── build.js                 # 构建脚本
├── docs/                    # 文档目录
│   ├── api.md              # API 文档
│   ├── d1-row-reads-analysis.md # D1 行读取分析
│   └── ...
├── .github/
│   └── workflows/
│       └── ci.yml          # CI/CD 工作流
├── DATABASE_SETUP_GUIDE.md  # 数据库设置指南
├── DEPLOYMENT_GUIDE.md      # 部署指南
└── GITHUB_ACTIONS_SETUP.md  # GitHub Actions 设置指南
```

## 🗄️ 数据库结构

使用 D1 数据库存储以下信息：

- **mailboxes**：邮箱账户信息
- **emails**：邮件信息
- **sessions**：会话信息

## 🗂️ Wrangler 配置

项目使用 Wrangler v4 进行配置，关键配置如下：

- **D1 数据库绑定**：使用 `database_name` 而不是旧版本的 `name` 字段
- **绑定名称**：`temp_email_db`
- **数据库名称**：`temp_email_db`
- **数据库ID**：通过环境变量 `${D1_DATABASE_ID}` 配置

配置示例：
```toml
[[d1_databases]]
binding = "temp_email_db"
database_name = "temp_email_db"
database_id = "${D1_DATABASE_ID}"
```

## 🔐 环境变量

项目使用以下环境变量：

- `D1_DATABASE_ID`：D1 数据库 ID
- `JWT_TOKEN`：JWT认证令牌（或使用JWT_SECRET）
- `JWT_SECRET`：JWT密钥（JWT_TOKEN和JWT_SECRET二选一，推荐使用JWT_TOKEN）
- `MAIL_DOMAIN`：邮件域名配置
- `FORWARD_RULES`：邮件转发规则（JSON格式）
- `RESEND_API_KEY`：Resend API 密钥（用于发送邮件）
- `ADMIN_USERNAME`：管理后台用户名
- `ADMIN_PASSWORD`：管理后台密码
- `CACHE_TTL`：缓存TTL（秒）

## 🧪 测试

```bash
# 运行测试
npm test
# 或者
npm run test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式运行测试
npm run test:watch

# 构建项目
npm run build
```

## 🔍 代码质量

```bash
# 代码检查
npm run lint

# 自动修复代码问题
npm run lint:fix

# 类型检查
npm run type-check
```

## 🗄️ D1 数据库操作

```bash
# 初始化远程 D1 数据库
npm run d1:setup

# 在本地执行 SQL 查询
npm run d1:execute:local -- -f your-sql-file.sql

# 在远程执行 SQL 查询
npm run d1:execute:remote -- -f your-sql-file.sql

# 执行基础数据库初始化（本地）
npm run d1:execute-basic:local

# 执行基础数据库初始化（远程）
npm run d1:execute-basic:remote

# 直接查询本地数据库
npm run d1:query:local

# 直接查询远程数据库
npm run d1:query:remote
```

## 📄 API 接口

### 📬 邮箱相关
- `GET /api/health` - 健康检查
  - 返回: `{ "success": true, "version": "1.0.0", "timestamp": "2026-01-13T10:00:00Z" }`
- `POST /api/mailbox` - 创建邮箱
  - 参数: `{ address: "username@domain.com", password?: "optional password" }`
  - 返回: `{ "success": true, "address": "username@domain.com", "password": "generated password" }`
- `GET /api/emails?mailbox=email@domain.com` - 获取邮件列表
  - 返回: 邮件列表数组，包含发件人、主题、时间等信息
- `GET /api/email/:id` - 获取邮件详情
  - 返回: 完整的邮件内容，包括HTML和纯文本
- `DELETE /api/email/:id` - 删除单个邮件
  - 返回: `{ "success": true, "deleted": true, "message": "邮件已删除" }`
- `DELETE /api/emails?mailbox=email@domain.com` - 清空邮箱所有邮件
  - 返回: `{ "success": true, "deletedCount": 5, "previousCount": 5 }`

### 🔐 认证相关
- `POST /api/login` - 用户登录
  - 参数: `{ "username": "用户名", "password": "密码" }`
  - 返回: `{ success: true, role, can_send, mailbox_limit }` 并设置会话Cookie
- `POST /api/logout` - 用户退出
  - 返回: `{ "success": true }`

### 🌐 系统接口
- `GET /api/domains` - 获取可用域名列表
  - 返回: 域名数组

### 👥 用户管理（管理后台）
- `GET /api/users` - 获取用户列表
  - 返回: 用户数组（含 id/username/role/mailbox_limit/can_send/mailbox_count/created_at）
- `GET /api/users/{userId}/mailboxes` - 获取指定用户的邮箱列表
  - 返回: 邮箱数组（address/created_at）
- `POST /api/users` - 创建用户
  - 参数: `{ username, password, role }`（role: `user` | `admin`）
  - 返回: `{ success: true }`
- `PATCH /api/users/{userId}` - 更新用户
  - 参数示例: `{ username?, password?, mailboxLimit?, can_send?, role? }`
  - 返回: `{ success: true }`
- `DELETE /api/users/{userId}` - 删除用户
  - 返回: `{ success: true }`
- `POST /api/users/assign` - 给用户分配邮箱
  - 参数: `{ username, address }`
  - 返回: `{ success: true }`

## 🛡️ 安全特性

- **代码隔离**：Worker 逻辑已模块化，保持代码简洁
- **环境变量保护**：敏感信息通过 Secrets 管理
- **自动测试**：每次部署前运行完整测试套件
- **权限控制**：API 访问权限管理

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