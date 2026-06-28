# ShiftManager — 兼职排班管理系统 PRD

> **版本**：v1.0  
> **日期**：2026-06-28  
> **状态**：待确认

---

## 1. 产品概述

### 1.1 产品定位

ShiftManager 是一款面向小型团队（如餐厅、零售店、活动公司）的兼职排班与出勤管理 Web 应用。管理员负责创建班次表和分配排班；兼职人员通过谷歌账号登录查看和填写自己的出勤记录。

### 1.2 核心价值主张

- **零学习成本**：用谷歌账号直接登录，无需注册
- **随时随地**：响应式设计，手机和电脑均可使用
- **实时同步**：排班变化即时可见，减少沟通成本
- **轻量部署**：运行在 Cloudflare 全球边缘网络，无服务器费用压力

---

## 2. 用户角色与权限

| 角色 | 说明 | 权限 |
|------|------|------|
| **超级管理员** | 系统创始人（首个注册用户） | 管理所有用户、查看所有数据、删除任意班次表 |
| **管理员** | 登录后自行创建班次表即成为该表的管理员 | 管理自己创建的班次表、邀请兼职、审核出勤、将兼职提升为管理员、控制共享开关 |
| **兼职人员** | 被管理员邀请加入某班次表 | 查看排班（共享开关决定可见范围）、填写出勤、申请换班 |

### 2.1 角色分配逻辑

```
首个注册用户                    → 超级管理员
已登录用户创建一个班次表         → 自动成为该班次表的管理员
管理员邀请某谷歌邮箱加入班次表   → 该邮箱用户登录后自动以兼职身份加入
管理员将某兼职提升              → 该兼职成为该班次表的管理员
```

> [!IMPORTANT]
> **角色是班次表级别的，不是全局的。** 同一个用户可以在 A 班次表里是管理员，在 B 班次表里是兼职。

> [!NOTE]
> 邀请机制：管理员在系统内填写被邀请人的**谷歌邮箱**，系统生成一条邀请记录（含过期时间）。当该邮箱用户用谷歌账号登录时，系统自动匹配并完成角色关联。无需发送额外邮件（谷歌账号本身就是身份凭证）。

### 2.2 班次表共享开关

管理员可以对每个班次表单独开启或关闭「排班共享」：

| 共享状态 | 兼职可见范围 |
|----------|-------------|
| **开启** | 可查看该班次表内**所有人**的排班安排和备注 |
| **关闭** | 只能查看**自己**的排班安排，他人信息不可见 |

> [!NOTE]
> 共享开关是班次表级别的设置，管理员可随时切换，切换立即生效。管理员本身不受此限制，始终可查看所有人的排班。

---

## 3. 技术选型

| 层级 | 技术 | 选型原因 |
|------|------|----------|
| **前端框架** | Vite + React 18 | 生态成熟，构建速度快，组件化开发 |
| **样式** | Vanilla CSS + CSS Variables | 无框架依赖，完全自定义深色玻璃态风格 |
| **路由** | React Router v6 | SPA 路由管理 |
| **部署平台** | Cloudflare Pages | 免费静态托管 + Functions 支持 |
| **API 层** | Cloudflare Workers (Pages Functions) | 边缘计算，与 Pages 无缝集成 |
| **数据库** | Cloudflare D1 (SQLite) | 原生集成，Wrangler 管理，免费额度充足 |
| **认证** | 自建 Google OAuth 2.0（通过 CF Worker） | 完全在 CF 生态内，无第三方 Auth 服务依赖 |
| **工具链** | Wrangler CLI | D1 迁移、本地开发、部署一体化 |
| **字体** | Google Fonts — Outfit + Inter | 标题/正文分离，现代感强 |

### 3.1 架构图

```
┌─────────────────────────────────────────────────────┐
│                   Cloudflare 边缘                    │
│                                                     │
│  ┌──────────────────┐    ┌───────────────────────┐  │
│  │  Cloudflare Pages │    │  Pages Functions       │  │
│  │  (Vite + React   │───▶│  (API Routes /api/*)  │  │
│  │   静态资源)       │    │  = CF Workers         │  │
│  └──────────────────┘    └──────────┬────────────┘  │
│                                     │               │
│                          ┌──────────▼────────────┐  │
│                          │  Cloudflare D1         │  │
│                          │  (SQLite 数据库)       │  │
│                          └───────────────────────┘  │
└─────────────────────────────────────────────────────┘
          │
          ▼ OAuth 回调
   Google OAuth 2.0
   (accounts.google.com)
```

### 3.2 认证流程（Google OAuth）

```
1. 用户点击「用谷歌账号登录」
2. 前端跳转到 CF Worker 的 /api/auth/google
3. Worker 重定向到 Google 授权页
4. Google 回调 /api/auth/callback?code=xxx
5. Worker 用 code 换取 access_token → 获取用户信息（email, name, picture）
6. Worker 查询 D1：
   a. 该邮箱是否已有 profile → 是则登录
   b. 是否有待接受的邀请 → 是则创建 profile 并关联角色
   c. 两者都没有 → 拒绝访问（显示「您尚未被邀请」）
7. Worker 签发 JWT（HS256, 存入 HttpOnly Cookie）
8. 前端检测 Cookie → 进入对应仪表盘
```

---

## 4. MVP 功能范围（Phase 1）

> [!NOTE]
> 根据确认，Phase 1 聚焦最小可用版本，以下功能为必须实现的核心功能。

### 4.1 认证模块 ✅ 必须

| 功能点 | 描述 |
|--------|------|
| Google 一键登录 | OAuth 2.0 PKCE 流程 |
| 自动角色分配 | 登录时匹配邀请记录 |
| 登出 | 清除 JWT Cookie |
| 未授权拦截 | 无邀请的邮箱显示拒绝页 |

### 4.2 邀请管理（管理员）✅ 必须

| 功能点 | 描述 |
|--------|------|
| 邀请兼职 | 输入谷歌邮箱，生成待接受邀请 |
| 邀请列表 | 显示已邀请/已接受/已过期状态 |
| 撤销邀请 | 删除待接受邀请 |
| 移除成员 | 从班次表中移除已加入的兼职 |
| **提升为管理员** | 将班次表内的兼职提升为该表的管理员 |

### 4.3 班次表管理（管理员）✅ 必须

| 功能点 | 描述 |
|--------|------|
| 创建班次表 | 填写名称、日期范围、描述，创建人自动成为管理员 |
| 班次定义 | 在班次表内定义班次类型（如早班 08:00-14:00），支持颜色标记 |
| 排班分配 | 日历视图中，点击分配任意成员（包括自己）到某天某班次 |
| **管理员自排班** | 管理员同样是班次表成员，可为自己创建排班、设置预设并填写出勤 |
| 编辑/删除班次表 | CRUD 操作 |
| **共享开关** | 开启后兼职可互相查看排班和备注；关闭后每人只能看自己的排班 |

### 4.4 兼职班次预设（个人信息卡片）✅ 必须

兼职可以在个人设置中创建多个**班次预设**，用于快速填写常用出勤时段。

| 功能点 | 描述 |
|--------|------|
| 创建预设卡片 | 设置卡片名称（如「下午班」）、补上班时间、下班时间 |
| 多个预设 | 支持创建多个预设（如 「短班 14:00-17:00」「全天 13:00-19:00」） |
| 设为默认 | 指定一个预设为默认，快速添加时自动使用 |
| 设置日历显示名 | 设置自己在日历上的显示名称（如简称、昵称） |
| 编辑 / 删除预设 | CRUD 操作 |

> [!NOTE]
> 预设卡片是**个人级别**的设置，只属于当前用户自己，管理员不可查看或编辑。

---

### 4.5 排班查看与出勤快速打卡（兼职）✅ 必须

#### 日历视图交互流程

```
【快速添加】
兼职点击日历上空白日期
  └→ 系统自动使用「默认预设」创建出勤记录
  └→ 日历上展示预设名称 + 时间段

【修改详情】
兼职点击日历上已添加的条目
  └→ 弹出详情面板，可手动修改实际上班/下班时间、添加备注
  └→ 也可切换为其他预设
  └→ 可删除该天的出勤记录
```

| 功能点 | 描述 |
|--------|------|
| 个人排班日历 | 月视图，显示本人所有出勤记录（预设名 + 时间） |
| 快速添加 | 点击空白日期 → 自动应用默认预设创建记录 |
| 查看 / 修改详情 | 点击已添加的日期条目 → 弹面修改实际时间和备注 |
| 切换预设 | 展开详情面板时可替换当天使用的预设 | 
| 删除记录 | 删除当天的出勤记录 |
| 历史记录 | 查看过去所有出勤记录和审核状态 |
| 个人月度统计 | 在日历上方或侧边栏，直观展示本月「出勤总天数」和「总时长」 |
| 个人月度报告 | 支持一键生成并查看自己本月的出勤总报告详情 |
| 共享可见时查看他人 | 班次表开启共享时，日历上可看到其他兼职的排班和备注 |

---

### 4.6 站内通知✅ 必须

管理员对班次表进行排班变更时，自动向受影响的兼职写入通知记录。兼职登录后可在顶栏看到未读数量。

| 触发时机 | 通知内容 | 接收人 |
|----------|----------|------|
| 管理员添加某人的排班 | 「你在 {date} 被安排了 {shift_name}」 | 被排班人 |
| 管理员删除某人的排班 | 「你在 {date} 的 {shift_name} 排班被取消」 | 被删除排班人 |

| 功能点 | 描述 |
|--------|------|
| 顶栏铃铛图标 | 显示未读通知数量（小红点） |
| 通知列表面板 | 点击铃铛展开，显示近期通知列表（时间、内容、已读/未读状态） |
| 自动标读 | 点击展开通知面板时，所有展示的通知自动标读 |
| 跳转 | 点击通知条目可跳转到对应日历日期 |

> [!NOTE]
> 通知全部存在 D1 `notifications` 表中，无需外部推送服务。兼职登录后拉取，不支持实时推送（MVP 阶段）。

### 4.7 月度统计报表✅ 必须

兼职和管理员都可以查看按月汇总的出勤数据报告。

| 功能点 | 描述 | 权限 |
|--------|------|------|
| 个人月度报告 | 兼职可查看自己按月的总出勤天数、总工时及明细列表 | 兼职、管理员 |
| 团队月度报表 | 管理员可查看当前班次表下**所有兼职**当月的出勤天数和工时汇总 | 管理员 |
| 报表导出 | 管理员可将团队月度出勤报表导出为 CSV 文件 | 管理员 |

---

## 5. 后续阶段功能（Phase 2+，暂不在 MVP 内）

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 出勤审核（管理员） | 高 | 管理员审核通过/驳回出勤记录 |
| 换班申请 | 中 | 兼职发起换班，管理员审批 |
| 通知推送升级 | 中 | 用 Cloudflare Email Workers 发送邮件操作（补充站内通知） |
| 多组织支持 | 低 | 预留数据结构，后续再启用 |
| PWA 离线支持 | 低 | 手机端安装为 App |

---

## 6. 数据库设计（Cloudflare D1 / SQLite）

```sql
-- 用户档案
 CREATE TABLE profiles (
  id          TEXT PRIMARY KEY,          -- Google sub (唯一 ID)
  email       TEXT UNIQUE NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'user', -- '全局角色': 'superadmin' | 'user'
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 邀请记录
CREATE TABLE invitations (
  id              TEXT PRIMARY KEY,          -- UUID
  email           TEXT NOT NULL,             -- 被邀请人谷歌邮箱
  shift_table_id  TEXT NOT NULL REFERENCES shift_tables(id) ON DELETE CASCADE,
  invited_by      TEXT NOT NULL REFERENCES profiles(id),
  expires_at      DATETIME NOT NULL,
  accepted_at     DATETIME,                  -- NULL = 尚未接受
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 班次表
 CREATE TABLE shift_tables (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT,
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  created_by   TEXT NOT NULL REFERENCES profiles(id),
  is_shared    INTEGER NOT NULL DEFAULT 0,   -- 0 = 关闭, 1 = 开启共享
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 班次表成员关联（班次表级别的角色）
CREATE TABLE shift_table_members (
  id             TEXT PRIMARY KEY,
  shift_table_id TEXT NOT NULL REFERENCES shift_tables(id) ON DELETE CASCADE,
  user_id        TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role           TEXT NOT NULL DEFAULT 'staff', -- '班次表级角色': 'admin' | 'staff'
  joined_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (shift_table_id, user_id)
);

-- 班次类型定义（属于某个班次表）
CREATE TABLE shifts (
  id             TEXT PRIMARY KEY,
  shift_table_id TEXT NOT NULL REFERENCES shift_tables(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,           -- 如 "早班"
  start_time     TIME NOT NULL,           -- 如 "08:00"
  end_time       TIME NOT NULL,           -- 如 "14:00"
  color          TEXT DEFAULT '#6366f1',  -- 日历标记颜色
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 兼职个人班次预设（个人信息卡片）
CREATE TABLE staff_shift_presets (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,           -- 预设名称，如 "下午班"
  display_name   TEXT,                   -- 日历上的显示名（如昵称）
  start_time     TIME NOT NULL,           -- 如 "13:00"
  end_time       TIME NOT NULL,           -- 如 "19:00"
  is_default     INTEGER NOT NULL DEFAULT 0, -- 1 = 默认预设
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 排班分配（某人某天被分配到某班次）
CREATE TABLE shift_assignments (
  id       TEXT PRIMARY KEY,
  shift_id TEXT NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  user_id  TEXT NOT NULL REFERENCES profiles(id),
  date     DATE NOT NULL,
  status   TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled' | 'completed' | 'absent'
  note     TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (shift_id, user_id, date)
);

-- 出勤记录（兼职自助创建，支持预设快速添加）
CREATE TABLE attendance_records (
  id              TEXT PRIMARY KEY,
  shift_table_id  TEXT NOT NULL REFERENCES shift_tables(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL REFERENCES profiles(id),
  date            DATE NOT NULL,          -- 出勤日期
  preset_id       TEXT REFERENCES staff_shift_presets(id), -- 使用的预设（可为空表示手动输入）
  check_in_time   TIME NOT NULL,          -- 实际上班时间
  check_out_time  TIME NOT NULL,          -- 实际下班时间
  actual_hours    REAL,                   -- 自动计算（check_out - check_in）
  note            TEXT,                   -- 备注（迟到/早退原因等）
  submitted_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  status          TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  approved_by     TEXT REFERENCES profiles(id),
  approved_at     DATETIME,
  UNIQUE (shift_table_id, user_id, date)  -- 每人每天每班次表仅一条记录
);

-- 站内通知
CREATE TABLE notifications (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,  -- 接收人
  type           TEXT NOT NULL,           -- 'shift_added' | 'shift_removed'
  shift_table_id TEXT REFERENCES shift_tables(id) ON DELETE CASCADE,
  date           DATE,                    -- 排班日期（用于跳转）
  content        TEXT NOT NULL,           -- 通知文案（已根据用户语言生成存储）
  is_read        INTEGER NOT NULL DEFAULT 0,  -- 0 = 未读, 1 = 已读
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 6.1 多组织扩展预留

> [!NOTE]
> MVP 阶段为单组织模式（所有数据共享同一个 D1 数据库，不区分组织）。  
> 将来扩展多组织时，只需在所有主要表中添加 `organization_id` 字段并加 RLS 级别的过滤。

---

## 7. API 设计（Cloudflare Pages Functions）

所有 API 路由位于 `/functions/api/` 目录，对应 URL `/api/*`。

### 7.1 认证 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/auth/google` | 发起 Google OAuth，重定向到 Google |
| GET | `/api/auth/callback` | 处理 OAuth 回调，签发 JWT Cookie |
| POST | `/api/auth/logout` | 清除 Cookie |
| GET | `/api/auth/me` | 获取当前登录用户信息 |

### 7.2 邀请 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/invitations` | 获取所有邀请记录（管理员） |
| POST | `/api/invitations` | 创建邀请 |
| DELETE | `/api/invitations/:id` | 撤销邀请 |

### 7.3 员工 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/staff` | 获取所有员工列表（管理员） |
| DELETE | `/api/staff/:id` | 移除员工 |
| PATCH | `/api/staff/:id` | 修改角色 |

### 7.4 班次表 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/shift-tables` | 获取所有班次表 |
| POST | `/api/shift-tables` | 创建班次表 |
| GET | `/api/shift-tables/:id` | 获取单个班次表详情 |
| PATCH | `/api/shift-tables/:id` | 修改班次表 |
| DELETE | `/api/shift-tables/:id` | 删除班次表 |

### 7.5 班次类型 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/shift-tables/:id/shifts` | 获取班次表内的班次类型 |
| POST | `/api/shift-tables/:id/shifts` | 新建班次类型 |
| PATCH | `/api/shifts/:id` | 修改班次类型 |
| DELETE | `/api/shifts/:id` | 删除班次类型 |

### 7.6 排班分配 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/assignments` | 获取排班列表（支持按月/按用户过滤） |
| POST | `/api/assignments` | 创建排班 |
| DELETE | `/api/assignments/:id` | 删除排班 |

### 7.7 出勤记录 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/attendance` | 获取出勤记录（支持按用户/月份/班次表过滤） |
| POST | `/api/attendance` | 创建出勤记录（支持传入 preset_id 快速填充） |
| PATCH | `/api/attendance/:id` | 修改出勤记录（仅 pending 状态可改） |
| DELETE | `/api/attendance/:id` | 删除出勤记录（仅 pending 状态可删） |

### 7.8 班次预设 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/presets` | 获取当前用户的所有预设 |
| POST | `/api/presets` | 创建新预设 |
| PATCH | `/api/presets/:id` | 修改预设（含设为默认） |
| DELETE | `/api/presets/:id` | 删除预设 |

### 7.9 通知 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/notifications` | 获取当前用户的通知列表 |
| PATCH | `/api/notifications/read-all` | 把当前用户所有通知标读 |
| GET | `/api/notifications/unread-count` | 获取未读数量（用于顶栏浮标） |

### 7.10 统计报表 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/reports/monthly` | 获取本月统计报告。支持 `?shift_table_id=xx&month=2026-07`。<br>兼职仅能获取自己的统计；管理员能获取全员统计列表及汇总数据。 |
| GET | `/api/reports/monthly/export` | 导出当前班次表的月度统计数据（CSV 格式，仅管理员可用） |

---

## 8. 页面结构

```
/                          → 落地页（产品介绍 + Google 登录入口）
/auth/callback             → OAuth 回调（无 UI，处理完跳转）
/unauthorized              → 拒绝页（未被邀请的账号）

/dashboard                 → 兼职仪表盘（默认跳转）
  /dashboard/calendar      → 个人排班日历（月视图）
  /dashboard/attendance    → 出勤记录填写与查看

/admin                     → 管理员控制台
  /admin/shifts            → 班次表列表 + 创建
  /admin/shifts/:id        → 班次表详情 + 排班日历（可分配）
  /admin/staff             → 员工管理（列表 + 邀请 + 移除）
  /admin/attendance        → 出勤记录审核（Phase 2）
  /admin/reports           → 统计报表（Phase 2）

/settings                  → 个人设置（头像、显示名称）
```

---

## 9. UI 设计规范

### 9.1 设计风格

- **主题**：深色玻璃态（Dark Glassmorphism）
- **背景**：深色（`#0a0a0f`）+ 靛紫色辐射光晕 + 细网格纹理
- **卡片**：半透明背景（`rgba(255,255,255,0.05)`）+ `backdrop-filter: blur(20px)` + 细边框（`rgba(255,255,255,0.1)`）
- **主色调**：靛蓝 `#6366f1` → 紫色 `#8b5cf6`（渐变）
- **辅助色**：成功绿 `#10b981`、警告橙 `#f59e0b`、危险红 `#ef4444`

### 9.2 排版

| 角色 | 字体 | 大小 |
|------|------|------|
| 大标题 | Outfit 700 | 32-48px |
| 小标题 | Outfit 600 | 18-24px |
| 正文 | Inter 400 | 14-16px |
| 标签/提示 | Inter 500 | 12-13px |

### 9.3 动画规范

| 场景 | 动画 |
|------|------|
| 页面切换 | `fade + slide up`，150ms ease-out |
| 卡片悬停 | `translateY(-4px) + box-shadow 增强`，200ms |
| 按钮点击 | `scale(0.97)`，100ms |
| 数字变化 | 滚动计数动画 |
| 日历格子 | hover 时高亮背景 |

### 9.4 响应式断点

| 断点 | 宽度 | 布局 |
|------|------|------|
| Mobile | < 768px | 单列，底部导航栏 |
| Tablet | 768px - 1024px | 侧边栏折叠 |
| Desktop | > 1024px | 固定侧边栏 + 主内容区 |

### 9.5 多语言支持

| 语言 | locale key | 备注 |
|------|-----------|------|
| 日语 | `ja` | 主要目标用户语言 |
| 简体中文 | `zh-CN` | — |
| 繁体中文 | `zh-TW` | — |
| 英语 | `en` | 系统兜底语言（fallback） |

- **切换入口**：顶栏右侧固定显示语言切换下拉（国旗 + 语言名）
- **记忆机制**：用户选择持久化到 `localStorage`，下次访问自动恢复
- **自动检测**：首次访问时根据浏览器语言自动选择最近匹配语言
- **技术实现**：`i18next` + `react-i18next` + `i18next-browser-languagedetector`

---

## 10. 工程结构

```
shifter/
├── public/                      # 静态资源
├── src/
│   ├── components/              # 可复用 React 组件
│   │   ├── Calendar/            # 日历组件
│   │   ├── ShiftCard/           # 班次卡片
│   │   ├── Modal/               # 弹窗
│   │   └── Layout/              # 布局（侧边栏、顶栏）
│   ├── pages/                   # 页面级组件
│   │   ├── Landing.jsx
│   │   ├── Dashboard/
│   │   └── Admin/
│   ├── hooks/                   # 自定义 React Hooks
│   │   ├── useAuth.js
│   │   └── useApi.js
│   ├── utils/                   # 工具函数（日期处理等）
│   ├── styles/                  # 全局 CSS
│   │   ├── globals.css          # CSS 变量 + Reset
│   │   ├── components.css       # 通用组件样式
│   │   └── animations.css       # 动画定义
│   └── main.jsx
├── functions/                   # Cloudflare Pages Functions (API)
│   └── api/
│       ├── auth/
│       │   ├── google.js        # 发起 OAuth
│       │   └── callback.js      # OAuth 回调
│       ├── invitations/
│       ├── shift-tables/
│       ├── assignments/
│       └── attendance/
├── migrations/                  # D1 数据库迁移文件
│   └── 0001_init.sql
├── wrangler.toml                # Wrangler 配置（D1 绑定等）
├── vite.config.js
└── package.json
```

---

## 11. 环境配置（wrangler.toml）

```toml
name = "shifter"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "shifter-db"
database_id = "YOUR_D1_DATABASE_ID"

[vars]
GOOGLE_CLIENT_ID = ""      # 通过 wrangler secret put 设置
JWT_SECRET = ""            # 通过 wrangler secret put 设置
APP_URL = "http://localhost:5173"

[dev]
port = 8788
```

**Secrets（不进版本控制，用 `wrangler secret put` 设置）**：
- `GOOGLE_CLIENT_SECRET`
- `JWT_SECRET`

---

## 12. 开发阶段计划

### Phase 1 — 基础框架（Day 1-2）
- [ ] 初始化 Vite + React 项目
- [ ] 配置 Wrangler + D1 数据库
- [ ] 创建数据库迁移文件（0001_init.sql）
- [ ] 设计全局 CSS 设计系统（变量、组件、动画）
- [ ] 落地页 + 布局组件
- [ ] Google OAuth 认证流程（CF Worker）

### Phase 2 — 核心功能（Day 3-5）
- [ ] 邀请流程（管理员邀请 → 用户登录自动关联）
- [ ] 管理员：班次表 CRUD
- [ ] 管理员：排班日历视图（日历组件 + 分配操作）
- [ ] 兼职：个人排班日历
- [ ] 兼职：出勤记录填写

### Phase 3 — 审核与完善（Day 6-8）
- [ ] 管理员：出勤记录审核
- [ ] 员工管理页面
- [ ] 响应式移动端适配
- [ ] 错误处理与加载状态

### Phase 4 — 部署（Day 9-10）
- [ ] `wrangler d1 execute` 初始化云端数据库
- [ ] `wrangler pages deploy` 部署到 Cloudflare Pages
- [ ] 配置 Google OAuth 回调 URL（生产域名）
- [ ] 端到端功能验证

---

## 13. 验证计划

### 本地开发验证
```bash
# 启动本地开发（Vite + CF Workers 本地模拟）
npx wrangler pages dev --d1=DB npm run dev

# 数据库操作
wrangler d1 execute shifter-db --local --file=migrations/0001_init.sql
```

### 功能验证清单
1. 超级管理员用谷歌账号登录（首个用户）
2. 邀请兼职邮箱 → 兼职用同邮箱谷歌账号登录 → 自动关联角色
3. 管理员创建班次表 + 班次类型
4. 管理员在日历中分配排班
5. 兼职查看个人排班日历
6. 兼职填写出勤记录

### 部署验证
- Cloudflare Pages 构建成功
- D1 数据库云端初始化正常
- Google OAuth 回调 URL 配置正确
- HTTPS 正常（CF 自动处理）

---

## 14. 开放问题 / 待确认

| # | 问题 | 当前假设 |
|---|------|----------|
| 1 | Google OAuth Client ID/Secret 由谁提供？ | 开发者自行在 Google Cloud Console 创建 |
| 2 | 生产域名是否已有？还是使用 CF 默认域名？ | 使用 `*.pages.dev` 默认域名 |
| 3 | 排班分配是否需要支持一次分配多人到同一班次？ | 假设支持，每人独立一条 assignment |
| 4 | 出勤记录是否有截止时间（如当天结束前必须填写）？ | 暂无限制，随时可填 |
| 5 | 日历组件是否需要拖拽排班功能？ | MVP 阶段用点击+弹窗分配，不做拖拽 |
