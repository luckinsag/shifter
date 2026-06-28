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

-- 兼职个人的常用班次预设
CREATE TABLE staff_shift_presets (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  preset_name    TEXT NOT NULL,          -- 如 "全天班"
  display_name   TEXT,                   -- 日历上的显示名（如昵称）
  start_time     TIME NOT NULL,           -- 如 "13:00"
  end_time       TIME NOT NULL,           -- 如 "19:00"
  is_default     INTEGER NOT NULL DEFAULT 0, -- 1 = 默认预设
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 班次表
CREATE TABLE shift_tables (
  id          TEXT PRIMARY KEY,          -- UUID
  name        TEXT NOT NULL,             -- 如 "2026年7月 前台排班"
  description TEXT,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  is_shared   INTEGER NOT NULL DEFAULT 0, -- 0 = 关闭共享, 1 = 开启共享（默认 0）
  created_by  TEXT NOT NULL REFERENCES profiles(id),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 班次表成员关联表（多对多 & 班次表级别角色）
CREATE TABLE shift_table_members (
  shift_table_id TEXT NOT NULL REFERENCES shift_tables(id) ON DELETE CASCADE,
  user_id        TEXT NOT NULL REFERENCES profiles(id),
  role           TEXT NOT NULL DEFAULT 'staff', -- 'admin' | 'staff'
  joined_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (shift_table_id, user_id)
);

-- 邀请记录
CREATE TABLE invitations (
  id              TEXT PRIMARY KEY,          -- UUID
  email           TEXT NOT NULL,             -- 被邀请人谷歌邮箱
  shift_table_id  TEXT NOT NULL REFERENCES shift_tables(id) ON DELETE CASCADE,
  invited_by      TEXT NOT NULL REFERENCES profiles(id),
  expires_at      DATETIME NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'expired'
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (email, shift_table_id, status)
);

-- 班次类型定义（如“早班 08:00-14:00”）
CREATE TABLE shifts (
  id             TEXT PRIMARY KEY,
  shift_table_id TEXT NOT NULL REFERENCES shift_tables(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  start_time     TIME NOT NULL,
  end_time       TIME NOT NULL,
  color          TEXT DEFAULT '#6366f1',  -- 颜色标记
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
  content        TEXT NOT NULL,           -- 通知文案
  is_read        INTEGER NOT NULL DEFAULT 0,  -- 0 = 未读, 1 = 已读
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);
