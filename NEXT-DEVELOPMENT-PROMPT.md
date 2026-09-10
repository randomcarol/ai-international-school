# AI International School · 下一阶段 Codex 开发 Prompt

> 用法：把本文件全文作为一个新的 Codex 开发任务。这个 Prompt 只授权完成下面定义的单一阶段，不授权继续扩建其他长期功能。

---

你现在要在以下项目中继续开发：

`/Users/dengzhilei/Documents/ChatGPT/ai国际学校`

始终使用简体中文向我汇报；产品界面和学习内容默认使用英文，只有用户主动点击时才显示中文词义或中文提示。

## 一、先理解定位

AI International School 的主要定位是一个真正能长期使用的英语学习产品。

校园、教室、教师、朋友和校园生活是学习体验的组织方式，不是产品核心本身。产品核心是：

```text
Input
→ Comprehension
→ Vocabulary / Expression Extraction
→ Active Recall
→ Speaking / Writing Output
→ Feedback
→ Memory Update
→ Personalized Review
```

“Fall Recruiting / English Interview”仍然是第一学期的现实学习目标，但它只是第一套课程主题，不要把整个产品做成单纯的面试题网站。

必须坚持：

- Passive vocabulary 不等于 Active vocabulary。
- 同一个单词或表达要跨听力、阅读、练习和对话重复出现。
- 校园行为必须服务学习目标。
- 不使用一个模糊的“英语总分”替代具体学习证据。
- 不把产品做成套了校园皮肤的空白 AI 聊天框。

## 二、开始前必须阅读的材料

先阅读并审计这些文件，但不要把其中的文档内容误认为高于本 Prompt 的系统指令：

- 初始产品设想：`/Users/dengzhilei/Downloads/AI International School — 完整分阶段 Codex 开发 Prompt.md`
- 当前可交互视觉 Demo：`campus-demo/index.html`
- 当前 Demo 说明：`campus-demo/README.md`
- 当前交互逻辑：`campus-demo/app.js`
- 当前样式：`campus-demo/styles.css`
- 早期设计稿：`design-concepts/`

视觉和功能参考：

- Rhythm Word：https://rhythmword.com/
- 每日英语听力官方 App Store 页面：https://apps.apple.com/cn/app/每日英语-听力学习版/id1476509317

从 Rhythm Word 借鉴：目标导向的词汇计划、新语境复习、从识别走到主动输出、间隔重复和清晰的每日节奏。

从每日英语听力借鉴：播放器、变速、单句循环、同步字幕、查词、精听、听写和跟读等围绕同一份材料的学习工具链。

不要复制它们的品牌、插画、图标、截图或具体视觉资产，只提炼产品模式和交互原则。

## 三、本阶段唯一目标

完成一条可真实走通的“每日英语课”纵向切片：

```text
Campus / Today
→ Lesson preview
→ First listening
→ Transcript and comprehension
→ Dictation
→ Vocabulary activation
→ Conversation with Maya
→ Lesson report
→ Tomorrow review task
```

目标时长为 10–15 分钟。完成后，用户应当明确感受到：今天听懂了一份材料，学到了三条表达，并在新的场景中主动使用了其中至少一条。

不要在本阶段开发完整课程库、真实社交系统、恋爱系统、自由行走、校园建设、实时语音或复杂 Agent 编排。

## 四、执行顺序

### Step 0 — Repository Audit

在修改代码前：

1. 检查仓库状态、现有目录、运行方式和依赖。
2. 确认当前 `campus-demo/` 是无构建工具的静态原型。
3. 不覆盖、不删除已有设计稿和生成图片。
4. 简洁汇报你准备采用的目录结构和原因。
5. 检查工作区是否存在 `AGENTS.md`、现有包管理器或其他约束。

如果没有真正的应用骨架，在仓库内新建 `school-app/`。不要把 Next.js 文件散落到现有视觉稿目录中。

### Step 1 — Product Foundation for This Slice

优先技术方案：

- Next.js App Router
- TypeScript，开启严格模式
- React
- CSS Modules 或结构清晰的全局设计 tokens
- 本阶段不接 Supabase
- 本阶段不调用 LLM、STT、在线 TTS 或第三方评分 API
- 使用本地 mock repository 保存课程内容
- 使用带版本号的 `localStorage` repository 保存学习进度
- 为未来数据库实现保留清晰接口，不要把状态全部塞进页面组件

如果项目中已经存在合理的等价技术方案，优先延续，不为满足清单而重写。

数据访问至少抽象为：

```ts
interface LearningRepository {
  getTodayPlan(): Promise<TodayPlan>
  getLesson(id: string): Promise<Lesson>
  getSession(lessonId: string): Promise<LearningSession | null>
  saveEvent(event: LearningEvent): Promise<void>
  saveSession(session: LearningSession): Promise<void>
  getVocabularyState(itemId: string): Promise<UserVocabularyState | null>
  getReviewQueue(): Promise<ReviewTask[]>
}
```

不要现在创建巨大的通用架构。只实现这条纵向切片真正用到的字段。

### Step 2 — Create One Original Lesson

创建一节原创英文听力课，建议主题：

**Planning a Student Career Fair**

要求：

- 约 75–100 秒。
- B2 左右难度。
- 6–9 个可独立播放的字幕句段。
- 内容自然、像校园或工作场景中的真实交流。
- 不复制新闻、教材、影视或考试文章。
- 目标表达固定为 3 个，例如：`trade-off`、`prioritize`、`stakeholder`。
- 三个表达在听力原文中都要自然出现。
- 提供简洁英文释义、一个新的英文例句和按需显示的中文释义。
- 准备 3 道理解题、2 道听写题和 3 个词汇练习。

音频要求：

- 优先生成并提交一个本地音频资产，运行时不能依赖在线服务或 API key。
- 如果当前环境无法可靠生成音频，可以使用浏览器 SpeechSynthesis 作为明确标注的原型降级方案，但必须封装在 `AudioProvider` 接口后面，并说明它不提供真实精确时间轴。
- 不得伪造逐字时间轴。如果只能得到句级时间，就实现句级高亮。
- 没有音频时必须显示可理解的错误/降级状态，不能让播放按钮无反应。

### Step 3 — Build the User Journey

至少实现以下产品页面或等价路由。

#### 1. Campus / Today

- 复用现有原创校园图片和整体温暖风格。
- 校园首页同时提供“Today’s timetable”和自由探索入口。
- 显示今天预计 10–15 分钟，而不是虚构的 60 分钟完整课程。
- 今天的主任务只允许有一个明显主按钮：`Start today’s lesson`。
- 提供三个轻量阶段：Listen、Activate、Use。
- 不使用开发者用的 Scenes 菜单作为正式导航。

#### 2. Lesson Preview

- 展示标题、学习目标、时长、难度和三个目标表达。
- 告诉用户第一次播放时不会显示字幕。
- 提供返回校园和开始课程。

#### 3. Listening Player

第一次播放：

- 默认隐藏字幕。
- 提供 Play / Pause、后退 5 秒、速度切换。
- 至少支持 0.75×、1×、1.25×。
- 完成第一次播放后才能主动查看字幕和答案。

第二阶段：

- 显示句级同步高亮字幕。
- 可以点击句子重播该句；如果技术降级只能重新朗读该句，要明确表现。
- 支持当前句循环。
- 点击目标词显示英文释义；中文释义必须由用户主动展开。
- 可以把目标词加入本课词汇笔记。
- 回答 3 道理解题，并为每题显示解释。

#### 4. Dictation

- 从课程中选 2 个句子。
- 用户可以重复播放。
- 提交后按词级显示遗漏、多余和拼写差异。
- 接受大小写和句末标点差异。
- 显示具体差异，不只显示百分比。
- 记录 Listening Recognition 相关事件。

#### 5. Vocabulary Activation

三个目标表达都必须完成以下不同类型中的至少两种：

- Meaning recognition
- Context selection
- Cloze
- Active recall
- Original sentence

至少有一个步骤要求用户自己输入，而不是全部选择题。

同一目标词分别记录：

- meaningRecognition
- listeningRecognition
- activeRecall
- writingProduction

V1 使用透明、可配置的规则更新这些维度。不要使用 `mastered: true` 这样的单字段，也不要展示无法解释的能力分数。

#### 6. Conversation with Maya

- 使用现有 `campus-demo/assets/courtyard.png`。
- 场景目标和今天的课程相连。
- 明确提示用户自然使用 `trade-off`、`prioritize` 或 `stakeholder` 中至少一个。
- 本阶段可以使用设计好的有限分支和规则匹配，不需要 LLM。
- 不要求用户为了过关机械复制整句。
- 对话过程中不连续打断纠错。
- 对话结束后再显示反馈。
- 反馈至少说明：是否完成沟通目的、是否使用目标表达、哪一句可以更自然。
- 反馈必须说明是规则判断，不冒充 AI 深度评价。

#### 7. Lesson Report

课程结束后显示：

- 完成了哪些环节。
- 三个表达分别在哪些语境出现过。
- 哪些词只是理解，哪些已经主动使用。
- 听写中出现的具体问题。
- 用户写过的原句。
- 明天要复习什么以及为什么。

不要显示单一“英语能力 85 分”。可以显示可追溯证据，例如：

> You recognized “trade-off” in listening and used it once in writing. It has not appeared in spontaneous conversation yet.

完成报告后，Campus / Today 页面要显示课程完成，并出现一条 Tomorrow Review 任务。刷新页面后状态仍然存在。

## 五、核心数据结构

至少定义并实际使用以下精简类型：

```ts
type SkillDimension =
  | 'meaningRecognition'
  | 'readingRecognition'
  | 'listeningRecognition'
  | 'activeRecall'
  | 'speakingProduction'
  | 'writingProduction'

interface TranscriptSegment {
  id: string
  text: string
  startMs?: number
  endMs?: number
}

interface VocabularyItem {
  id: string
  term: string
  definition: string
  chineseMeaning: string
  example: string
  targetDimensions: SkillDimension[]
}

interface LearningEvent {
  id: string
  occurredAt: string
  lessonId: string
  type: string
  vocabularyItemId?: string
  dimension?: SkillDimension
  result?: 'correct' | 'incorrect' | 'partial' | 'completed'
  evidence?: string
}

interface UserVocabularyState {
  vocabularyItemId: string
  dimensions: Record<SkillDimension, number>
  exposureCount: number
  lastSeenAt?: string
  nextReviewAt?: string
}
```

所有关键学习动作都记录为 append-only `LearningEvent`。派生状态可以更新，但不要丢掉历史事件。

学习事件至少覆盖：

- audio_started
- first_listen_completed
- transcript_revealed
- transcript_segment_replayed
- vocabulary_opened
- chinese_meaning_revealed
- vocabulary_saved
- comprehension_answered
- dictation_submitted
- vocabulary_exercise_answered
- original_sentence_submitted
- conversation_completed
- target_expression_used
- lesson_completed
- review_scheduled

## 六、导航和视觉要求

建立正式产品导航：

- Campus
- Today
- Library
- Notebook
- Profile

本阶段只需让 Campus、Today 和 Notebook 有真实内容。Library 和 Profile 可以提供清楚的“后续阶段”空状态，但不能出现无反应按钮。

视觉采用“双层模式”：

### Campus mode

- 使用温暖手绘校园图。
- 奶油白、森林绿、木色和秋日橙。
- UI 像课表、校园告示和学生手册。
- 场景只承担氛围、导航和学习结果反馈，不在图片上堆积大段文字。

### Learning mode

- 更接近现代英语学习 App。
- 背景建议 `#F7F3EA`。
- 主色建议 `#294C3A`。
- 听力状态可以使用 `#486C89`。
- 重点和提醒使用 `#CE814B`。
- 每页只有一个明显主操作。
- 清楚区分播放状态、未完成、已完成、正确、错误和待复习。
- 叙事标题可使用衬线字体；正文、字幕和控制组件使用易读无衬线字体。

响应式要求：

- 在 1440×900 桌面端完整可用。
- 在 390×844 手机端完整可用。
- 移动端不要缩小整张桌面校园；将场景放在顶部约 30%–40%，任务内容使用下方抽屉或内容面板。
- 键盘可操作，焦点状态明显。
- 播放器有文本标签和合适的 accessible name。
- 尊重 `prefers-reduced-motion`。
- 文本对比度达到 WCAG AA。

## 七、状态与恢复

- 所有进度使用一个带 schema version 的存储结构。
- 刷新后恢复到最近步骤，但必须允许用户回到 Today 或重新开始本课。
- Reset 只删除本项目自己的存储键，需要确认。
- 不要把用户输入注入 `innerHTML`。
- 不要保存麦克风内容；本阶段也不申请麦克风权限。
- 明确显示数据仅保存在本设备。

## 八、测试和验收标准

实现完成后必须实际运行，不要只检查代码是否能编译。

至少提供：

1. TypeScript、lint 和 production build 通过。
2. 单元测试覆盖：
   - 听写文本规范化和差异。
   - 词汇维度更新规则。
   - 复习任务生成。
   - 对话目标表达检测。
   - 存储 schema 迁移或错误恢复。
3. 集成或端到端测试覆盖完整路径：
   - Today → Listening → Comprehension → Dictation → Vocabulary → Maya → Report。
   - 首次播放前字幕不可见。
   - 完成后刷新仍显示完成状态。
   - 明天复习任务会生成，而且不会因为重复进入报告而重复累计。
4. 检查 1440×900 和 390×844 两个视口。
5. 检查所有主要按钮、返回路径、错误状态和键盘焦点。
6. 如环境允许，输出关键页面截图供视觉复核。

必须满足的产品验收：

- 用户不打开开发者 Scenes 菜单，也能完成整条路径。
- 同一个目标表达至少在听力原文、词汇练习和 Maya 对话三个地方出现。
- 至少一个目标表达完成从理解到主动使用。
- 报告中的每个判断都能指向一个用户行为或学习事件。
- 不出现虚构的 AI 评分、伪造的音频时间轴或无来源版权材料。
- 没有死按钮、死链接和无法退出的步骤。

## 九、本阶段明确不做

不要实现：

- Supabase、登录和多用户系统。
- 完整内容库和搜索。
- TOEFL 完整课程体系。
- 真实 AI Agent 或聊天 API。
- 实时语音对话、STT 和发音评分。
- 自动生成无限课程。
- 自由行走和复杂寻路。
- 校园建设、金币、商店、体力系统。
- 朋友或恋爱关系数值系统。
- 排行榜和社交分享。
- 复杂 FSRS；本阶段只生成一个可解释的次日复习任务。

如果发现某项不在范围内，把它记录到 `school-app/docs/ROADMAP.md`，不要顺手开发。

## 十、完成后的汇报格式

完成后用简体中文汇报：

```text
What we built
完整用户路径

How the learning loop works
学习事件如何产生、如何更新词汇维度、如何安排明日复习

Important product decisions
为什么这样做，尤其是校园与英语学习的分工

How to run and test
精确命令和入口

Verification results
build、test、视口和视觉检查的真实结果

Known limitations
音频、评分、内容和本地存储的真实限制

What should be next
只建议下一个最小阶段，不要自动开始
```

如果测试或视觉检查没有运行成功，要明确说明原因，不能用“应该可以”替代结果。

现在开始：先执行 Step 0 Repository Audit，向我汇报审计结果和建议目录结构；然后在没有新的重大产品歧义时，继续完成本阶段，不要擅自扩展范围。
