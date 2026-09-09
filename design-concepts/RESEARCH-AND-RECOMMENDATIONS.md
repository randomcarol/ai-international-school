# AI International School：产品、竞品与前端方向建议

## 一句话判断

这不是“AI 聊天框 + 校园皮肤”，而应该是一套以学期目标、每日课表、长期学习事件和自适应复习为骨架的个人学习操作系统。V1 是否成立，只看一个闭环：Day 1 暴露弱点并记录 → Day 2 因该弱点改变问题与练习 → 新表现再次更新掌握度。

## 对初稿的主要意见

### 保留并强化

- “Learn in English” 比“学英语”更有长期差异化。
- Story Bank、Vocabulary State、Mistake Book、Interview History 是正确的核心对象。
- 先文字面试、再 push-to-talk、最后才考虑 Realtime Voice，顺序正确。
- V1 不用复杂多 Agent。清晰、可观测、可重放的 workflow 更适合验证产品。
- 被动认识与主动产出分开计分，是很强的产品洞察，也是 Portfolio 最值得讲的部分之一。

### 建议修改

1. 不要先把所有数据库实体都建完。先围绕一条竖切闭环保留 8–10 个核心表：`learner_profile`、`semester`、`learning_session`、`story`、`interview_attempt`、`evaluation`、`vocabulary_item`、`learner_vocabulary_state`、`mistake`、`learning_event`。
2. 将数据分成两层：不可变的事实事件与可更新的当前状态。比如一次使用 `push back` 是事件；Speaking mastery 31 → 38 是状态快照。快照应能从事件重算。
3. 不要把 RAG 当长期记忆。RAG 负责从 Resume/JD/资料中找证据；Learner Memory 负责保存结构化学习事实、能力状态、错误与计划依据。
4. 每次 Agent 决策应保存“为什么选这个问题/词/故事”的 reason code，方便 Debug、评估和作品集讲解。
5. 先建立一套固定评测样本，再追求自由生成。至少覆盖相同输入是否稳定识别 STAR 缺失、是否避免编造简历事实、是否正确读到昨日弱点。
6. Resume、JD、面试录音包含敏感信息。上传、保留期、删除、模型供应商发送范围要在 V1 就设计，而不是上线前补。

## 从模拟经营与学校游戏借鉴什么

- [Two Point Campus（Steam）](https://store.steampowered.com/app/1649080/Two_Point_Campus/)：轻松校园身份、课程与经营状态并行。可借鉴“第一眼就是学校”的可读性，不复制其美术资产。
- [Let’s School（Steam）](https://store.steampowered.com/app/1937500/Lets_School/)：学生兴趣、教师成长、设施和事件互相影响。可借鉴“每个选择产生后果”的反馈表达。
- [Academia: School Simulator（Steam）](https://store.steampowered.com/app/672630/Academia__School_Simulator/)：清晰的俯视管理视角、需求状态、设施用途与学校定制。适合参考校园总览的信息密度。
- [Kairosoft 官方游戏目录](https://kairopark.jp/android/en/) 与 Pocket Academy 系列：课程、社团、教师、设施、关系和季节共同组成持续运转的校园。适合参考“小人生活 + 地点触发 + 数值成长”的循环。

应迁移到本项目的不是“盖楼经营”，而是四种交互原则：

1. 状态持续可见：时间、精力、学期目标、当前任务、掌握度。
2. 地点代表行为：Vocabulary Lab 不是装饰，它只承载词汇训练；Interview Room 只承载模拟面试。
3. 角色代表语域：朋友练自然闲聊，老师练澄清与专业反馈，伴侣练情绪、边界和生活计划。
4. 行动产生可见后果：一次课程结束必须明确告诉用户，哪些事件被记录、哪个状态改变、明天为什么会不同。

## GitHub 前端 Skill 调研

- [design-taste](https://github.com/arez-xd/ux-ui-design-taste)：适合项目长期使用。重点是清晰焦点、真实内容、克制配色、响应式、无障碍和反模板化。
- [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)：更像可查询的设计知识库，含风格、配色、字体、交互、无障碍与多技术栈规则。适合选定方向后固化 design system。
- [taste](https://github.com/tyfarrago-hub/taste)：包含 build、critique、polish 与多种视觉 taste 子技能。适合后期针对某个页面做专项打磨，不建议一口气加载全部规则。
- [frontend-design](https://github.com/PaulRBerg/agent-skills/blob/main/skills/frontend-design/SKILL.md)：强调先读产品、明确视觉 thesis、用领域特有元素建立记忆点、再渲染验证，方法论与本项目相符。

本轮没有安装任何外部 Skill。理由：当前目标是比较产品方向；过早安装会把某个 Skill 的审美偏好变成隐性约束。选定主方向后，建议只选一套主 Skill，再为项目写自己的 `design-system.md`。

## GitHub 英语学习 / Agent 项目调研

- [OpenLingo](https://github.com/pretzelai/openlingo)：可重点研究持久记忆工具、SRS、课程/练习模型以及 TTS/STT 缓存。它证明“AI 对话 + 记忆 + 复习系统”可以成为完整学习产品，但本项目需要更强的目标型 interview workflow。
- [Adaptive AI Tutor](https://github.com/UAnirudh/adaptive-ai-tutor)：结构化 student model、mastery、recurring mistakes、session summary 很贴近本项目。仓库影响力很小，适合看思路，不应直接当生产架构模板。
- [Discens](https://github.com/itisAliRH/discens)：Next.js + Supabase + OpenAI + FSRS + voice 的组合与初稿技术栈接近；它自己也注明来自 hackathon，最值得借鉴的是快速竖切，最需要警惕的是测试、可观测性和生成内容护栏。
- [Realtime Language Tutoring System](https://github.com/coding-crying/realtime-agents-language-tutor)：展示了 Realtime API、SRS 与双 Agent 的组合。适合未来语音阶段做对照，不适合 V1；Neo4j 和双 Agent 会提前放大系统复杂度。

## 五套前端稿的比较

| 稿件 | 核心隐喻 | 优点 | 风险 | 最适合 |
|---|---|---|---|---|
| 01 Campus Operations | 轻松校园经营台 | 课表与行动极清楚，亲切、有游戏感 | 容易逐步长成卡片型 Dashboard | 日常首页 |
| 02 Collegiate Editorial | 常春藤校报/学术门户 | 成熟、可信、作品集质感强 | 游戏感弱，对年轻用户不一定活泼 | 成绩、报告、Story Bank |
| 03 Pixel Campus | 俯视校园与地点触发 | “进入学校”的体验最强，角色与地点可扩展 | 美术和状态机成本最高，不能让走路阻碍学习 | 校园总览、探索层 |
| 04 Chalkboard Classroom | 沉浸式教室与黑板 | 课程目标集中，老师与训练步骤自然 | 每种课程都要设计自己的教学交互 | Interview English、讲解课 |
| 05 Campus Life Dialogue | 关系驱动的场景英语 | 把语域、关系与真实生活连接起来 | 恋爱/关系系统必须克制，避免变成陪伴聊天产品 | 校园生活、自由对话扩展 |

## 推荐的组合，而不是五选一

建议最终采用“03 + 01 + 04 + 05，02 作为报告视觉”：

- 03 是校园外壳：首页可看见小人、地点、当天事件。
- 01 是快捷层：用户忙时可一键开始下一堂课，不必强制走地图。
- 04 是课程内页：黑板呈现计划，老师负责引导，练习产生结构化事件。
- 05 是 Campus Life：朋友、老师、伴侣触发不同语域的英语实践。
- 02 用于 Interview Report、Transcript、Story Archive 与 Portfolio 输出。

关键原则：游戏地图是可跳过的“沉浸入口”，不是效率税。任何核心学习任务都应在两次操作内开始。

## 下一步建议

1. 先从五稿中选一个“外壳方向”和一个“课程内页方向”，不要马上做完整校园。
2. 做一个可测试的 3 屏原型：Campus / Today → Classroom → Interview Report。
3. 同时定义最小 Learning Event schema 与 Day 1/Day 2 固定验收脚本。
4. 用真实 Resume + JD 走一遍文字面试闭环，再决定是否进入语音和更重的游戏化。
5. 只有视觉方向稳定后，再安装/固化前端 Skill 与 design system，避免设计规范反复重写。
