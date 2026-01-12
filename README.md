# Temp-Email 临时邮箱服务（基于 Cloudflare Workers）

> 本项目基于 [idinging/freemail](https://github.com/idinging/freemail) 项目的代码进行修改和定制化开发


当前状态：V5.0 优化sql 大幅降低 行读取数，添加邮箱管理页面根据域名筛选以及登陆权限筛选

`
  注：如果需要支持邮箱用户自行修改密码 将mailbox.html中 77行到80行取消注释
`

一个基于 Cloudflare Workers 和 D1 数据库的临时邮箱服务，支持多域名、用户管理、邮件发送等高级功能。

## 一键部署

### [一键部署指南](docs/yijianbushu.md)

部署后需要在 Cloudflare Email Routing 中将 catch-all 绑定到该 Worker，才能接收邮件。

## 📸 项目展示
本节保留展示入口，待你制作后补充：
- 可在 `pic/` 目录添加你的展示图片，例如：`pic/exhibit-home.jpg`、`pic/exhibit-mobile.jpg`
- README 中以 `<img src="pic/..." />` 引用，或在 `docs/zhanshi.md` 维护更详细的展示文档
- 体验地址与账号可按需补充到本节

更多展示详见：[展示文档](docs/zhanshi.md)

### 体验地址： `https://mailexhibit.dinging.top/`

### 体验账号：

### 体验密码：

#### 登陆
![登陆页面](pic/dlu.png)

#### 首页
![首页展示](pic/shouye.png)

### 全部邮箱预览
![单个邮箱首页](./pic/v4/xiugaiquanju.png)
![单个邮箱首页](./pic/v4/liebiao.png)


#### [更多展示点击查看](docs/zhanshi.md)
### 手机端生成与历史
<div style="display: flex; gap: 20px; justify-content: center; margin: 20px 0;">
  <img src="./pic/phone/shouye.png" alt="手机端生成邮箱" style="height: 400px;" />
  <img src="./pic/phone/lishi.png" alt="手机端历史邮箱" style="height: 400px;" />
</div>

### 单个邮箱页
![单个邮箱首页](./pic/v4/youxiang.png)

## 功能特性

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
- ✉️ **发件支持（Resend）**：已接入 Resend，可使用临时邮箱地址发送邮件并查看发件记录（发件箱），支持自定义发件显示名（`fromName`）与批量/定时/取消等能力。**V4.5新增**：支持多域名配置，智能选择API密钥。
                                                              详情见《[Resend 密钥获取与配置教程](docs/resend.md)》

## 版本与路线图

### V1
- 前后端基础功能与认证体系
- 邮箱生成、历史记录、邮件列表与详情、清空/删除
- 智能验证码提取与复制、一键复制邮件内容
- 自动刷新与基本的 UI 交互

### V2
- [x] 前端模板解耦：将首页 UI 从 `public/app.js` 内联模板拆分为独立的 `public/templates/app.html`，降低耦合、便于维护
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

### V4 
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

## API 文档

### 根管理员令牌（Root Admin Override）

- 当请求携带与 `wrangler.toml` 配置项 `JWT_TOKEN` 相同的令牌时，将被视为最高管理员（strictAdmin）。
- 支持三种携带方式（任一即可）：
  - Authorization 头：`Authorization: Bearer <JWT_TOKEN>`
  - 自定义头：`X-Admin-Token: <JWT_TOKEN>`
  - URL 查询参数：`?admin_token=<JWT_TOKEN>`
- 适用范围：所有 `/api/*` 接口、`/api/session`、`/receive` 以及管理页访问判定。

完整接口说明已迁移至独立文档，包含登录认证、邮箱与邮件、发件（Resend）以及“用户管理”相关接口。

- 查看文档：[`docs/api.md`](docs/api.md)

详见《[V3 版本更新日志](docs/v3.md)》。


### 🔧 技术特性
- ⚡ **基于 Cloudflare**：利用全球网络，访问速度快
- 💾 **D1 数据库**：可靠的数据存储，支持数据持久化
- 🔐 **安全认证**：内置登录系统，保护数据安全
- 🎯 **API 完善**：提供完整的 RESTful API 接口
- 🚀 **缓存系统**：内存缓存系统（表结构、邮箱ID、用户配额、统计数据）
- 🛡️ **速率限制**：基于IP和API路径的请求频率控制
- 📊 **日志系统**：结构化日志记录系统（INFO、WARN、ERROR级别）
- 🧪 **测试框架**：完整的单元测试和集成测试套件（Vitest + ESLint）
- 📈 **监控告警**：Cloudflare Workers Analytics 监控和告警配置
- 🔄 **CI/CD**：GitHub Actions 自动化测试和部署流水线

## 🚀 部署指南

本项目为 Fork 用户提供了两种部署模式，旨在实现“一键部署”。

### 模式 A：自动部署（推荐）

此模式利用 Wrangler 的“自动资源配置”功能，在部署时自动创建所需的 D1 数据库和 R2 存储桶。

**前提条件**:

*   已安装 [Node.js](https://nodejs.org/) 和 [npm](https://www.npmjs.com/)
*   已安装 [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`npm install -g wrangler`)
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

3.  **登录 Cloudflare**

    ```bash
    wrangler login
    ```

4.  **配置环境变量**

    在 `wrangler.toml` 文件中，你可以按需修改 `[vars]` 部分的配置，或通过 `wrangler secret put` 命令设置敏感信息。

    **必填项**:

    *   `MAIL_DOMAIN`: 你的邮箱域名，多个域名用逗号分隔。
    *   `ADMIN_PASSWORD`: 管理员密码。
    *   `JWT_TOKEN`: 用于 API 认证的令牌。

    **设置示例**:

    ```bash
    # 设置邮箱域名
    wrangler secret put MAIL_DOMAIN "your-domain.com"

    # 设置管理员密码
    wrangler secret put ADMIN_PASSWORD
    # (然后输入你的密码)

    # 设置 JWT 令牌
    wrangler secret put JWT_TOKEN
    # (然后输入你的令牌)
    ```

5.  **部署到 Cloudflare**

    ```bash
    wrangler deploy
    ```

    部署过程中，Wrangler 会自动创建 `wrangler.toml` 中定义的 D1 数据库 (`temp_email_db`) 和 R2 存储桶 (`temp-mail-eml`)。

6.  **初始化数据库**

    首次部署后，需要执行以下命令来初始化数据库表结构：

    ```bash
    npm run d1:execute-basic:remote
    ```

7.  **配置邮件路由**

    为了接收邮件，你需要在 Cloudflare 控制台设置邮件路由：

    *   前往你的域名 > **Email** > **Email Routing**。
    *   在 **Routes** 选项卡下，点击 **Add catch-all**。
    *   在 **Action** 中选择 **Send to a Worker**。
    *   在 **Worker** 下拉菜单中，选择你刚刚部署的 Worker (`temp-email`)。
    *   点击 **Save**。

至此，你的临时邮箱服务已成功部署！

### 模式 B：手动创建资源

如果你希望自定义 D1 和 R2 的名称，或者禁用了自动创建功能 (`--no-provision`)，可以手动创建资源。

1.  **创建 D1 数据库**

    ```bash
    # 将 <YOUR_DB_NAME> 替换为你的数据库名称
    wrangler d1 create <YOUR_DB_NAME>
    ```

    执行后，将返回的 `database_id` 添加到 `wrangler.toml` 的 `[[d1_databases]]` 部分：

    ```toml
    [[d1_databases]]
    binding = "TEMP_MAIL_DB"
    database_name = "<YOUR_DB_NAME>"
    database_id = "<PASTE_YOUR_ID_HERE>"
    ```

2.  **创建 R2 存储桶**

    ```bash
    # 将 <YOUR_BUCKET_NAME> 替换为你的存储桶名称
    wrangler r2 bucket create <YOUR_BUCKET_NAME>
    ```

    然后，在 `wrangler.toml` 的 `[[r2_buckets]]` 部分更新 `bucket_name`：

    ```toml
    [[r2_buckets]]
    binding = "MAIL_EML"
    bucket_name = "<YOUR_BUCKET_NAME>"
    ```

3.  **继续部署**

    完成手动配置后，返回**模式 A** 的第 5 步继续部署。


## 🧪 测试与质量保证

项目已配置完整的测试框架，确保代码质量和功能稳定性。

### 运行测试

```bash
# 安装依赖
npm install

# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式运行测试（开发时使用）
npm run test:watch

# 代码检查
npm run lint

# 类型检查
npm run type-check
```

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

项目提供完善的监控配置，确保生产环境稳定运行。

### Cloudflare Workers Analytics

- **实时监控**：通过 Workers Analytics 实时监控请求量、错误率、响应时间
- **自定义指标**：支持自定义业务指标监控
- **日志集成**：结构化日志记录，支持日志搜索和分析

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

项目配置了 GitHub Actions CI/CD 流水线，实现自动化测试和部署：

### 流水线阶段

1. **代码检查**：ESLint 代码质量检查
2. **类型检查**：TypeScript 类型安全检查
3. **单元测试**：运行所有测试并生成覆盖率报告
4. **部署准备**：环境验证和配置检查
5. **生产部署**：自动部署到 Cloudflare Workers

### 环境配置

- **开发环境**：自动部署到开发环境
- **预发布环境**：手动触发部署到预发布环境
- **生产环境**：代码审查后手动部署到生产环境

Cloudflare 连接 GitHub 仓库部署
- 如果使用 Git 集成而非 wrangler deploy，请在 Dashboard → Workers → Settings → Variables 中手动配置上述变量
- `[assets]` 已指向 `public/`，静态页面由 Workers + Assets 提供
- 数据库名称为 `temp_email_db`，绑定名为 `TEMP_MAIL_DB`
- R2存储桶名称为 `temp-mail-eml`，绑定名为 `MAIL_EML`

### 方式三：GitHub Actions 部署（适配本项目）

适合希望自动同步更新且隐私隔离的用户。无需按钮授权，所有密钥保存在你自己的 Fork 仓库。

步骤：
- Fork 仓库到你的 GitHub 账户
- 在 Fork 仓库 Settings → Secrets and variables → Actions 添加以下 Secrets（至少前五项）：
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
  - `MAIL_DOMAIN`
  - `ADMIN_PASSWORD`
  - `JWT_TOKEN`
  - 可选：`ADMIN_NAME`、`GUEST_PASSWORD`、`RESEND_API_KEY` 或 `RESEND_TOKEN`、`FORWARD_RULES`
- 打开 Actions，选择“Manual Deploy (Workers)”并运行工作流
- 首次部署后，如需初始化数据库：运行 `npm run d1:execute-basic:remote`
- 在 Cloudflare Email Routing 中添加 catch‑all，并绑定到该 Worker

### 配置邮件路由（必需用于收取真实邮件）

如果需要接收真实邮件，需要在 Cloudflare 控制台配置邮件路由：

1. 进入域名的 Email Routing 设置
2. 添加 Catch-all 规则
3. 目标设置为 Worker: `temp-mail-worker`

### 设置自定义域名（可选）

在 Worker 设置中添加自定义域名，或使用 workers.dev 子域名。

## Bindings & 环境变量说明

| 变量名 | 说明 | 必需 |
|--------|------|------|
| TEMP_MAIL_DB | D1 数据库绑定 | 是 |
| MAIL_EML | R2 存储桶绑定，用于保存完整的邮件 EML 文件 | 是 |
| MAIL_DOMAIN | 用于生成临时邮箱的域名，支持多个，使用逗号或空格分隔（如 `iding.asia, example.com`） | 是 |
| ADMIN_PASSWORD | 后台访问密码（严格管理员登录） | 是 |
| GUEST_PASSWORD | 访客登录密码（可选，启用 guest 账号） | 否 |
| ADMIN_NAME | 严格管理员用户名（默认 `admin`） | 否 |
| JWT_TOKEN / JWT_SECRET | JWT 签名密钥（二选一，推荐 `JWT_TOKEN`） | 是 |
| ADMIN_PASS | 与 ADMIN_PASSWORD 等价的别名（可选） | 否 |
| RESEND_API_KEY / RESEND_TOKEN | Resend 发件配置。支持单密钥、多域名键值对、JSON格式 | 否 |
| FORWARD_RULES | 邮件转发（转发到指定邮箱）。支持两种格式：`JSON 数组` 或 `逗号分隔 KV` | 否 |

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

> 发件相关的域名验证与密钥创建步骤，请参考《[docs/resend.md](docs/resend.md)》；如果你不清楚如何配置，请直接按照教程一步步操作。
### FORWARD_RULES 示例
> 说明：规则按前缀匹配，命中第一个前缀即转发；`*` 为兜底规则。未配置或设置为空/disabled/none 时不进行任何转发。

- 逗号分隔（KV）：
  - `FORWARD_RULES="vip=a@example.com,news=b@example.com,*=fallback@example.com"`
- JSON 数组：
  - `FORWARD_RULES='[{"prefix":"vip","email":"a@example.com"},{"prefix":"*","email":"fallback@example.com"}]'`
- 仅指定某些前缀（无兜底）：
  - `FORWARD_RULES="code=a@example.com,login=b@example.com"`
- 禁用转发：
  - `FORWARD_RULES=""` 或 `FORWARD_RULES="disabled"` 或 `FORWARD_RULES="none"` 或 `FORWARD_RULES="[]"`
  转发的目标地址需要在 Cloudflare 的 Email Addresses 中添加/验证



## 注意事项
- **静态资源缓存**：Workers + Assets 对静态文件可能有缓存。更新 `index.html` 后如未生效，请在 Cloudflare 控制台进行 `Purge Everything`，并在浏览器执行强制刷新（Ctrl/Cmd+F5）。
- **图标路径**：favicon 建议使用相对路径（例如 `favicon.svg`），避免挂在子路径时 404。
- **邮件路由**：若需接收真实邮件，请正确配置 Cloudflare Email Routing（MX 记录、Catch‑all → 绑定到 Worker）。
- **R2 存储**：R2 用于保存完整的邮件 EML 文件，支持邮件下载功能。R2 有免费额度限制，建议定期清理过期邮件。
- **数据库与费用**：D1 有免费额度限制；建议定期清理过期邮件以节省存储空间与额度。
- **安全**：务必在生产环境修改 `ADMIN_PASSWORD`、`JWT_TOKEN`，并限制仓库/项目的敏感信息暴露。

## Resend 教程（发件）

- 教程文档：请见《[Resend 密钥获取与配置教程](docs/resend.md)》。
  - 覆盖域名验证、创建 API Key、在 Cloudflare Workers 设置 `RESEND_API_KEY` Secret 的完整流程
  - 详细列出后端发件相关接口（`/api/send`、`/api/send/batch`、`/api/send/:id`、`/api/send/:id/cancel`、`/api/sent` 等）与示例
  - 前端已集成“发件箱”，在生成/选择邮箱后可直接发信并查看记录；自定义发件显示名通过 `fromName` 字段传入

### 发件相关 API（摘要）
- `POST /api/send` 发送单封邮件（支持 `fromName` 自定义发件显示名）
- `POST /api/send/batch` 批量发送
- `GET /api/send/:id` 查询单封邮件发送状态
- `PATCH /api/send/:id` 更新（如定时 `scheduledAt`）
- `POST /api/send/:id/cancel` 取消发送
- `GET /api/sent?from=xxx@domain` 获取发件记录列表
- `GET /api/sent/:id` 获取发件详情
- `DELETE /api/sent/:id` 删除发件记录

### 多域名发送配置（V4.5新增）

发件API现已支持多域名配置，系统会根据发件人邮箱域名自动选择对应的API密钥：

**配置示例：**
```bash
# 键值对格式
RESEND_API_KEY="dinging.top=re_key1,iding.qzz.io=re_key2"

# JSON格式
RESEND_API_KEY='{"dinging.top":"re_key1","iding.qzz.io":"re_key2"}'
```

**发送示例：**
```javascript
// 发送时系统会自动根据from域名选择密钥
fetch('/api/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: 'noreply@dinging.top',  // 使用dinging.top对应的密钥
    to: 'user@example.com',
    subject: 'Test Email',
    html: '<p>Hello World!</p>'
  })
});
```
完整用法与注意事项请参考《[docs/resend.md](docs/resend.md)》。

## 自定义配置

可以通过修改 Worker 代码来自定义：

- 邮箱地址生成规则
- 邮件保存时间
- 界面样式（`public/` 内的 HTML/CSS/JS）
- 功能扩展

## 🛠️ 故障排除

### 常见问题
1. **邮件接收不到**
   - 检查 Cloudflare 邮件路由配置是否正确
   - 确认域名的 MX 记录设置
   - 验证 MAIL_DOMAIN 环境变量配置

2. **数据库连接错误**
   - 确认 D1 数据库绑定名称为 TEMP_MAIL_DB
   - **模式 A**：确认 wrangler 已自动创建 D1/R2 资源并回写配置到 wrangler.toml；必要时重新执行 `wrangler deploy`
   - **模式 B**：检查 database_id / bucket_name 是否已正确填入 wrangler.toml 配置
   - 运行 `wrangler d1 list` 确认数据库存在

3. **登录问题**
   - 确认 ADMIN_PASSWORD 环境变量已设置
   - 检查 JWT_TOKEN 或 JWT_SECRET 配置
   - 尝试清除浏览器缓存和 Cookie

4. **界面显示异常**
   - 确认静态资源路径配置正确
   - 检查浏览器控制台是否有 JavaScript 错误
   - 验证 CSS 文件加载是否正常

5. **自动刷新不工作**
   - 确认已选中邮箱地址
   - 检查浏览器是否支持 Page Visibility API
   - 查看网络连接是否稳定

### 调试技巧
- 使用 `wrangler dev` 进行本地调试
- 查看 Worker 的实时日志：`wrangler tail`
- 使用浏览器开发者工具检查网络请求
- 检查 D1 数据库中的数据：
  - 本地环境：`npm run d1:query:local -- --command "SELECT * FROM mailboxes LIMIT 10"`
  - 生产环境：`npm run d1:query:remote -- --command "SELECT * FROM mailboxes LIMIT 10"`

> 本地查询/初始化请使用 --local（或 :local 脚本）；远程查询/初始化请使用 --remote（或 :remote 脚本）。

## Buy me a coffee

如果你觉得本项目对你有帮助，欢迎赞赏支持：

<p align="left">
  <img src="pic/donate-alipay.jpg" alt="支付宝赞赏码" height="400" />
  <img src="pic/donate-wechat.jpg" alt="微信赞赏码" height="400" />
  <br/>
  <em>请将你的赞赏码图片保存为上述文件名并放置到 pic/ 目录。</em>
</p>


## 许可证

Apache-2.0 License
