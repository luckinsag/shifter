# ShiftManager SEO 计划

> 版本：v1.0 ・ 日期：2026-06-28
> 适用产品：ShiftManager（兼职排班管理 SaaS，Vite + React SPA / Cloudflare Pages）
> 主目标市场：日本（`ja`）｜次要：简中 `zh-CN`、繁中 `zh-TW`、英语 `en`

---

## 0. 一句话策略

> 产品本体是登录墙后的 SPA，搜索引擎索引不到。**SEO 的主战场是在登录墙之外建立一层可被索引的「营销 + 内容」站点**，用日语为主的关键词把"找排班软件的小团队管理者"导流到落地页，再转化为登录用户。

---

## 1. 现状诊断（Baseline Audit）

| 项目 | 现状 | 影响 | 优先级 |
|------|------|------|--------|
| `<title>` | `temp-shifter`（占位符） | 搜索结果标题无意义 | 🔴 P0 |
| meta description | 无 | 摘要由谷歌随机抓取 | 🔴 P0 |
| OG / Twitter Card | 无 | 社媒分享无预览图 | 🟠 P1 |
| hreflang | 无 | 4 语言互相竞争 / 错配语言 | 🔴 P0 |
| 落地页内容 | 1 句英文文案 | 无关键词、无可索引正文 | 🔴 P0 |
| robots.txt | 无 | 抓取无引导 | 🟠 P1 |
| sitemap.xml | 无 | 收录依赖自然发现 | 🟠 P1 |
| 渲染方式 | 纯 CSR（SPA） | 营销页内容对爬虫不友好 | 🔴 P0 |
| 结构化数据 | 无 | 无富结果 / AI 不易引用 | 🟡 P2 |
| 登录后页面 | 全部 noindex 不了（本就抓不到） | 需明确隔离，避免误收录 | 🟡 P2 |
| 域名 | 计划用 `*.pages.dev` | 默认域名权重弱、不利品牌 | 🟠 P1 |

**结论**：当前可被搜索引擎理解的"内容资产"接近于零。先补齐 P0 技术地基，再铺内容。

---

## 2. 目标与 KPI

### 北极星
> 通过自然搜索（含 AI 搜索引用）获取**注册/试用线索**，而非单纯流量。

### 分阶段 KPI

| 阶段 | 周期 | 关键指标 | 目标 |
|------|------|----------|------|
| 地基期 | 第 1 个月 | 技术 SEO 健康分（Lighthouse SEO / GSC 收录） | 落地页 + 营销页 100% 可索引；CWV 全绿 |
| 起量期 | 第 2–4 月 | 收录页面数 / 长尾关键词曝光 | 收录 ≥ 30 页；日语长尾进前 30 名 ≥ 20 个词 |
| 转化期 | 第 5–9 月 | 自然流量 / 注册转化 | 月自然访问 ≥ 2k；自然来源注册 ≥ 50/月 |
| AI 可见性 | 持续 | 在 ChatGPT/Gemini/Perplexity 被推荐 | 「シフト管理 アプリ おすすめ」类问答中被提及 |

---

## 3. 技术 SEO（地基，P0）

### 3.1 SPA 渲染 — 关键决策
纯 CSR 的营销内容对爬虫不可靠。三选一（推荐 A）：

- **A（推荐）静态预渲染营销页**：把落地页、定价、功能、博客等**公开页**用预渲染/静态生成产出真实 HTML（vite SSG 插件或 `vite-react-ssg` / 在 Cloudflare Pages 上预构建 HTML），登录后的 App 仍保持 SPA。投入小、收益直接。
- B 全站 SSR：迁移到 Remix/Next on Pages。投入大，MVP 阶段不必要。
- C 仅靠 Google 动态渲染：不可控，不推荐。

> 落地页与营销页必须输出**首屏即含正文**的 HTML，不能等 JS 注水后才有文字。

### 3.2 每页必备 head 标签
为每个公开页面（按语言）输出：
```html
<title>シフト管理アプリ ShiftManager｜小規模チームの無料シフト表作成</title>
<meta name="description" content="飲食・小売・イベントの小規模チーム向け...（120字以内）">
<link rel="canonical" href="https://<domain>/ja/">
<!-- hreflang 见 4.2 -->
<meta property="og:title" content="..."><meta property="og:description" content="...">
<meta property="og:image" content="https://<domain>/og/ja.png">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
```

### 3.3 robots.txt（放 `public/robots.txt`）
```
User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /admin
Disallow: /settings
Disallow: /auth
Disallow: /api/
Sitemap: https://<domain>/sitemap.xml
```

### 3.4 sitemap.xml
- 自动生成，仅含公开页，每个 URL 带 `<xhtml:link rel="alternate" hreflang="...">`。
- 构建时（`npm run build` 之后）生成，提交到 Google Search Console + Bing。

### 3.5 Core Web Vitals / 性能
Cloudflare 边缘已是优势，仍需：
- 落地页首屏图 `hero.png` 转 WebP/AVIF + 显式 `width/height`（防 CLS）。
- 营销页不加载整个 App bundle（代码分割：落地/营销 与 App 分包）。
- 字体 Outfit/Inter：`font-display: swap` + `preconnect` Google Fonts。
- 目标：LCP < 2.5s、CLS < 0.1、INP < 200ms（手机端实测）。

### 3.6 收录卫生
- 登录后页面本就抓不到，但仍在 robots 中 `Disallow`，并对 `/dashboard` 等返回的 HTML 加 `<meta name="robots" content="noindex">` 兜底。
- 确认 `*.pages.dev` 预览域名加 `noindex`，避免与正式域重复收录。

---

## 4. 国际化 SEO（多语言，P0）

这是本项目最容易做错、也最有价值的一块（主市场日本 + 中文圈）。

### 4.1 URL 结构（推荐子目录）
```
https://<domain>/ja/      ← 日语（默认/主市场）
https://<domain>/zh-cn/
https://<domain>/zh-tw/
https://<domain>/en/
```
- 每种语言**独立可索引 URL**，不要用 `?lang=` 或纯 localStorage 切换（爬虫看不到）。
- 语言切换组件改为 `<a href>` 跳转到对应语言 URL（当前是前端 i18n 内存切换，需补真实路由）。

### 4.2 hreflang（每页互相声明）
```html
<link rel="alternate" hreflang="ja" href="https://<domain>/ja/">
<link rel="alternate" hreflang="zh-Hans" href="https://<domain>/zh-cn/">
<link rel="alternate" hreflang="zh-Hant" href="https://<domain>/zh-tw/">
<link rel="alternate" hreflang="en" href="https://<domain>/en/">
<link rel="alternate" hreflang="x-default" href="https://<domain>/ja/">
```
- `x-default` 指向日语（主市场）。
- 关键词、文案要**按市场本地化**，不是机翻：日本市场习惯说「シフト表」「シフト管理」「勤怠管理」，与中文"排班"语感不同。

---

## 5. 关键词策略

### 5.1 日语核心词（主战场）
| 类型 | 关键词 | 意图 |
|------|--------|------|
| 核心 | シフト管理 アプリ / シフト管理 ツール | 高意图、竞争中 |
| 核心 | シフト表 作成 無料 | 高转化（"免费"） |
| 场景 | 飲食店 シフト管理 / 小売 シフト作成 / イベント 人員 シフト | 行业长尾 |
| 痛点 | シフト 自動作成 / シフト 共有 アプリ | 功能匹配 |
| 出勤 | 勤怠管理 無料 / タイムカード アプリ | 邻接需求 |
| 对比 | shiftmanager 比較 / 〇〇 代替（竞品名 + 替代） | 决策期 |

### 5.2 中文圈
`排班软件 / 排班系统 / 兼职排班 / 门店排班表 / 考勤打卡软件`（zh-CN 与 zh-TW 用词差异要分别处理，如"软件/軟體"、"在线/線上"）。

### 5.3 落地动作
1. 用关键词研究工具（GSC / 关键词工具）补全搜索量与难度，建词库表。
2. 按主题聚类（见第 6 节），一个集群对应一个着陆页/文章。
3. 优先做**高意图 + 中低难度**的长尾（如「飲食店 シフト管理 無料」）。

> 提示：本环境装有 SEO 技能，可直接用 `/searchfit-seo:keyword-clustering`（关键词聚类）和 `/searchfit-seo:content-strategy`（内容策略）跑出词库与内容地图。

---

## 6. 内容策略（增长引擎）

登录墙外建立内容资产，覆盖"认知 → 比较 → 决策"漏斗。

### 6.1 必建的着陆/产品页（每语言一套）
- **首页** `/ja/`：价值主张 + 核心功能 + 截图 + CTA（登录/试用）。
- **功能页** `/ja/features/`：日历排班、班次预设、出勤打卡、月度报表、共享开关。
- **场景页**（行业着陆页，SEO 主力）：
  - `/ja/use-cases/restaurant/`（飲食店向け）
  - `/ja/use-cases/retail/`（小売向け）
  - `/ja/use-cases/event/`（イベント向け）
- **定价页** `/ja/pricing/`（即使免费也要有，命中"無料"词）。
- **对比页** `/ja/compare/<竞品>/`（命中"比較/代替"高意图词）。

### 6.2 博客 / 知识库（长尾捕获）
主题示例（日语优先）：
- 「シフト表の作り方｜無料テンプレート付き」
- 「飲食店のシフト管理でよくある失敗と解決法」
- 「シフトの公平な組み方・希望シフトの集め方」
- 「勤怠管理とシフト管理の違い」
每篇：1 主关键词 + 2–3 相关词，含目录、内链到功能/场景页、明确 CTA。

### 6.3 内链结构
博客 → 场景页 → 首页/定价，形成"内容→产品"的链路；首页/功能页互链分配权重。

---

## 7. 结构化数据（Schema，P2）
在公开页注入 JSON-LD：
- **SoftwareApplication**（首页/功能页）：名称、类别 `BusinessApplication`、操作系统 `Web`、价格、评分（有了再加）。
- **FAQPage**（场景页/定价页底部 FAQ）：利于富结果 + AI 引用。
- **Organization** + **WebSite**（含 `sitelinks searchbox` 备选）。
- **BreadcrumbList**（博客/场景页）。

> 可用 `/searchfit-seo:schema-markup` 直接生成可粘贴的 JSON-LD。

---

## 8. AI 可见性（GEO / AEO，差异化加分）
越来越多用户在 ChatGPT/Gemini/Perplexity 问「シフト管理アプリ おすすめ」。要被引用：
- 内容写成**可直接引用的问答/清单**结构（FAQ、对比表、"最适合 X 的 Y"句式）。
- 在第三方"软件目录/评测站"建立条目（日本：ITreview、BOXIL、比較ビズ 等 SaaS 比較サイト）。
- 保持 NAP/品牌信息一致，便于 AI 聚合。
- 定期检索品牌名与品类词在各 AI 中的表现（可用 `/searchfit-seo:ai-visibility`）。

---

## 9. 站外 / 权威建设（P2，长期）
- 上架日本 SaaS 比較サイト / 软件目录（多为高权重外链 + 直接获客）。
- 行业媒体投稿（飲食・小売 经营类博客）。
- 产品上 Product Hunt（英文市场曝光 + 外链）。
- 自有内容被引用产生自然外链（高质量模板、テンプレート下载）。

---

## 10. 执行路线图

### Phase 1 — 技术地基（第 1–2 周，P0）
- [ ] 修正 `index.html` 标题 / description / OG（先止血）
- [ ] 营销页静态预渲染方案落地（vite SSG 或独立营销页）
- [ ] 多语言子目录路由 `/ja /zh-cn /zh-tw /en` + 语言切换改 `<a>` 跳转
- [ ] hreflang + canonical 全量输出
- [ ] `robots.txt` + 构建时生成 `sitemap.xml`
- [ ] 接入 Google Search Console + Bing，提交 sitemap
- [ ] CWV 优化（hero 图 WebP、字体 swap、营销页分包）

### Phase 2 — 内容着陆页（第 3–6 周，P1）
- [ ] 关键词研究 + 聚类，产出词库与内容地图
- [ ] 日语：首页 / 功能页 / 3 个场景页 / 定价页（含 FAQ + Schema）
- [ ] 中文圈复用结构本地化
- [ ] OG 图按语言制作

### Phase 3 — 内容运营（第 2–4 月，P1）
- [ ] 博客上线，日语每周 1–2 篇长尾文
- [ ] 内链体系搭建
- [ ] 对比页（命中"比較/代替"词）

### Phase 4 — 站外 + AI 可见性（第 3 月起，持续）
- [ ] 上架日本 SaaS 比較サイト / 软件目录
- [ ] AI 可见性监测与内容调优
- [ ] 外链 / 投稿持续运营

---

## 11. 监测与工具
| 用途 | 工具 |
|------|------|
| 收录 / 关键词 / CWV 实测 | Google Search Console（必装） |
| Bing 收录 | Bing Webmaster Tools |
| 流量 / 转化 | 一款分析（GA4 或 Cloudflare Web Analytics，注意日本隐私合规） |
| 技术体检 | Lighthouse / PageSpeed Insights |
| 本仓库内的 SEO 技能 | `/searchfit-seo:seo-audit`、`keyword-clustering`、`content-strategy`、`schema-markup`、`on-page-seo`、`ai-visibility` |

---

## 12. 立刻能做的 5 件事（Quick Wins）
1. 把 `index.html` 的 `temp-shifter` 改成真实日语标题 + description + OG。
2. 加 `public/robots.txt`（含 Disallow 登录区 + Sitemap 行）。
3. 落地页正文换成含关键词的真实日语文案（当前仅一句英文）。
4. 申请并绑定一个**品牌域名**（弃用 `*.pages.dev` 作为正式站）。
5. 注册 Google Search Console，提交首页 URL 开始监测。

> 第 1、2、3、5 条我可以现在就帮你改/建文件，第 4 条需要你提供域名。
```

---

**下一步**：要我直接落地 Quick Wins（改 `index.html`、加 `robots.txt`、重写落地页日语文案）吗？或者先用 `/searchfit-seo:keyword-clustering` 跑一版日语关键词词库再定内容地图。
