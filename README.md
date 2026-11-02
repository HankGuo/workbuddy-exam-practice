# 讲师认证题库自测

基于「WorkBuddy 讲师认证考试 · 题库合并（两卷去重 93 题）」做的单文件模拟练习 Web 应用。

- 题型覆盖：单选 81 · 多选 28 · 判断 24（共 133 题），实锤答案、推荐答案、高频必背均已标注
- 两份来源：①《题库合并-两卷93题》93 题 ②《WorkBuddy·销售一页纸（二）·企业版 vs 个人版》(v5.2.1, 2026-07-04) 补充 40 题
- 五大模式：背题模式（两步翻面）、真实答题（按真实考试结构抽题 / 计时 / 判分 / 连对统计）、错题本（localStorage 持久化）、**概念白话**、备考要点（价格数字锚点 + 临场清单）
- 形态：单个自包含 `index.html`，无外部依赖、无网络请求，可直接在微信内置浏览器打开

## 设计体系：对齐 WorkBuddy 官方

整套 UI 按 WorkBuddy 官网设计令牌重做（取自 `assets.workbuddy.cn` 主 CSS 的 `--wb2-*` 变量）：

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--wb2-brand-500` | `#00c29a` | 品牌主色（主按钮、进度、选中态） |
| `--wb2-brand-50` / `--wb2-brand-100` | `#f2fcfa` / `#ddf0ec` | 品牌浅底 / 描边 |
| `--wb2-text-brand` | `#009273` | 品牌色文字 |
| `--wb2-text-primary` / `secondary` / `tertiary` | `#1a1a1a` / `#646464` / `#a3a3a3` | 三级文字 |
| `--wb2-surface-page` / `sunken` / `chip` | `#fff` / `#f7f8f9` / `#f1f2f4` | 页面 / 凹陷面 / 标签 |
| `--wb2-border-default` / `subtle` | `#e0e0e0` / `#ebebeb` | 描边 |
| `--wb2-radius-card` / `panel` / `pill` | `16px` / `20px` / `999px` | 圆角体系 |
| `--wb2-pattern-bg` | `#dbf7ff` + `#e9fff4` | 页面渐变底纹 |
| Logo 取色 | `#0ec8a9` / `#01c886` | 品牌标记 |

排版沿用官方 `--wb2-font`（PingFang SC），顶栏高度 60px，主内容容器 820px。

### 引用的官方资产

| 资产 | 来源 | 用法 |
| --- | --- | --- |
| 官方 Logo | `assets.workbuddy.cn/.../assets/logo.svg`（原件，含渐变圆 + 猫头 + 黄色光斑） | 顶栏品牌标记、Hero 标签、**favicon**（base64 内联） |
| 官方横版字标 | `assets/.../workbuddy-logo-WhgOvEF7.png`（1620×560） | 体积 272KB，单文件场景未采用 |
| 图标库 | lucide v1.66.0（ISC，官网同款 `lucide-react`） | 31 个图标做成 `<symbol>` sprite，`<use>` 引用 |
| 官网同款图标 | 从官网 bundle 反查出的 `check` / `layout-grid` / `list` / `chevron-down` / `arrow-up-right` / `gift` | 答题卡图例等 |

入口图标沿用官方产品语义：背题模式 `book-open`、真实答题 `clipboard-check`、错题本 `bookmark`、概念白话 `lightbulb`、备考要点 `list-checks`、随机抽一题 `shuffle`。

> 注意：官网 logo.svg 带 `clipPath` / `linearGradient` / `filter` 等 id 引用，**多实例嵌入必须给每份改一套 id 前缀**，否则引用断链、只渲染出光斑。JS 里也别把反引号写进正则字面量（`/const X=\`...\`/` 会让解析器当成模板字符串，直接语法错误）。


### 真实答题页

- **HUD**：题型 + 进度条 + 已答题数，吸顶不随滚动消失
- **环形滑动计时器**：56px SVG 环形进度，`stroke-dashoffset` 以 1s 线性过渡随剩余时间滑动；≤5 分钟转琥珀色、≤1 分钟转红色
- **答题卡**：顶栏「答题卡」按钮唤起底部弹层，数字格三态（当前 / 已答 / 未答），点格跳题
- **吸底操作栏**：上一题 / 下一题（末题变「提交答卷」），含 `safe-area-inset` 适配
- **题卡**：题干与选项统一收纳进圆角卡片，选项为可点卡片 + 圆形序号徽标


## 教学设计：两步翻面

翻面不是一次性把答案糊你脸上，而是分两步：

1. **先自己判**——点「显示答案」，正确项高亮，你先核对自己判对没；
2. **再看为什么**——点「看白话讲解」，才展开这题的**白话讲解**和挂上去的**相关知识卡**。

解析区不再出现「× A 至少不是这个」这类直接点破对错的批注——那只是剧透，不是教学。

## 概念白话

把题库里那些抽象词（沙箱、安全通信网关、私有化部署、连接器 vs 资料库、插件 / 技能、MCP、托管 Agent、积分计费、红线、安全三层纵深防御、权限与二次确认、工作空间、合规、HTTPS / TLS、版本矩阵、竞品打击、分诊话术、自动化、多模态、助理）做成 **20 张生活类比卡**，用做饭、门禁卡、书架与快递柜、话费池、小区安保这些日常场景讲清楚。

- 首页「概念白话」可通读全部卡片；
- 每题解析底部自动挂上相关卡片（按 `concepts` 标签关联）。

## 练习手感

- 首页「随机抽一题」，单题速测；
- 真实答题结算给「最长连对」和一句针对当次表现的结语；
- 结算页数字口径统一：**得分**为加权分（单选 2 / 多选 3 / 判断 1），**答对题数**为题目计数，不混用「正确率」造成歧义。

## 使用

直接用浏览器打开 `index.html` 即可。如需在微信内打开或分享，把它托管到任意静态服务（GitHub Pages / Cloudflare Pages 等）后转发链接。

错题本数据保存在浏览器本地（localStorage），清缓存会丢失；不会上传到任何服务器。

## 数据来源与构建

题库文本来自内部备考资料 `题库合并-两卷93题-给吴熳.md`。

```
build_questions.py   # 原始 markdown -> data.js（META + QUESTIONS）
augment.js           # 注入每题 plain（白话讲解）与 concepts（概念标签），并生成 CONCEPTS 卡库 -> data.js
build.js             # 把 data.js 重新内联进 index.html（保持单文件）
pdf_questions.js     # 销售一页纸补充的 40 题 + 6 张新概念卡
node augment.js      # 合并基础题库 + 补充题库，注入 plain/concepts，重算 META -> data.js
node build.js        # 把 data.js 重新内联进 index.html（保持单文件）
node _verify.js      # 真浏览器端到端验收（两步翻面 / 概念卡 / 模拟 50 题 / 数字锚点 / 无横向滚动 / 无报错）
node _shots.js       # 截图，用于视觉复核
```

改动题库或讲解后，重跑 `node augment.js && node build.js` 即可。
