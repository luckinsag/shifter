# ShiftManager — 开发计划

> **版本**：v1.0  
> **日期**：2026-06-28  
> **预计总工期**：10 个工作日  
> **关联文档**：[PRD_ShiftManager.md](./PRD_ShiftManager.md)

---

## 前置准备（开发前必须完成）

在正式写代码前，需要准备以下外部资源：

| 资源 | 操作 |
|------|------|
| Google OAuth App | 在 Google Cloud Console 创建 OAuth 2.0 凭据，获取 `CLIENT_ID` 和 `CLIENT_SECRET`，回调地址填 `http://localhost:8788/api/auth/callback` |
| Cloudflare 账号 | 注册 Cloudflare 账号，确保可以使用 Wrangler CLI |
| Wrangler 登录 | 本地运行 `npx wrangler login` 完成 CLI 认证 |
| D1 数据库 | 运行 `wrangler d1 create shifter-db` 记录返回的 `database_id` |

---

## Phase 1 — 工程基础（Day 1-2）

**目标**：搭建可运行的本地开发环境，完成认证流程。

### Day 1：项目脚手架 + 本地环境

#### 1.1 初始化 Vite + React 项目
```bash
npm create vite@latest . -- --template react
npm install
npm install react-router-dom
npm install i18next react-i18next i18next-browser-languagedetector
```

#### 1.2 配置 Wrangler
- 在项目根目录创建 `wrangler.toml`，填入 D1 绑定和环境变量占位
- 设置本地 Secrets（写入 `.dev.vars` 文件，不提交 git）：
  ```
  GOOGLE_CLIENT_ID=xxx
  GOOGLE_CLIENT_SECRET=xxx
  JWT_SECRET=随机字符串
  APP_URL=http://localhost:5173
  ```

#### 1.3 数据库初始化
创建 `migrations/0001_init.sql`，包含以下 8 张表（按依赖顺序）：

1. `profiles`
2. `staff_shift_presets`
3. `shift_tables`
4. `shift_table_members`
5. `invitations`
6. `shifts`
7. `shift_assignments`
8. `attendance_records`

本地初始化：
```bash
wrangler d1 execute shifter-db --local --file=migrations/0001_init.sql
```

#### 1.4 工程目录结构搭建
```
src/
  components/   # 公共组件
  pages/        # 页面组件
  hooks/        # 自定义 Hooks
  utils/        # 工具函数（含 api.js 请求封装）
  styles/       # 全局 CSS
functions/
  api/          # CF Pages Functions（API 路由）
migrations/
```

#### 1.5 全局 CSS 设计系统
在 `src/styles/globals.css` 中定义：
- CSS 变量（颜色、字体、间距、圆角、阴影）
- 深色背景 + 靛紫辐射光晕 + 网格纹理
- 玻璃卡片样式（`.glass-card`）
- 按钮、输入框、徽章基础样式
- 动画关键帧（fade-in、slide-up、scale-press）
- 引入 Google Fonts（Outfit + Inter）

#### 1.6 多语言（i18n）配置

支持 4 种语言，通过顶栏语言切换按钮手动切换，选择结果持久化到 `localStorage`。

**支持语言：**

| 语言 | locale key | 文件 |
|------|-----------|------|
| 日语 | `ja` | `src/locales/ja.json` |
| 简体中文 | `zh-CN` | `src/locales/zh-CN.json` |
| 繁体中文 | `zh-TW` | `src/locales/zh-TW.json` |
| 英语 | `en` | `src/locales/en.json` |

**初始化配置（`src/i18n.js`）：**
```js
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import ja from './locales/ja.json'
import zhCN from './locales/zh-CN.json'
import zhTW from './locales/zh-TW.json'
import en from './locales/en.json'

i18n
  .use(LanguageDetector)      // 自动检测浏览器语言
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',         // 兜底语言
    resources: {
      ja:    { translation: ja },
      'zh-CN': { translation: zhCN },
      'zh-TW': { translation: zhTW },
      en:    { translation: en },
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],  // 记住用户选择
    },
    interpolation: { escapeValue: false },
  })

export default i18n
```

**翻译文件结构（以 `en.json` 为例）：**
```json
{
  "nav": { "dashboard": "Dashboard", "admin": "Admin", "settings": "Settings", "logout": "Logout" },
  "auth": { "login": "Sign in with Google", "unauthorized": "You haven't been invited yet" },
  "shifts": { "createTable": "Create Shift Table", "shiftType": "Shift Type", "share": "Share", ... },
  "attendance": { "checkIn": "Check In", "checkOut": "Check Out", "note": "Note", ... },
  "presets": { "title": "Shift Presets", "setDefault": "Set as Default", ... },
  "common": { "save": "Save", "cancel": "Cancel", "delete": "Delete", "confirm": "Confirm" }
}
```

**语言切换组件（`src/components/LangSwitcher/`）：**
- 顶栏右侧放置下拉选择器，显示当前语言国旗/缩写
- 选项：`🇯🇵 日本語` / `🇨🇳 简体中文` / `🇹🇼 繁體中文` / `🇬🇧 English`
- 切换时调用 `i18n.changeLanguage(lang)`，自动持久化

> **注意**：翻译文件需在 Phase 1 就完成所有 key 的定义（即使翻译内容暂时只填英文），后续功能开发时直接用 `t('key')` 调用，避免后期补 key 遗漏。

---

### Day 2：Google OAuth 认证流程

#### 2.1 API - 发起 OAuth 跳转
文件：`functions/api/auth/google.js`
- 构建 Google OAuth URL（scope: `openid email profile`）
- 生成 `state` 随机值存入 Cookie（防 CSRF）
- 返回 302 重定向到 Google

#### 2.2 API - 处理 OAuth 回调
文件：`functions/api/auth/callback.js`
- 验证 `state` Cookie
- 用 `code` 换取 `access_token`（POST 到 `https://oauth2.googleapis.com/token`）
- 用 `access_token` 获取用户信息（`email`, `name`, `picture`, `sub`）
- 查询 D1 逻辑：
  - `profiles` 中有该 `sub` → 直接登录
  - `invitations` 中有匹配该 `email` 且未过期的记录 → 创建 profile，写入 `shift_table_members`，标记邀请已接受
  - 两者都无 → 重定向到 `/unauthorized`
  - `profiles` 表为空（首个用户）→ 创建 profile，设 `role=superadmin`
- 签发 JWT（`HS256`，payload 含 `sub`/`email`/`role`，有效期 7 天）
- 将 JWT 写入 `HttpOnly; Secure; SameSite=Lax` Cookie
- 重定向到 `/dashboard`

#### 2.3 API - 登出 + 当前用户信息
- `POST /api/auth/logout`：清除 Cookie，返回 200
- `GET /api/auth/me`：验证 JWT，返回当前用户 profile

#### 2.4 全局中间件
文件：`functions/_middleware.js`
- 所有 `/api/*` 请求验证 JWT Cookie
- `/api/auth/*` 路由豁免
- 将解析后的用户信息注入 `context.data.user`

#### 2.5 前端 - 认证相关页面
- 落地页（`/`）：产品介绍 + 「用 Google 账号登录」按钮
- 拒绝页（`/unauthorized`）：提示未被邀请
- `useAuth` Hook：调用 `/api/auth/me` 获取登录状态
- `<ProtectedRoute>` 组件：未登录自动跳转 `/`

---

## Phase 2 — 核心业务功能（Day 3-6）

**目标**：完成管理员和兼职的核心操作流程。

### Day 3：班次表管理

#### 3.1 API - 班次表 CRUD
- `GET /api/shift-tables`：返回当前用户参与的班次表
- `POST /api/shift-tables`：创建班次表，同时在 `shift_table_members` 插入 `role=admin` 记录
- `GET /api/shift-tables/[id]`：获取详情（含成员数、班次类型列表）
- `PATCH /api/shift-tables/[id]`：修改基本信息或 `is_shared` 共享开关
- `DELETE /api/shift-tables/[id]`：删除（仅 admin/superadmin 可操作）

#### 3.2 API - 班次类型 CRUD
- `GET /api/shift-tables/[id]/shifts`：获取该班次表的所有班次类型
- `POST /api/shift-tables/[id]/shifts`：创建班次类型
- `PATCH /api/shifts/[id]`：修改
- `DELETE /api/shifts/[id]`：删除

#### 3.3 前端 - 管理员：班次表列表页（`/admin/shifts`）
- 展示我管理的所有班次表卡片（名称、日期范围、成员数、共享状态 Toggle）
- 「+ 新建班次表」→ 侧滑弹窗表单
- 每张卡片可进入详情、删除

#### 3.4 前端 - 管理员：班次表详情页（`/admin/shifts/[id]`）
- 顶部：班次表信息 + 编辑 + 共享开关
- 左侧：班次类型列表（颜色标记 + 时间）+ 新增按钮
- 主区域：日历视图（见 Day 5）

---

### Day 4：邀请与员工管理

#### 4.1 API - 邀请管理
- `GET /api/invitations?shift_table_id=xxx`：获取邀请列表
- `POST /api/invitations`：创建邀请（body: `{ email, shift_table_id }`），默认 7 天过期
- `DELETE /api/invitations/[id]`：撤销邀请

#### 4.2 API - 员工管理
- `GET /api/staff?shift_table_id=xxx`：获取某班次表成员列表
- `PATCH /api/staff/[id]`：修改角色（`admin`/`staff`）
- `DELETE /api/staff/[id]`：从班次表移除成员

#### 4.3 前端 - 员工管理页（`/admin/staff`）
- 左侧班次表选择器
- 成员列表：头像 + 名称 + 角色徽章 + 提升/移除按钮
- 「邀请成员」按钮 → 弹窗输入邮箱
- 邀请记录列表：待接受/已接受/已过期 + 可撤销

---

### Day 5：日历组件 + 管理员排班分配

#### 5.1 日历组件开发（`src/components/Calendar/`）
- 月视图渲染（42 格，含上下月填充）
- 日期格子内显示条目（颜色条 + 文字，超出省略）
- 支持两种模式（通过 props 传入）：
  - **admin 模式**：点击格子弹分配弹窗
  - **staff 模式**：点击空格快速添加；点击条目弹详情

#### 5.2 API - 排班分配
- `GET /api/assignments?shift_table_id=xxx&month=2026-07`：获取排班列表
- `POST /api/assignments`：创建排班（`{ shift_id, user_id, date }`）
- `DELETE /api/assignments/[id]`：删除排班

#### 5.3 前端 - 管理员排班日历
嵌入 `/admin/shifts/[id]` 页面，使用 admin 模式日历：
- 格子内显示：兼职名 + 班次颜色
- 点击空白日期 → 「添加排班」弹窗（选兼职 + 选班次类型 + 确认日期）
- 点击已有条目 → 「删除排班」确认弹窗

---

### Day 6：兼职视图 + 预设卡片 + 快速打卡

#### 6.1 API - 班次预设 CRUD
- `GET /api/presets`：获取当前用户的所有预设
- `POST /api/presets`：创建预设
- `PATCH /api/presets/[id]`：修改（含设为默认，设默认时自动清除其他预设的 is_default）
- `DELETE /api/presets/[id]`：删除

#### 6.2 前端 - 个人设置页（`/settings`）
**预设卡片区块：**
- 预设卡片列表（名称、时间段、是否为默认）
- 「+ 新增预设」→ 表单：名称、日历显示名、开始/结束时间
- 每张卡片：设为默认、编辑、删除

**个人信息区块：**
- 显示 Google 头像 + 名称（只读）

#### 6.3 API - 出勤记录
- `GET /api/attendance?shift_table_id=xxx&month=2026-07&user_id=xxx`：获取记录
- `POST /api/attendance`：创建记录（传 `preset_id` 则自动填充时间，也可手动传时间）；自动计算 `actual_hours`
- `PATCH /api/attendance/[id]`：修改时间/备注/预设（仅 pending 状态）
- `DELETE /api/attendance/[id]`：删除（仅 pending 状态）

#### 6.4 前端 - 兼职仪表盘日历（`/dashboard/calendar`）
- 顶部：班次表选择器
- 统计概览：日历上方卡片，展示本月「出勤总天数」和「总时长」（调 API 获取）+ 「查看月度报告」按钮
- 使用 staff 模式日历：
  - 有出勤记录的日期：显示预设显示名 + 时间段
  - 共享开启时：其他人的记录显示为半透明灰色条目
- **快速添加**：点击空白日期 → 用默认预设立即创建记录（无默认预设则提示去设置）
- **详情弹窗**：点击已有条目 → 可编辑时间、切换预设、添加备注、删除记录

#### 6.5 API - 统计报表
- `GET /api/reports/monthly?shift_table_id=xxx&month=2026-07`：兼职获取自己的统计数据；管理员获取整个班次表所有兼职的统计数据及列表
- `GET /api/reports/monthly/export`：导出 CSV 数据（仅限管理员调用）

---

## Phase 3 — 出勤审核 + 完善（Day 7-8）

**目标**：管理员审核功能，错误处理，移动端适配。

### Day 7：管理员出勤审核

#### 7.1 API - 审核出勤
扩展 `PATCH /api/attendance/[id]`：支持 `status = approved | rejected`，写入 `approved_by` 和 `approved_at`
- 权限检查：仅班次表 `admin` 或 `superadmin` 可修改 `status`

#### 7.2 前端 - 管理员：出勤审核页（`/admin/attendance`）
- 左侧：班次表 + 月份筛选器
- 列表视图：人名、日期、时间、备注、当前状态
- 批量操作：全选 + 批量通过
- 单条操作：「通过」按钮、「驳回」按钮（含驳回原因输入）

#### 7.3 前端 - 管理员：团队月度报表页（`/admin/reports`）
- 顶部：班次表 + 月份筛选器 + 「导出 CSV」按钮
- 核心指标卡片：本月总出勤人次、总出勤时长
- 数据表格：按兼职人员汇总显示（人员名称、本月出勤天数、本月总工时、各状态出勤明细）

---

### Day 8：错误处理 + 移动端适配

#### 8.1 全局错误处理
- API 层统一错误格式：`{ error: string, code: string }`
- 前端全局 Toast 通知组件（成功/失败/警告）
- 网络请求 loading 状态
- 401 自动跳转登录页

#### 8.2 响应式布局适配
- `< 768px`（手机）：侧边栏改为底部 Tab 导航栏
- 日历格子高度自适应，条目文字省略
- 弹窗在手机端改为底部抽屉（bottom sheet 样式）
- 表单控件点击区域最小 44px

---

## Phase 4 — 部署上线（Day 9-10）

**目标**：云端数据库初始化，Cloudflare Pages 完整部署，端到端验证。

### Day 9：云端部署

#### 9.1 云端数据库初始化
```bash
# 初始化云端 D1
wrangler d1 execute shifter-db --file=migrations/0001_init.sql

# 验证表结构
wrangler d1 execute shifter-db --command "SELECT name FROM sqlite_master WHERE type='table'"
```

#### 9.2 配置生产环境 Secrets
```bash
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put JWT_SECRET
```

在 `wrangler.toml` 的 `[vars]` 中设置：
```toml
GOOGLE_CLIENT_ID = "你的 CLIENT_ID"
APP_URL = "https://shifter.pages.dev"   # 部署后替换为实际域名
```

#### 9.3 更新 Google OAuth 回调 URL
在 Google Cloud Console → OAuth 应用 → 授权重定向 URI，添加：
```
https://shifter.pages.dev/api/auth/callback
```

#### 9.4 部署到 Cloudflare Pages
```bash
npm run build
wrangler pages deploy dist --project-name=shifter
```

---

### Day 10：端到端验证

#### 验证流程 A：首个用户 → 超级管理员
1. 打开部署地址
2. 点击 Google 登录 → 完成授权
3. 确认跳转到 `/dashboard`，身份为 `superadmin`

#### 验证流程 B：管理员创建班次表 + 邀请兼职
1. 管理员登录 → 新建「7月前台排班」
2. 添加班次类型：早班（09:00-15:00）、晚班（15:00-21:00）
3. 员工管理 → 邀请测试邮箱
4. 用该邮箱 Google 账号登录 → 确认自动关联为兼职

#### 验证流程 C：兼职设置预设 + 快速打卡
1. 兼职登录 → 个人设置 → 新增预设「下午班（13:00-19:00）」并设为默认
2. 进入排班日历 → 点击空白日期 → 确认自动创建记录
3. 点击已创建的记录 → 修改备注保存

#### 验证流程 D：管理员审核出勤
1. 管理员登录 → 出勤审核 → 找到兼职记录 → 点击「通过」
2. 切回兼职账号 → 确认记录状态变为「已审核」

#### 验证流程 E：共享开关
1. 管理员开启共享 → 兼职确认能看到他人排班
2. 管理员关闭共享 → 兼职确认他人排班不可见

---

## 关键技术实现备注

### JWT 全局中间件模板
```js
// functions/_middleware.js
import { jwtVerify } from 'jose'

export async function onRequest({ request, env, next, data }) {
  const url = new URL(request.url)
  if (url.pathname.startsWith('/api/auth')) return next()

  const cookie = request.headers.get('Cookie') || ''
  const token = cookie.match(/token=([^;]+)/)?.[1]
  if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    data.user = payload
    return next()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 })
  }
}
```

### 前端 API 请求封装
```js
// src/utils/api.js
export async function apiFetch(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // 携带 Cookie
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (res.status === 401) { window.location.href = '/'; return }
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || '请求失败')
  }
  return res.status === 204 ? null : res.json()
}
```

---

## 文件交付清单

```
shifter/
├── migrations/
│   └── 0001_init.sql              ✅ 8张表的建表 SQL
├── functions/
│   ├── _middleware.js             ✅ JWT 全局验证
│   └── api/
│       ├── auth/google.js         ✅ 发起 OAuth
│       ├── auth/callback.js       ✅ 回调处理
│       ├── auth/logout.js         ✅ 登出
│       ├── auth/me.js             ✅ 当前用户
│       ├── invitations/index.js   ✅ 邀请 CRUD
│       ├── staff/index.js         ✅ 员工管理
│       ├── shift-tables/index.js  ✅ 班次表列表+创建
│       ├── shift-tables/[id].js   ✅ 班次表详情+修改
│       ├── assignments/index.js   ✅ 排班分配
│       ├── attendance/index.js    ✅ 出勤记录
│       ├── attendance/[id].js     ✅ 出勤审核
│       ├── presets/index.js       ✅ 班次预设
│       └── reports/monthly.js     ✅ 月度报表 API
├── src/
│   ├── i18n.js                    ✅ i18next 初始化配置
│   ├── locales/
│   │   ├── ja.json                ✅ 日语翻译
│   │   ├── zh-CN.json             ✅ 简体中文翻译
│   │   ├── zh-TW.json             ✅ 繁体中文翻译
│   │   └── en.json                ✅ 英语翻译
│   ├── styles/globals.css         ✅ 设计系统
│   ├── components/
│   │   ├── Calendar/              ✅ 日历组件（admin/staff 双模式）
│   │   ├── LangSwitcher/          ✅ 语言切换下拉组件
│   │   ├── Modal/                 ✅ 弹窗/底部抽屉
│   │   ├── Toast/                 ✅ 通知组件
│   │   └── Layout/                ✅ 侧边栏/顶栏/底栏
│   ├── pages/
│   │   ├── Landing.jsx            ✅ 落地页
│   │   ├── Unauthorized.jsx       ✅ 拒绝页
│   │   ├── Dashboard/             ✅ 兼职日历+历史
│   │   ├── Admin/                 ✅ 管理员页面组（含报表页）
│   │   └── Settings.jsx           ✅ 个人设置+预设管理
│   ├── hooks/useAuth.js           ✅ 认证状态 Hook
│   └── utils/api.js               ✅ 请求封装
├── wrangler.toml                  ✅ D1 绑定配置
└── .dev.vars                      🔒 本地 Secrets（不提交 git）
```
