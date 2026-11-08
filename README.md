# 织梦 DreamWeave

**AI 辅助的个性化编程学习平台**

> 以练习反馈为基础，以启发式 AI 辅导为支持，探索更具针对性和互动性的编程学习体验。

## 一、项目概述

织梦（DreamWeave）是一款面向编程学习场景的 Web 学习平台，采用 **Java + Spring Boot** 构建后端服务，以 **HTML、CSS 和原生 JavaScript** 实现前端交互，并接入 **DeepSeek API** 提供 AI 学习辅助能力。

平台将知识练习、AI 导师、智能出题、编程题反馈、错题记录与学习画像结合起来：学习者可以进行练习、查看反馈，并在遇到问题时通过 AI 对话获得启发式引导。项目侧重于将学习过程中的答题数据转化为可供辅导参考的学习信息。

## 二、核心功能

| 功能模块 | 功能说明 |
| --- | --- |
| AI 启发式导师 | 结合对话上下文与学习画像，采用提问、提示等方式引导学习者思考，而非单纯给出答案。 |
| 智能练习 | 支持本地题库练习与通过 DeepSeek API 动态生成练习题。 |
| 编程题 AI 反馈 | 对学习者提交的代码进行分析，给出问题提示和改进建议。此功能为 AI 文本反馈，**不等同于在安全沙箱中编译或执行代码**。 |
| 学习画像 | 依据练习表现整理正确率、薄弱知识点等信息，为 AI 辅导提供学情参考。 |
| 错题与进度记录 | 在浏览器本地保存部分练习数据与错题信息，方便回顾学习情况。 |
| 交互与视觉体验 | 使用 Canvas 粒子特效、WebGL/GLSL 动态背景，以及基于浏览器能力的语音输入。 |

## 三、技术架构

### 3.1 技术选型

| 层次 | 技术与实现 |
| --- | --- |
| 后端语言 | Java 25 |
| 后端框架 | Spring Boot 4.1.2、Spring Web MVC |
| 项目构建 | Maven、Maven Wrapper |
| 前端 | HTML5、CSS3、原生 JavaScript |
| AI 能力 | DeepSeek API，通过 Java 后端调用 |
| 数据处理 | Java 后端处理 AI 请求与响应；浏览器端使用 localStorage 保存部分学习记录 |
| 交互效果 | Canvas、WebGL/GLSL、Web Speech API（取决于浏览器支持情况） |
| 测试依赖 | Spring Boot Web MVC Test |

以上版本以项目 `pom.xml` 为准。项目未声明使用 Vue、React、MySQL 或 Redis 等技术，请勿将它们视为运行前提。

### 3.2 主要工作流程

```text
学习者（浏览器）
    │
    ├── 页面交互、练习作答、学习记录
    │       └── 浏览器 localStorage（部分学习数据）
    │
    └── AI 请求
            ↓
       Spring Boot 后端接口
            ↓
       DeepSeekService
            ↓
         DeepSeek API
            ↓
       AI 回复 / 题目 / 代码反馈
            ↓
         浏览器展示
```

AI 导师会使用学习画像作为辅导上下文；这不代表项目已经实现独立的模型训练、完整 RAG 知识库或云端学习档案系统。

## 四、项目目录

```text
DreamWeave/                  # 展示名称；实际仓库目录为 demo4
├── .mvn/wrapper/             # Maven Wrapper 配置
├── .gitattributes            # Git 换行符规则
├── .gitignore                # Git 忽略规则
├── mvnw                      # macOS / Linux 启动脚本
├── mvnw.cmd                  # Windows 启动脚本
├── pom.xml                   # Maven 项目与依赖配置
├── README.md                 # 项目说明
├── docs/
│   └── 织梦DreamWeave技术全案.pdf
├── src/
│   ├── main/
│   │   ├── java/com/example/demo/
│   │   │   ├── AiMentorController.java
│   │   │   ├── DeepSeekController.java
│   │   │   ├── DeepSeekService.java
│   │   │   ├── Demo4Application.java
│   │   │   ├── HelloController.java
│   │   │   └── config/Utf8ContentTypeConfig.java
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── application-example.properties  # 无密钥配置示例
│   │       └── static/
│   │           ├── index.html
│   │           ├── style.css
│   │           ├── script.js
│   │           ├── effects.js
│   │           └── shader.js
│   └── test/
│       └── java/com/example/demo/
│           └── Demo4ApplicationTests.java
└── test.http                 # 本地 HTTP 请求示例
```

## 五、本地部署与运行

> 此节提供项目配置与启动步骤。不同电脑的 JDK、网络及环境变量设置可能不同；正式提交前建议在实际开发环境中验证。

### 5.1 环境要求

- **JDK 25**（与 `pom.xml` 中的 `java.version` 一致）
- 可使用 **IntelliJ IDEA** 或命令行运行
- 可访问 Maven 依赖仓库的网络环境
- 如需使用 AI 功能，需准备有效的 **DeepSeek API Key** 并保证网络可访问其接口
- 现代浏览器；语音输入与 WebGL 效果可能受浏览器及设备限制

在终端检查 Java 版本：

```powershell
java -version
```

### 5.2 配置 DeepSeek API

项目的 `src/main/resources/application.properties` 使用环境变量读取密钥，示例如下：

```properties
deepseek.api.key=${DEEPSEEK_API_KEY}
deepseek.api.url=https://api.deepseek.com/chat/completions
```

**Windows PowerShell** 中，可为当前终端会话临时设置环境变量：

```powershell
$env:DEEPSEEK_API_KEY = "你的DeepSeek_API_Key"
```

该变量仅对当前 PowerShell 会话及其启动的子进程生效。若从 IDEA 的运行按钮启动项目，应在 IDEA 对应的运行配置中设置 `DEEPSEEK_API_KEY`。

**安全提示：** 请勿将真实 API Key 写进源码、`README.md`、截图或公开 Git 提交历史。公开仓库只应保留环境变量引用或不包含真实密钥的配置示例。

### 5.3 启动项目

在包含 `pom.xml` 的项目根目录打开终端。

Windows PowerShell：

```powershell
.\mvnw.cmd spring-boot:run
```

在未修改默认服务端口且启动成功的情况下，浏览器通常可以访问：

```text
http://localhost:8080/
```

首次运行可能需要下载 Maven 依赖；若端口被占用、网络不可用或环境变量未配置，需根据终端提示排查。

### 5.4 执行测试

```powershell
.\mvnw.cmd test
```

该命令用于执行项目已有测试；**不表示本 README 已对所有功能完成自动化验证**。

## 六、设计特点与实现边界

1. **练习与辅导联动：** 学习画像从实际练习数据中整理薄弱知识点，并作为 AI 导师的上下文信息。
2. **启发式教学：** AI 导师侧重引导学习者理解问题、形成思路。
3. **本地题库与 AI 出题结合：** 兼顾现有练习内容与动态生成题目的灵活性。
4. **原生 Web 交互：** 通过 Canvas、WebGL/GLSL 等浏览器技术实现动态视觉效果。
5. **轻量化学习记录：** 部分进度和错题使用浏览器 localStorage 保存，不依赖已声明之外的数据库。

**功能边界：** AI 反馈可能出现错误；编程题反馈不等于真实代码运行结果；本地学习记录可能因清理浏览器数据而丢失；语音功能受浏览器权限与兼容性影响。项目中如存在演示用登录逻辑，不应将其理解为已完成生产级身份认证。

## 七、演示与评审说明

项目演示视频可重点展示：平台首页与交互效果、知识练习与答题反馈、AI 导师对话、AI 动态出题、编程题 AI 反馈、学习画像及错题记录。

演示视频用于直观呈现功能，**本仓库仍提供源代码、项目结构、依赖配置和启动说明**，方便评审理解技术实现。实际演示内容应以当前可正常使用的功能为准。

### 技术文档

[点击查看织梦 DreamWeave 技术全案](docs/织梦DreamWeave技术全案.pdf)

### 项目演示视频

[点击观看织梦 DreamWeave 项目演示视频](https://www.alipan.com/s/G4x6v1PFggX) 提取码：ys35

## 八、团队信息

- **团队名称：** 柔帧物语
- **项目负责人：** 刘媛
- **团队成员：** 康佳艺、张茹艳

## 九、代码管理与安全

- 使用 Git 管理源代码，并保留真实的提交记录。
- `.gitignore` 排除 IDE 配置、构建产物以及 Claude Code 本地设置文件等不宜提交的内容。
- `DEEPSEEK_API_KEY` 应由运行环境提供，不应进入公开仓库。
- 提交前请检查配置文件、测试请求、源码和历史提交中是否包含凭据或其他敏感信息。
- 当前未声明开源许可证；公开展示代码不自动授予第三方复制、修改或再分发的许可。

---

**织梦 DreamWeave · 让编程学习更有方向，让每一次练习都有反馈。**
