# Zesume v1 需求文档：Gen Z Resume Rewriter

## 1. 项目名称

项目名称：

```text
Zesume
```

名称含义：

```text
Zesume = Gen Z + Resume
```

产品定位：

> Zesume 是一个面向 Gen Z 学生和早期求职者的 AI 简历改写工具。

第一版核心功能：

> 用户粘贴原始简历文本，选择目标职业方向模板，系统根据模板规则和 AI 改写能力，生成一份更适合目标方向的简历文本。

---

## 2. 项目目标

Zesume v1 的目标不是做完整求职平台，而是做一个轻量、清晰、可快速上线的 Resume Rewriter。

第一版暂时不做：

```text
岗位推荐
模拟面试
岗位筛选
自动投递
ATS 评分
PDF 解析
DOCX 解析
在线简历编辑器
```

Zesume v1 只验证一个核心需求：

> 用户是否愿意粘贴自己的简历，并复制 AI 改写后的结果。

---

## 3. MVP 核心功能

### 3.1 简历文本输入

用户在页面中粘贴自己的原始简历文本。

输入方式：

```text
多行文本框
```

第一版不支持：

```text
PDF 上传
DOCX 上传
LinkedIn 导入
图片识别
```

基础限制：

```text
输入为空：禁止生成
输入过短：提示用户粘贴更完整的简历
输入超长：提示用户缩短内容
免费测试阶段输入长度限制：3,000–5,000 字符
```

建议后端限制：

```ts
const MIN_RESUME_LENGTH = 200;
const MAX_RESUME_LENGTH = 5000;
```

---

### 3.2 目标模板选择

第一版提供 3 个目标模板：

```text
Software Engineering
Quant
Finance / Spring Week
```

模板不是 UI 样式，而是一套简历改写规则。

---

#### Software Engineering 模板

重点突出：

```text
编程语言
技术栈
项目实现
前端 / 后端 / 全栈能力
部署经验
工程能力
团队协作
```

改写风格：

```text
使用强动词开头
明确技术栈
突出实现细节
尽量说明影响或结果
不夸大
不编造
```

---

#### Quant 模板

重点突出：

```text
数学能力
概率统计
Python / C++ / pandas / NumPy
数据分析
回测
金融市场理解
模型和策略思维
```

改写风格：

```text
更 quantitative
突出数据、模型、指标和分析过程
如果用户没有提供 Sharpe、IC、收益率、回撤等指标，不能编造
可以建议用户补充量化指标，但不能直接生成假的指标
```

---

#### Finance / Spring Week 模板

重点突出：

```text
Leadership
Teamwork
Communication
Commercial awareness
Initiative
Academic excellence
Extracurricular activities
```

改写风格：

```text
减少过度技术细节
强调责任、合作、影响力和结果
更适合投行、咨询、Spring Week 申请
表达正式、简洁、职业化
```

---

### 3.3 Tone 选择

第一版提供 3 种 tone：

```text
Professional
Concise
Technical
```

Professional：

```text
正式、 polished，适合实习和求职申请。
```

Concise：

```text
更短、更直接，减少废话，控制 bullet 长度。
```

Technical：

```text
更强调技术栈、实现细节和工程能力。
```

---

### 3.4 AI 简历改写

AI 的任务是：

```text
改写 bullet points
优化表达
压缩冗长句子
根据模板调整重点
保持事实不变
输出更专业的简历文本
给出简短修改建议
```

AI 禁止：

```text
编造公司名
编造实习经历
编造项目结果
编造奖项
编造分数、排名、GPA
编造技术栈
编造量化指标
```

核心原则：

```text
Rewrite, do not invent.
```

---

### 3.5 输出结果

生成结果页面展示：

```text
改写后的简历文本
修改建议 suggestions
一键复制按钮
重新生成按钮
```

输出结构建议：

```text
Education

Experience

Projects

Skills

Awards / Activities
```

如果原始简历中没有某些 section，可以省略。

第一版不需要：

```text
PDF 导出
DOCX 导出
在线编辑
保存历史版本
```

---

## 4. 品牌与文案方向

### 4.1 产品一句话

英文：

```text
Rewrite your resume for SWE, Quant, and Finance applications.
```

中文理解：

```text
根据目标职业方向，一键改写你的简历。
```

---

### 4.2 更 Gen Z 风格的表达

可以在 landing page 上使用：

```text
Your resume, but actually tailored.
```

```text
Turn one resume into multiple career-ready versions.
```

```text
Built for students applying to internships, spring weeks, and early-career roles.
```

```text
Stop rewriting your resume from scratch.
```

---

### 4.3 Hero Section 建议

标题：

```text
Zesume
```

副标题：

```text
AI resume rewriting for Gen Z applicants.
```

描述：

```text
Paste your resume, choose a career direction, and get a tailored version for SWE, Quant, or Finance applications.
```

按钮：

```text
Try Zesume
```

或者：

```text
Rewrite My Resume
```

---

## 5. 前端需求

### 5.1 技术栈

建议使用：

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
```

---

### 5.2 页面结构

第一版页面：

```text
/
Landing Page

/app
Zesume Resume Rewriter 主页面

/pricing
Pricing 页面，可以先做静态
```

登录可以暂时不做，后续再加。

---

### 5.3 `/app` 页面布局

桌面端左右两栏：

```text
------------------------------------------------
| Resume Input              | Generated Output |
| Template Selector         | Suggestions      |
| Tone Selector             | Copy Button      |
| Generate Button           | Regenerate       |
------------------------------------------------
```

移动端上下排列：

```text
Resume Input
↓
Template Selector
↓
Generate Button
↓
Generated Output
```

---

### 5.4 前端状态

```ts
type TargetTemplate = "software_engineering" | "quant" | "finance";
type Tone = "professional" | "concise" | "technical";

const [resumeText, setResumeText] = useState("");
const [targetTemplate, setTargetTemplate] =
  useState<TargetTemplate>("software_engineering");
const [tone, setTone] = useState<Tone>("professional");
const [isLoading, setIsLoading] = useState(false);
const [rewrittenResume, setRewrittenResume] = useState("");
const [suggestions, setSuggestions] = useState<string[]>([]);
const [error, setError] = useState<string | null>(null);
```

---

### 5.5 前端交互要求

Generate 按钮：

```text
输入为空时 disabled
loading 时 disabled
请求过程中显示 loading 状态
成功后展示结果
失败后展示错误信息
```

Copy 按钮：

```text
点击后复制 rewrittenResume
复制成功后显示 “Copied”
```

Regenerate 按钮：

```text
使用相同输入重新调用接口
loading 时 disabled
```

---

## 6. 后端需求

### 6.1 后端结构

使用 Next.js Route Handler。

核心接口：

```http
POST /api/resume/rewrite
```

请求 body：

```json
{
  "resumeText": "user resume text",
  "targetTemplate": "software_engineering",
  "tone": "professional"
}
```

成功返回：

```json
{
  "success": true,
  "data": {
    "rewrittenResume": "rewritten resume text",
    "suggestions": [
      "Add measurable impact to project bullets.",
      "Separate technical skills into languages, frameworks, and tools."
    ],
    "provider": "mock",
    "model": "mock-resume-rewriter"
  }
}
```

失败返回：

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Resume text is required."
  }
}
```

---

### 6.2 输入校验

后端需要校验：

```text
resumeText 必须存在
resumeText 长度不能太短
resumeText 长度不能超过限制
targetTemplate 必须是允许值
tone 必须是允许值
```

建议限制：

```ts
const MIN_RESUME_LENGTH = 200;
const MAX_RESUME_LENGTH = 5000;
```

---

## 7. AI Provider 设计

### 7.1 不绑定单一模型

Zesume 不应该把业务代码和某个模型供应商绑定死。

需要设计统一 AI Provider 接口，方便切换：

```text
Mock
Gemini
OpenAI
Groq
OpenRouter
```

建议目录结构：

```text
src/
  lib/
    ai/
      index.ts
      types.ts
      prompts.ts
      providers/
        mock.ts
        gemini.ts
        openai.ts
        groq.ts
        openrouter.ts
```

第一版必须完成：

```text
mock.ts
gemini.ts
```

其他 provider 可以先预留文件，不一定马上实现。

---

### 7.2 统一类型定义

`src/lib/ai/types.ts`

```ts
export type TargetTemplate =
  | "software_engineering"
  | "quant"
  | "finance";

export type Tone =
  | "professional"
  | "concise"
  | "technical";

export type RewriteResumeInput = {
  resumeText: string;
  targetTemplate: TargetTemplate;
  tone: Tone;
};

export type RewriteResumeOutput = {
  rewrittenResume: string;
  suggestions: string[];
  provider: string;
  model: string;
};
```

---

### 7.3 统一调用入口

`src/lib/ai/index.ts`

业务代码只调用：

```ts
const result = await rewriteResume({
  resumeText,
  targetTemplate,
  tone,
});
```

不要在 API route 里直接写 Gemini / OpenAI 的调用逻辑。

---

### 7.4 环境变量

`.env.local`

```env
AI_PROVIDER=mock
AI_MODEL=mock-resume-rewriter

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

后续上线可扩展：

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

GROQ_API_KEY=
GROQ_MODEL=

OPENROUTER_API_KEY=
OPENROUTER_MODEL=
```

---

### 7.5 Provider 选择逻辑

根据 `AI_PROVIDER` 选择不同 provider：

```ts
switch (process.env.AI_PROVIDER) {
  case "gemini":
    return rewriteWithGemini(input);
  case "mock":
  default:
    return rewriteWithMock(input);
}
```

第一阶段开发时使用：

```env
AI_PROVIDER=mock
```

接入 Gemini 后切换为：

```env
AI_PROVIDER=gemini
```

---

## 8. Mock Provider 需求

Mock Provider 用于在不调用真实 API 的情况下开发前后端。

`mock.ts` 返回固定结果，但要根据模板稍微变化。

示例返回：

```ts
export async function rewriteWithMock(
  input: RewriteResumeInput
): Promise<RewriteResumeOutput> {
  return {
    rewrittenResume: `EDUCATION

Imperial College London
BSc Computer Science

PROJECTS

Zesume
- Built a lightweight resume rewriting workflow with template selection and copyable output.
- Implemented structured prompt logic to adapt resume content for ${input.targetTemplate} applications.

SKILLS

Python, TypeScript, React, Next.js, Tailwind CSS`,
    suggestions: [
      "Add measurable impact where possible.",
      "Keep each bullet concise and action-oriented.",
      "Avoid adding facts that are not in the original resume."
    ],
    provider: "mock",
    model: "mock-resume-rewriter"
  };
}
```

Mock Provider 的作用：

```text
前端可以立即开发
不消耗 API
不需要真实 key
可以测试 loading、error、copy、layout
```

---

## 9. Gemini Provider 需求

### 9.1 使用场景

Gemini Provider 用于真实测试 AI 改写效果。

注意：

```text
Gemini 免费层适合开发测试
不建议正式上线长期依赖免费层
测试时尽量不要输入真实敏感简历
API key 必须只放在后端环境变量里
```

---

### 9.2 Gemini 调用要求

`gemini.ts` 需要：

```text
读取 GEMINI_API_KEY
读取 GEMINI_MODEL
构造 prompt
调用 Gemini API
解析 JSON 输出
返回统一格式 RewriteResumeOutput
```

如果 Gemini 返回不是合法 JSON，要做 fallback 处理。

---

## 10. Prompt 设计

### 10.1 System Prompt

```text
You are a professional resume editor for students and early-career applicants.

Your task is to rewrite the user's resume according to the selected career template.

Rules:
1. Rewrite, do not invent.
2. Do not add companies, internships, awards, grades, rankings, technologies, metrics, or achievements that the user did not provide.
3. Preserve the user's original facts.
4. Improve clarity, conciseness, structure, and professional tone.
5. Use strong action verbs.
6. Keep bullet points concise.
7. If important information is missing, mention it in suggestions instead of inventing it.
8. Return only valid JSON.
```

---

### 10.2 Template Prompt

根据 `targetTemplate` 拼接不同模板说明。

#### Software Engineering

```text
Target template: Software Engineering Internship Resume.

Emphasize:
- programming languages
- technical implementation
- software projects
- full-stack, backend, frontend, deployment, or systems experience
- teamwork and engineering problem-solving

Style:
- concise action-oriented bullet points
- clear technology stack
- specific implementation details
- no exaggerated claims
```

#### Quant

```text
Target template: Quant / Trading / Research Resume.

Emphasize:
- mathematics
- statistics and probability
- Python, C++, pandas, NumPy
- data analysis
- backtesting or financial analysis if provided
- quantitative reasoning

Style:
- analytical and precise
- highlight data, models, metrics, and research process
- do not invent performance metrics
- suggest missing metrics separately
```

#### Finance / Spring Week

```text
Target template: Finance / Spring Week Resume.

Emphasize:
- leadership
- teamwork
- communication
- commercial awareness
- initiative
- academic excellence
- extracurricular achievements

Style:
- professional and concise
- reduce excessive technical detail
- focus on responsibility, impact, collaboration, and results
- suitable for investment banking, consulting, and spring week applications
```

---

### 10.3 Tone Prompt

根据 `tone` 添加：

#### professional

```text
Tone: professional, polished, and suitable for internship applications.
```

#### concise

```text
Tone: concise and direct. Keep bullet points short and avoid unnecessary wording.
```

#### technical

```text
Tone: more technical. Emphasize tools, implementation details, and technical problem-solving.
```

---

### 10.4 输出格式

要求模型只返回 JSON：

```json
{
  "rewrittenResume": "string",
  "suggestions": ["string", "string"]
}
```

不要返回 markdown explanation，不要返回额外文本。

---

## 11. 错误处理

需要处理以下错误：

### 11.1 输入错误

```text
INVALID_INPUT
```

场景：

```text
resumeText 为空
resumeText 太短
resumeText 太长
targetTemplate 不合法
tone 不合法
```

---

### 11.2 AI 配置错误

```text
AI_CONFIG_ERROR
```

场景：

```text
AI_PROVIDER=gemini 但没有 GEMINI_API_KEY
provider 不存在
model 未配置
```

---

### 11.3 AI 调用失败

```text
AI_REQUEST_FAILED
```

场景：

```text
Gemini 请求失败
模型限速
网络错误
返回格式不合法
```

---

### 11.4 通用错误

```text
INTERNAL_SERVER_ERROR
```

不要把完整错误堆栈暴露给前端。

---

## 12. 收费逻辑设计

第一版开发阶段不需要真正接支付，但代码结构要方便以后接入。

### 12.1 免费测试阶段

开发阶段：

```text
不登录
不收费
使用 mock 或 Gemini 免费层
前端限制输入长度
后端也限制输入长度
```

---

### 12.2 正式上线后的 Freemium 设计

Free Plan：

```text
每天 3 次生成
每次最多 3,000 字符
3 个基础模板
不保存历史版本
```

Starter Plan：

```text
$5 / month
每月 100 次生成
每次最多 8,000 字符
保存历史版本
无水印
```

Pro Plan：

```text
暂时不做
Pricing 页面可以显示 Coming Soon
```

---

### 12.3 后续需要预留的数据结构

未来需要：

```text
users
usage_logs
subscriptions
resume_generations
```

但 MVP 阶段可以先不接数据库。

第一版先用无数据库版本完成核心功能。

---

## 13. 开发阶段优先级

### Phase 1：无 AI 前端 Demo

目标：页面和交互跑通。

需要完成：

```text
Landing Page
/app 页面
文本输入框
模板选择
tone 选择
Generate 按钮
Output 区域
Copy 按钮
Mock Provider
POST /api/resume/rewrite
```

使用：

```env
AI_PROVIDER=mock
```

---

### Phase 2：接入 Gemini

目标：真实 AI 改写。

需要完成：

```text
Gemini Provider
Prompt 拼接
JSON 输出解析
错误处理
loading 状态
输入长度限制
```

使用：

```env
AI_PROVIDER=gemini
```

---

### Phase 3：产品化细节

目标：让 demo 更像产品。

需要完成：

```text
Pricing 静态页面
更好的 landing page copy
Regenerate 按钮
Suggestions 展示
字数统计
输入过长提示
移动端适配
```

---

### Phase 4：正式上线前

未来再做：

```text
登录
数据库
每日次数限制
Stripe 支付
保存历史版本
OpenAI Provider
OpenRouter Provider
Groq Provider
```

---

## 14. 不做的功能

v1 不做：

```text
PDF 上传
DOCX 上传
PDF 导出
在线简历编辑器
ATS 打分
岗位推荐
JD 匹配
模拟面试
自动投递
LinkedIn 导入
浏览器插件
```

---

## 15. 验收标准

### Phase 1 验收

```text
1. 用户可以进入 /app
2. 用户可以粘贴简历文本
3. 用户可以选择模板
4. 用户可以选择 tone
5. 点击 Generate 后能调用后端
6. Mock Provider 能返回结果
7. 页面能展示 rewrittenResume 和 suggestions
8. Copy 按钮可以复制结果
```

### Phase 2 验收

```text
1. 设置 AI_PROVIDER=gemini 后可以调用 Gemini
2. Gemini 能根据不同模板生成不同风格结果
3. 输出结果不能编造明显事实
4. 如果 AI 返回错误，前端有清晰提示
5. API key 不暴露在前端
```

---

## 16. 最终产品定义

Zesume v1 = Gen Z Resume Rewriter。

一句话定位：

```text
AI resume rewriting for Gen Z applicants.
```

更具体的定位：

```text
Rewrite your resume for SWE, Quant, and Finance applications using career-specific templates.
```

中文理解：

```text
根据目标职业方向，一键把你的简历改写成更适合申请的版本。
```

Zesume 第一版的核心目标不是做完整职业规划工具，而是先解决一个非常具体的学生求职问题：

> 我已经有一份简历，但我不知道怎么把它改成适合 SWE、Quant 或 Finance 申请的版本。
