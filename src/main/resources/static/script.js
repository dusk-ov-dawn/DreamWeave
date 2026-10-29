// ==========================
// 织梦 DreamWeave
// 前端交互演示版本
// ==========================

let currentUser = null;
let isRegister = false;
let currentQuestion = null;
let selectedAnswer = null;
let answered = false;
let trainingMode = false;
let wrongPracticeMode = false;
let wrongPracticeQueue = [];
let wrongPracticeIndex = 0;

// AI 出题相关状态
let aiChoiceMode = false;
let aiBusy = false;
let currentCodingQuestion = null;
let currentCodingLanguage = "Java";
let currentAITopic = null;

const languageNames = {
    java: "Java",
    python: "Python",
    c: "C",
    cpp: "C++",
    javascript: "JavaScript"
};

function selectedLanguage() {
    const value = document.getElementById("questionLanguageSelect").value;
    return {
        code: value,
        name: languageNames[value] || "Java"
    };
}

// ===== 内置题库 =====

const questions = [
    {
        topic: "变量",
        title: "Java 中声明整数变量，哪种写法正确？",
        options: ["int age = 18;", "integer age = 18;", "age int = 18;", "num age = 18;"],
        answer: 0,
        explain: "Java 使用 int 关键字声明整数类型变量。"
    },
    {
        topic: "变量",
        title: "Java 中表示真假值的数据类型是？",
        options: ["String", "boolean", "int", "double"],
        answer: 1,
        explain: "boolean 类型用于表示 true 或 false。"
    },
    {
        topic: "条件",
        title: "Java 中比较两个基本类型整数是否相等，使用哪个运算符？",
        options: ["=", "==", "!=", ">="],
        answer: 1,
        explain: "== 表示比较是否相等，= 表示赋值。"
    },
    {
        topic: "条件",
        title: "if (score >= 60) 表示什么？",
        options: ["小于60", "等于0", "大于等于60", "不等于60"],
        answer: 2,
        explain: ">= 表示大于或等于。"
    },
    {
        topic: "循环",
        title: "for (int i = 0; i < 5; i++) 循环执行几次？",
        options: ["4次", "5次", "6次", "无限次"],
        answer: 1,
        explain: "i 从 0 到 4，一共执行 5 次。"
    },
    {
        topic: "循环",
        title: "哪个关键字可以立即结束当前循环？",
        options: ["continue", "skip", "break", "next"],
        answer: 2,
        explain: "break 可以立即结束当前循环。"
    },
    {
        topic: "数组",
        title: "Java 数组的第一个元素下标是多少？",
        options: ["1", "0", "-1", "2"],
        answer: 1,
        explain: "Java 数组的下标从 0 开始。"
    },
    {
        topic: "数组",
        title: "获取 Java 数组 arr 的长度使用什么？",
        options: ["arr.size()", "arr.length()", "arr.length", "length(arr)"],
        answer: 2,
        explain: "Java 数组使用 length 属性获取长度。"
    },
    {
        topic: "面向对象",
        title: "Java 中创建对象通常使用哪个关键字？",
        options: ["class", "new", "object", "create"],
        answer: 1,
        explain: "new 关键字用于创建对象实例。"
    },
    {
        topic: "面向对象",
        title: "Java 中定义类使用哪个关键字？",
        options: ["function", "define", "class", "struct"],
        answer: 2,
        explain: "class 用于定义 Java 类。"
    }
];

const topics = ["变量", "条件", "循环", "数组", "面向对象"];

const titles = {
    home: "学习工作台",
    diagnosis: "代码诊断",
    knowledge: "知识点分析",
    tutor: "AI 辅导教师",
    practice: "智能练习",
    training: "个性化训练",
    report: "学习成长报告"
};

// ===== 用户数据 =====

function getUsers() {
    return JSON.parse(localStorage.getItem("dreamweave_users") || "{}");
}

function getData() {
    const key = "dreamweave_data_" + currentUser;
    const saved = localStorage.getItem(key);

    if (saved) {
        return JSON.parse(saved);
    }

    return {
        total: 0,
        correct: 0,
        history: [],
        minutes: {}
    };
}

function saveData(data) {
    localStorage.setItem(
        "dreamweave_data_" + currentUser,
        JSON.stringify(data)
    );
}

function today() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
}

// ===== 登录注册 =====

document.getElementById("switchBtn").addEventListener("click", function (event) {
    event.preventDefault();

    isRegister = !isRegister;

    document.getElementById("formTitle").textContent =
        isRegister ? "创建你的账号" : "欢迎回来";

    document.getElementById("formSubtitle").textContent =
        isRegister ? "加入织梦，开启你的编程成长之旅" : "登录你的织梦账号，继续今天的编程之旅";

    document.getElementById("submitBtn").textContent =
        isRegister ? "立即注册 →" : "登录织梦 →";

    document.getElementById("switchText").textContent =
        isRegister ? "已经有账号？" : "还没有账号？";

    document.getElementById("switchBtn").textContent =
        isRegister ? "返回登录" : "立即注册";

    document.getElementById("confirmGroup").hidden = !isRegister;
    document.getElementById("confirmPassword").required = isRegister;
});

function togglePassword() {
    const input = document.getElementById("password");
    const button = document.querySelector(".password-box button");

    if (input.type === "password") {
        input.type = "text";
        button.textContent = "隐藏";
    } else {
        input.type = "password";
        button.textContent = "显示";
    }
}

document.getElementById("authForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!username || !password) {
        alert("请输入用户名和密码！");
        return;
    }

    const users = getUsers();

    if (isRegister) {
        const confirm = document.getElementById("confirmPassword").value;

        if (username.length < 3) {
            alert("用户名至少需要3位！");
            return;
        }

        if (password.length < 6) {
            alert("密码至少需要6位！");
            return;
        }

        if (password !== confirm) {
            alert("两次输入的密码不一致！");
            return;
        }

        if (Object.prototype.hasOwnProperty.call(users, username)) {
            alert("用户名已经存在！");
            return;
        }

        // 仅供本地演示，不要使用真实密码
        users[username] = password;

        localStorage.setItem("dreamweave_users", JSON.stringify(users));

        alert("注册成功！现在可以登录啦！");

        document.getElementById("switchBtn").click();
        document.getElementById("password").value = "";
        document.getElementById("confirmPassword").value = "";

        return;
    }

    if (!Object.prototype.hasOwnProperty.call(users, username) ||
        users[username] !== password) {
        alert("用户名或密码错误！");
        return;
    }

    currentUser = username;
    sessionStorage.setItem("dreamweave_current_user", username);

    enterApp();
});

function enterApp() {
    document.getElementById("loginPage").hidden = true;
    document.getElementById("app").hidden = false;

    document.getElementById("displayUsername").textContent = currentUser;

    showPage("home");
}

document.getElementById("logoutBtn").addEventListener("click", function () {
    sessionStorage.removeItem("dreamweave_current_user");
    currentUser = null;

    resetTutorSession();

    document.getElementById("app").hidden = true;
    document.getElementById("loginPage").hidden = false;
    document.getElementById("password").value = "";
});

// ===== 页面切换 =====

function showPage(id) {
    if (id !== "tutor" && chatRecognition) {
        abortChatVoiceInput();
    }

    document.querySelectorAll(".page").forEach(function (page) {
        page.classList.remove("active");
    });

    document.getElementById(id).classList.add("active");

    document.querySelectorAll(".nav-btn").forEach(function (button) {
        button.classList.toggle(
            "active",
            button.dataset.page === id
        );
    });

    document.getElementById("pageTitle").textContent = titles[id];

    if (id === "home") updateDashboard();
    if (id === "knowledge") renderKnowledge();
    if (id === "tutor") renderTutorPage();
    if (id === "training") renderTraining();
    if (id === "report") renderReport();
}

document.querySelectorAll("[data-page]").forEach(function (button) {
    button.addEventListener("click", function () {
        showPage(button.dataset.page);
    });
});

document.querySelectorAll("[data-go]").forEach(function (element) {
    element.addEventListener("click", function () {
        showPage(element.dataset.go);
    });
});

// ===== 代码诊断 =====

const examples = {
    java: `public class Main {
    public static void main(String[] args) {
        System.out.printin("Hello World");
    }
}`,
    python: `for i in range(5):
    print("Hello World")`,
    cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello World" << endl;
    return 0;
}`
};

document.getElementById("exampleBtn").addEventListener("click", function () {
    const language = document.getElementById("languageSelect").value;
    document.getElementById("codeInput").value = examples[language];
});

document.getElementById("clearBtn").addEventListener("click", function () {
    document.getElementById("codeInput").value = "";
    document.getElementById("diagnosisResult").hidden = true;
});


document.getElementById("diagnoseBtn").addEventListener("click", async function () {
    const code = document.getElementById("codeInput").value;
    const language = document.getElementById("languageSelect").value;
    const result = document.getElementById("diagnosisResult");
    const content = document.getElementById("diagnosisContent");
    const button = document.getElementById("diagnoseBtn");

    if (!code.trim()) {
        alert("请先输入代码！");
        return;
    }

    result.hidden = false;

    if (typeof window.dreamweaveReveal === "function") {
        window.dreamweaveReveal(result);
    }

    content.textContent = "DeepSeek 正在分析代码，请稍候……";
    button.disabled = true;

    try {
        const response = await fetch("/api/ai/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                question:
                    "请作为织梦AI编程导师，诊断下面的" +
                    language + "代码。\n" +
                    "请按以下格式回答：\n" +
                    "1. 代码存在的问题\n" +
                    "2. 错误原因\n" +
                    "3. 涉及的知识点\n" +
                    "4. 修改建议\n" +
                    "5. 修正后的参考代码\n\n" +
                    "学生代码：\n" + code
            })
        });

        if (!response.ok) {
            throw new Error("AI 接口返回错误：" + response.status);
        }

        const data = await response.json();

        const answer = data.choices?.[0]?.message?.content;

        if (!answer) {
            throw new Error("DeepSeek 没有返回有效内容");
        }

        content.textContent = answer;

    } catch (error) {
        console.error("AI 诊断失败：", error);
        content.textContent =
            "AI 诊断失败，请检查 Spring Boot 是否运行、DeepSeek API 是否可用。\n" +
            "错误信息：" + error.message;
    } finally {
        button.disabled = false;
    }
});


// ===== 智能练习 =====

function normalizeQuestionTitle(title) {
    return String(title || "")
        .toLowerCase()
        .replace(/[\s，。！？、；：,.!?;:"'“”‘’（）()【】\[\]]/g, "");
}

function localQuestionWithMeta(question) {
    return Object.assign({}, question, {
        questionKey: "local:" + normalizeQuestionTitle(question.title),
        source: "本地题库"
    });
}

function shuffleQuestions(list) {
    const copy = list.slice();

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = copy[i];

        copy[i] = copy[j];
        copy[j] = temp;
    }

    return copy;
}

function dedupeQuestions(list) {
    const seen = new Set();

    return list.filter(function (question) {
        const key = question.questionKey || normalizeQuestionTitle(question.title);

        if (!key || seen.has(key)) return false;

        seen.add(key);
        return true;
    });
}

function getWrongQuestionBank() {
    const data = getData();
    const latestByKey = new Map();
    const legacyWrongTopics = new Map();

    data.history.forEach(function (item) {
        if (item.questionKey) {
            latestByKey.set(item.questionKey, item);
            return;
        }

        if (!item.correct) {
            legacyWrongTopics.set(
                item.topic,
                (legacyWrongTopics.get(item.topic) || 0) + 1
            );
        }
    });

    const exact = [];

    latestByKey.forEach(function (item) {
        if (item.correct || !item.question) return;
        if (!Array.isArray(item.question.options) || item.question.options.length < 2) return;

        exact.push(Object.assign({}, item.question, {
            questionKey: item.questionKey || item.question.questionKey,
            source: item.question.source || "历史错题"
        }));
    });

    const exactQuestions = dedupeQuestions(exact);

    if (exactQuestions.length) {
        return {
            questions: exactQuestions,
            exactCount: exactQuestions.length,
            legacyUsed: false
        };
    }

    // 旧版数据只保存了知识点，无法还原原题，按错题知识点从本地题库整理巩固题
    const fallback = [];

    legacyWrongTopics.forEach(function (count, topic) {
        questions.forEach(function (question) {
            if (question.topic === topic) {
                fallback.push(localQuestionWithMeta(question));
            }
        });
    });

    const fallbackQuestions = dedupeQuestions(fallback);

    return {
        questions: fallbackQuestions,
        exactCount: 0,
        legacyUsed: fallbackQuestions.length > 0
    };
}

function startWrongQuestionPractice() {
    const bank = getWrongQuestionBank();

    if (!bank.questions.length) {
        alert("还没有可练习的历史错题。\n\n先完成几道练习题，答错的题目会自动加入错题本。");
        return;
    }

    wrongPracticeMode = true;
    trainingMode = false;
    aiChoiceMode = false;
    wrongPracticeQueue = shuffleQuestions(bank.questions);
    wrongPracticeIndex = 0;
    currentQuestion = wrongPracticeQueue[0];
    selectedAnswer = null;
    answered = false;

    showPage("practice");

    document.getElementById("codingTaskCard").hidden = true;
    document.getElementById("questionCard").hidden = false;

    renderQuestionCard();

    const questionCard = document.getElementById("questionCard");
    questionCard.scrollIntoView({ behavior: "smooth", block: "start" });

    if (bank.legacyUsed) {
        window.setTimeout(function () {
            alert(
                "检测到旧版错题记录只保存了知识点，已按这些错题知识点整理出 " +
                bank.questions.length +
                " 道巩固题。\n\n之后答错的题会保存原题。"
            );
        }, 0);
    }
}

function getWeakTopic() {
    const data = getData();

    const mistakes = {};

    data.history.forEach(function (item) {
        if (!item.correct) {
            mistakes[item.topic] = (mistakes[item.topic] || 0) + 1;
        }
    });

    const sorted = Object.keys(mistakes).sort(function (a, b) {
        return mistakes[b] - mistakes[a];
    });

    return sorted.length ? sorted[0] : null;
}

function startPractice(topic, isTraining) {
    trainingMode = isTraining;
    aiChoiceMode = false;
    wrongPracticeMode = false;
    wrongPracticeQueue = [];
    wrongPracticeIndex = 0;

    let pool = questions.filter(function (question) {
        return topic === "all" || question.topic === topic;
    });

    if (pool.length === 0) {
        pool = questions;
    }

    const recentKeys = new Set();

    if (currentQuestion && currentQuestion.questionKey) {
        recentKeys.add(currentQuestion.questionKey);
    }

    getData().history.slice(-20).forEach(function (item) {
        if (item.questionKey) {
            recentKeys.add(item.questionKey);
        }
    });

    const freshPool = pool.filter(function (question) {
        return !recentKeys.has("local:" + normalizeQuestionTitle(question.title));
    });

    if (freshPool.length) {
        pool = freshPool;
    }

    currentQuestion = localQuestionWithMeta(
        pool[Math.floor(Math.random() * pool.length)]
    );
    selectedAnswer = null;
    answered = false;

    document.getElementById("codingTaskCard").hidden = true;
    renderQuestionCard();
}

function renderQuestionCard() {
    document.getElementById("questionCard").hidden = false;

    if (typeof window.dreamweaveReveal === "function") {
        window.dreamweaveReveal(document.getElementById("questionCard"));
    }

    let topicText = currentQuestion.topic +
        (currentQuestion.language ? " · " + currentQuestion.language : "");

    if (wrongPracticeMode) {
        topicText = "错题巩固 · " + topicText +
            " · " + (wrongPracticeIndex + 1) + "/" + wrongPracticeQueue.length;
    }

    document.getElementById("questionTopic").textContent = topicText;

    document.getElementById("questionTitle").textContent =
        currentQuestion.title;

    document.getElementById("answerResult").hidden = true;
    document.getElementById("answerResult").textContent = "";
    document.getElementById("nextQuestionBtn").hidden = true;
    document.getElementById("submitAnswerBtn").hidden = false;

    const box = document.getElementById("optionsBox");
    box.innerHTML = "";

    currentQuestion.options.forEach(function (option, index) {
        const button = document.createElement("button");

        button.className = "option-btn";
        button.textContent =
            String.fromCharCode(65 + index) + ". " + option;

        button.addEventListener("click", function () {
            if (answered) return;

            selectedAnswer = index;

            document.querySelectorAll(".option-btn").forEach(function (item) {
                item.classList.remove("selected");
            });

            button.classList.add("selected");
        });

        box.appendChild(button);
    });
}

document.getElementById("startPracticeBtn").addEventListener("click", function () {
    loadAIChoice();
});

document.getElementById("submitAnswerBtn").addEventListener("click", function () {
    if (!currentQuestion || answered) return;

    if (selectedAnswer === null) {
        alert("请先选择答案！");
        return;
    }

    answered = true;

    const correct = selectedAnswer === currentQuestion.answer;
    const data = getData();
    const questionKey = currentQuestion.questionKey ||
        (currentQuestion.source === "AI 出题" ? "ai:" : "local:") +
        normalizeQuestionTitle(currentQuestion.title);

    currentQuestion.questionKey = questionKey;

    data.total++;

    if (correct) {
        data.correct++;
    }

    const record = {
        topic: currentQuestion.topic,
        correct: correct,
        date: today(),
        questionKey: questionKey
    };

    if (!correct) {
        record.question = {
            questionKey: questionKey,
            topic: currentQuestion.topic || "综合",
            language: currentQuestion.language || "",
            title: currentQuestion.title || "",
            options: Array.isArray(currentQuestion.options)
                ? currentQuestion.options.slice()
                : [],
            answer: currentQuestion.answer,
            explain: currentQuestion.explain || "",
            source: currentQuestion.source || "练习题"
        };
    }

    data.history.push(record);

    saveData(data);

    const result = document.getElementById("answerResult");

    result.textContent =
        (correct ? "回答正确" : "回答错误") +
        "\n\n正确答案：" +
        currentQuestion.options[currentQuestion.answer] +
        "\n\n解析：" +
        currentQuestion.explain;

    result.hidden = false;

    if (correct && typeof window.dreamweaveConfetti === "function") {
        window.dreamweaveConfetti();
    }

    document.getElementById("submitAnswerBtn").hidden = true;

    const nextButton = document.getElementById("nextQuestionBtn");

    if (wrongPracticeMode) {
        nextButton.textContent = wrongPracticeQueue.length <= 1
            ? "再练一次 →"
            : (wrongPracticeIndex + 1 >= wrongPracticeQueue.length
                ? "重新练一轮 →"
                : "下一道错题 →");
    } else {
        nextButton.textContent = aiChoiceMode ? "换一道题 →" : "下一题 →";
    }

    nextButton.hidden = false;

    updateDashboard();
});

document.getElementById("nextQuestionBtn").addEventListener("click", function () {
    if (wrongPracticeMode) {
        wrongPracticeIndex++;

        if (wrongPracticeIndex >= wrongPracticeQueue.length) {
            wrongPracticeQueue = shuffleQuestions(wrongPracticeQueue);
            wrongPracticeIndex = 0;
        }

        currentQuestion = wrongPracticeQueue[wrongPracticeIndex];
        selectedAnswer = null;
        answered = false;
        renderQuestionCard();
        return;
    }

    if (aiChoiceMode) {
        loadAIChoice(currentAITopic);
        return;
    }

    let topic = document.getElementById("topicSelect").value;

    if (trainingMode) {
        topic = getWeakTopic() || "all";
    }

    startPractice(topic, trainingMode);
});

// ===== AI 出题（DeepSeek） =====

const RECENT_AI_QUESTION_PREFIX = "dreamweave_recent_ai_questions_";
const RECENT_AI_QUESTION_LIMIT = 16;

function getRecentAIQuestions(type) {
    if (!currentUser) return [];

    try {
        const list = JSON.parse(
            localStorage.getItem(RECENT_AI_QUESTION_PREFIX + currentUser) || "[]"
        );

        if (!Array.isArray(list)) return [];

        return list.filter(function (item) {
            return item &&
                typeof item.title === "string" &&
                item.title.trim() &&
                (!type || item.type === type);
        });
    } catch (error) {
        return [];
    }
}

function rememberAIQuestion(type, language, question) {
    if (!currentUser || !question || !question.title) return;

    const titleKey = normalizeQuestionTitle(question.title);
    const all = getRecentAIQuestions(type).filter(function (item) {
        return normalizeQuestionTitle(item.title) !== titleKey;
    });

    all.unshift({
        type: type,
        language: language,
        topic: question.topic || "",
        title: question.title,
        createdAt: Date.now()
    });

    try {
        localStorage.setItem(
            RECENT_AI_QUESTION_PREFIX + currentUser,
            JSON.stringify(all.slice(0, RECENT_AI_QUESTION_LIMIT))
        );
    } catch (error) {
        // 本地存储不可用时不影响出题
    }
}

async function fetchAIQuestion(type, language, topicOverride) {
    const topic = topicOverride || document.getElementById("topicSelect").value;
    const maxAttempts = 3;
    let excludedTitles = getRecentAIQuestions(type)
        .map(function (item) {
            return item.title;
        })
        .filter(Boolean)
        .slice(0, 10);
    const excludedKeys = new Set(excludedTitles.map(normalizeQuestionTitle));

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const response = await fetch("/api/ai/question", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                type: type,
                topic: topic,
                language: language,
                exclude: excludedTitles
            })
        });

        if (!response.ok) {
            let message = "AI 出题失败（" + response.status + "）";

            try {
                const data = await response.json();

                if (data && data.error === "Bad Request") {
                    message = "后端服务仍是旧版本（400 Bad Request），请重启 Spring Boot 后重试。";
                } else if (data && data.error) {
                    message = data.error;
                }
            } catch (ignore) {
                // 非 JSON 错误响应，使用默认提示
            }

            throw new Error(message);
        }

        const question = await response.json();
        const titleKey = normalizeQuestionTitle(question && question.title);

        if (titleKey && excludedKeys.has(titleKey)) {
            if (attempt < maxAttempts - 1) {
                if (!excludedTitles.some(function (title) {
                    return normalizeQuestionTitle(title) === titleKey;
                })) {
                    excludedTitles.unshift(question.title);
                    excludedTitles = excludedTitles.slice(0, 10);
                }

                excludedKeys.add(titleKey);
                continue;
            }

            throw new Error("AI 连续生成了重复题目，请再点一次换题");
        }

        rememberAIQuestion(type, language, question);
        return question;
    }

    throw new Error("AI 出题失败，请稍后重试");
}

async function loadAIChoice(topicOverride) {
    if (aiBusy) return;

    aiBusy = true;
    aiChoiceMode = true;
    trainingMode = false;
    wrongPracticeMode = false;
    wrongPracticeQueue = [];
    wrongPracticeIndex = 0;
    currentAITopic = topicOverride || null;

    document.getElementById("codingTaskCard").hidden = true;
    document.getElementById("questionCard").hidden = false;
    document.getElementById("questionTopic").textContent = "DeepSeek 出题";
    document.getElementById("questionTitle").textContent =
        "正在为你生成选择题，请稍候……";
    document.getElementById("optionsBox").innerHTML = "";
    document.getElementById("submitAnswerBtn").hidden = true;
    document.getElementById("nextQuestionBtn").hidden = true;

    const result = document.getElementById("answerResult");
    result.hidden = true;
    result.textContent = "";

    const language = selectedLanguage();

    try {
        const question = await fetchAIQuestion("choice", language.code, currentAITopic);

        currentQuestion = {
            questionKey: "ai:" + normalizeQuestionTitle(question.title),
            topic: question.topic || "综合",
            language: language.name,
            title: question.title,
            options: question.options || [],
            answer: question.answer,
            explain: question.explain || "",
            source: "AI 出题"
        };

        selectedAnswer = null;
        answered = false;

        renderQuestionCard();
    } catch (error) {
        if (language.code === "java") {
            // DeepSeek 不可用时，回退到本地 Java 题库
            startPractice(
                currentAITopic || document.getElementById("topicSelect").value,
                false
            );

            result.textContent =
                "这次 AI 出题没有成功，已切换到本地 Java 题库。\n" + error.message;
            result.hidden = false;
        } else {
            document.getElementById("questionTopic").textContent = "AI 出题失败";
            document.getElementById("questionTitle").textContent =
                "DeepSeek 暂时没有出题成功，请稍后再试。";

            result.textContent = error.message;
            result.hidden = false;
        }
    } finally {
        aiBusy = false;
    }
}

async function loadAICoding() {
    if (aiBusy) return;

    aiBusy = true;
    aiChoiceMode = false;
    wrongPracticeMode = false;
    wrongPracticeQueue = [];
    wrongPracticeIndex = 0;

    document.getElementById("questionCard").hidden = true;
    document.getElementById("codingTaskCard").hidden = false;

    if (typeof window.dreamweaveReveal === "function") {
        window.dreamweaveReveal(document.getElementById("codingTaskCard"));
    }

    document.getElementById("codingTask").textContent =
        "DeepSeek 正在出题，请稍候……";
    document.getElementById("codingAnswer").value = "";

    const feedback = document.getElementById("codingFeedback");
    feedback.hidden = true;
    feedback.textContent = "";

    const submitButton = document.getElementById("submitCodingBtn");
    const renewButton = document.getElementById("newCodingBtn");
    submitButton.disabled = true;
    renewButton.disabled = true;

    try {
        const language = selectedLanguage();
        const question = await fetchAIQuestion("coding", language.code);

        currentCodingQuestion = question;
        currentCodingLanguage = language.name;

        let text = "语言：" + language.name +
            " ｜ 知识点：" + (question.topic || "综合") + "\n\n" +
            (question.title || "");

        if (question.requirements) {
            text += "\n\n" + question.requirements;
        }

        document.getElementById("codingTask").textContent = text;

        if (question.starterCode) {
            document.getElementById("codingAnswer").value = question.starterCode;
        }
    } catch (error) {
        currentCodingQuestion = null;
        document.getElementById("codingTask").textContent =
            "出题失败：" + error.message;
    } finally {
        submitButton.disabled = false;
        renewButton.disabled = false;
        aiBusy = false;
    }
}

document.getElementById("choiceModeBtn").addEventListener("click", function () {
    loadAIChoice();
});
document.getElementById("codingModeBtn").addEventListener("click", loadAICoding);
document.getElementById("newCodingBtn").addEventListener("click", loadAICoding);

document.getElementById("submitCodingBtn").addEventListener("click", async function () {
    const code = document.getElementById("codingAnswer").value.trim();

    if (!currentCodingQuestion) {
        alert("请先点击“Java 编程题”，让 DeepSeek 生成一道题目！");
        return;
    }

    if (!code) {
        alert("请先编写代码！");
        return;
    }

    const feedback = document.getElementById("codingFeedback");
    const button = document.getElementById("submitCodingBtn");

    feedback.hidden = false;
    feedback.textContent = "DeepSeek 正在批改代码，请稍候……";
    button.disabled = true;

    const prompt =
        "请批改下面这道 " + currentCodingLanguage + " 编程题的学生答案。\n" +
        "题目：" + currentCodingQuestion.title + "\n" +
        (currentCodingQuestion.requirements
            ? "要求：" + currentCodingQuestion.requirements + "\n"
            : "") +
        "\n学生代码：\n" + code + "\n\n" +
        "请按以下格式回答：\n" +
        "1. 总体评价\n" +
        "2. 存在的问题\n" +
        "3. 改进建议\n" +
        "4. 参考代码";

    try {
        const response = await fetch("/api/ai/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                question: prompt
            })
        });

        if (!response.ok) {
            throw new Error("AI 接口返回错误：" + response.status);
        }

        const data = await response.json();
        const answer = data.choices?.[0]?.message?.content;

        if (!answer) {
            throw new Error("DeepSeek 没有返回有效内容");
        }

        feedback.textContent = answer;
    } catch (error) {
        feedback.textContent = "批改失败：" + error.message;
    } finally {
        button.disabled = false;
    }
});

// ===== 知识点分析 =====

function renderKnowledge() {
    const data = getData();
    const container = document.getElementById("knowledgeList");

    container.innerHTML = "";

    topics.forEach(function (topic) {
        const records = data.history.filter(function (item) {
            return item.topic === topic;
        });

        const correct = records.filter(function (item) {
            return item.correct;
        }).length;

        const percent = records.length
            ? Math.round(correct / records.length * 100)
            : 0;

        const item = document.createElement("div");
        item.className = "knowledge-item";

        const label = document.createElement("p");
        label.textContent = topic + "：" +
            (records.length ? percent + "%" : "暂无记录");

        const progress = document.createElement("div");
        progress.className = "progress";

        const bar = document.createElement("div");
        bar.className = "progress-bar";
        bar.style.width = percent + "%";

        progress.appendChild(bar);
        item.appendChild(label);
        item.appendChild(progress);

        container.appendChild(item);
    });

    const weak = getWeakTopic();
    const wrongBank = getWrongQuestionBank();

    if (wrongBank.questions.length) {
        document.getElementById("knowledgeAdvice").textContent = wrongBank.legacyUsed
            ? "检测到旧版错题记录（只保存了知识点），已整理出 " +
              wrongBank.questions.length + " 道巩固题。"
            : "已记录 " + wrongBank.questions.length +
              " 道历史错题，可以直接开始错题巩固。";
    } else {
        document.getElementById("knowledgeAdvice").textContent = weak
            ? "建议优先复习【" + weak + "】，答错的题会自动加入错题本。"
            : "暂时没有错题记录，可以先完成几道练习，让系统了解你的学习情况。";
    }
}

// ===== 个性化训练 =====

function renderTraining() {
    const weak = getWeakTopic();
    const wrongBank = getWrongQuestionBank();
    const advice = document.getElementById("trainingAdvice");

    if (wrongBank.questions.length) {
        advice.textContent = wrongBank.legacyUsed
            ? "旧版错题记录只保存了知识点，已按这些知识点整理出 " +
              wrongBank.questions.length +
              " 道巩固题。之后的错题会保存原题。"
            : "已整理出 " + wrongBank.questions.length +
              " 道历史错题，训练将只包含这些题目。";
    } else if (weak) {
        advice.textContent = "目前只记录了薄弱知识点【" + weak +
            "】，还没有可还原的错题。先完成练习，答错的题会自动加入错题本。";
    } else {
        advice.textContent = "目前没有错题记录，可以先完成几道练习。";
    }
}

document.getElementById("startWrongPracticeBtn").addEventListener(
    "click",
    startWrongQuestionPractice
);

document.getElementById("startTrainingBtn").addEventListener(
    "click",
    startWrongQuestionPractice
);

// ===== 学习统计 =====

function getStreak(minutes) {
    let count = 0;
    const date = new Date();

    if (!minutes[today()]) {
        date.setDate(date.getDate() - 1);
    }

    while (true) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const key = year + "-" + month + "-" + day;

        if (!minutes[key]) break;

        count++;
        date.setDate(date.getDate() - 1);
    }

    return count;
}

function updateDashboard() {
    if (!currentUser) return;

    const data = getData();

    const accuracy = data.total
        ? Math.round(data.correct / data.total * 100)
        : 0;

    document.getElementById("todayTime").textContent =
        (data.minutes[today()] || 0) + " 分钟";

    document.getElementById("totalQuestions").textContent = data.total;

    document.getElementById("accuracy").textContent = accuracy + "%";

    document.getElementById("streak").textContent =
        getStreak(data.minutes) + " 天";
}

// ===== 成长报告 =====

function renderReport() {
    const data = getData();

    const totalMinutes = Object.values(data.minutes).reduce(function (sum, value) {
        return sum + value;
    }, 0);

    const accuracy = data.total
        ? Math.round(data.correct / data.total * 100)
        : 0;

    document.getElementById("reportTime").textContent =
        totalMinutes + " 分钟";

    document.getElementById("reportQuestions").textContent = data.total;

    document.getElementById("reportAccuracy").textContent =
        accuracy + "%";

    document.getElementById("reportStreak").textContent =
        getStreak(data.minutes) + " 天";

    const chart = document.getElementById("studyChart");
    chart.innerHTML = "";

    const days = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        days.push({
            key: year + "-" + month + "-" + day,
            label: (date.getMonth() + 1) + "/" + date.getDate()
        });
    }

    const max = Math.max(
        1,
        ...days.map(function (day) {
            return data.minutes[day.key] || 0;
        })
    );

    days.forEach(function (day) {
        const minutes = data.minutes[day.key] || 0;

        const item = document.createElement("div");
        item.className = "chart-item";

        const box = document.createElement("div");
        box.className = "chart-bar-box";

        const bar = document.createElement("div");
        bar.className = "chart-bar";
        bar.style.height = (minutes / max * 160) + "px";
        bar.title = minutes + " 分钟";

        box.appendChild(bar);
        item.appendChild(box);

        const label = document.createElement("div");
        label.textContent = day.label;

        item.appendChild(label);
        chart.appendChild(item);
    });

    const weak = getWeakTopic();

    document.getElementById("growthAdvice").textContent = weak
        ? "你可以继续加强【" + weak + "】知识点，每天保持练习。"
        : "继续保持学习习惯，多完成练习，积累属于自己的成长记录。";
}

// ===== 学习画像 =====

function buildLearningProfile() {
    const data = getData();

    const stats = topics.map(function (topic) {
        const records = data.history.filter(function (item) {
            return item.topic === topic;
        });

        const correct = records.filter(function (item) {
            return item.correct;
        }).length;

        return {
            name: topic,
            attempts: records.length,
            correct: correct,
            accuracy: records.length ? Math.round(correct / records.length * 100) : 0
        };
    });

    const weakTopics = stats
        .filter(function (item) {
            return item.attempts > 0;
        })
        .sort(function (a, b) {
            return a.accuracy - b.accuracy;
        })
        .slice(0, 3)
        .map(function (item) {
            return item.name;
        });

    return {
        total: data.total,
        correct: data.correct,
        accuracy: data.total ? Math.round(data.correct / data.total * 100) : 0,
        streak: getStreak(data.minutes),
        todayMinutes: data.minutes[today()] || 0,
        topics: stats,
        weakTopics: weakTopics
    };
}

async function postAI(path, payload) {
    const response = await fetch(path, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const text = await response.text();
    let data = null;

    if (text) {
        try {
            data = JSON.parse(text);
        } catch (ignore) {
            data = null;
        }
    }

    if (!response.ok) {
        const message = data && data.error
            ? data.error
            : "请求失败（" + response.status + "）";

        throw new Error(message);
    }

    return data;
}

// ===== AI 辅导教师 =====

let tutorMessages = [];
let tutorBusy = false;
let tutorGreeted = false;

function escapeHTML(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function renderTutorMarkdown(text) {
    const segments = String(text).split("```");
    let html = "";

    segments.forEach(function (segment, index) {
        if (index % 2 === 1) {
            const code = segment.replace(/^[a-zA-Z0-9_+-]*\n/, "");
            html += '<pre class="chat-code"><code>' + escapeHTML(code) + "</code></pre>";
            return;
        }

        html += escapeHTML(segment)
            .replace(/`([^`\n]+)`/g, '<code class="inline-code">$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
            .replace(/\n/g, "<br>");
    });

    return html;
}

function appendTutorMessage(role, content) {
    const windowEl = document.getElementById("chatWindow");
    const empty = document.getElementById("chatEmpty");

    if (empty) {
        empty.hidden = true;
    }

    const message = document.createElement("div");
    message.className = "chat-msg " + role;

    const avatar = document.createElement("div");
    avatar.className = "chat-avatar";
    avatar.textContent = role === "user" ? "我" : "AI";

    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";

    if (role === "assistant") {
        bubble.innerHTML = renderTutorMarkdown(content);
    } else {
        bubble.textContent = content;
    }

    message.appendChild(avatar);
    message.appendChild(bubble);
    windowEl.appendChild(message);
    windowEl.scrollTop = windowEl.scrollHeight;
}

function showTutorTyping() {
    const windowEl = document.getElementById("chatWindow");
    const typing = document.createElement("div");

    typing.className = "chat-msg assistant chat-typing";
    typing.id = "tutorTyping";
    typing.innerHTML =
        '<div class="chat-avatar">AI</div>' +
        '<div class="chat-bubble">' +
        '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>' +
        "</div>";

    windowEl.appendChild(typing);
    windowEl.scrollTop = windowEl.scrollHeight;
}

function hideTutorTyping() {
    const typing = document.getElementById("tutorTyping");

    if (typing) {
        typing.remove();
    }
}

async function sendTutorMessage(text) {
    const content = String(text || "").trim();

    if (!content || tutorBusy) {
        return;
    }

    const input = document.getElementById("chatInput");
    const button = document.getElementById("chatSendBtn");

    if (chatRecognition) {
        abortChatVoiceInput();
    }

    tutorBusy = true;
    button.disabled = true;

    tutorMessages.push({ role: "user", content: content });
    appendTutorMessage("user", content);

    input.value = "";
    input.style.height = "auto";

    showTutorTyping();

    try {
        const data = await postAI("/api/ai/tutor", {
            messages: tutorMessages.slice(-12),
            profile: buildLearningProfile()
        });

        const reply = data && data.reply;

        if (!reply) {
            throw new Error("AI 没有返回内容，请重试");
        }

        tutorMessages.push({ role: "assistant", content: reply });

        if (tutorMessages.length > 40) {
            tutorMessages = tutorMessages.slice(-40);
        }

        appendTutorMessage("assistant", reply);
    } catch (error) {
        appendTutorMessage("assistant", "抱歉，这次没能回答成功：" + error.message);
    } finally {
        hideTutorTyping();
        tutorBusy = false;
        button.disabled = false;
        input.focus();
    }
}

function renderTutorPage() {
    const context = document.getElementById("tutorContext");

    if (!currentUser) {
        context.textContent = "登录后即可获得个性化辅导。";
        return;
    }

    const profile = buildLearningProfile();

    context.textContent = profile.total
        ? "已结合你的学习数据调整策略：正确率 " + profile.accuracy + "%，" +
          (profile.weakTopics.length
              ? "当前薄弱点：" + profile.weakTopics.join("、")
              : "暂时没有明显薄弱点") + "。"
        : "还没有答题记录，我会从基础开始，一步步带你。";

    if (!tutorGreeted) {
        tutorGreeted = true;

        appendTutorMessage(
            "assistant",
            "你好，我是织梦的 AI 辅导教师。你可以把不会的题目、看不懂的代码发给我。" +
            "我更习惯先给你一点提示，陪你一起找到答案。" +
            (profile.weakTopics.length
                ? "\n\n我注意到你最近在 **" + profile.weakTopics.join("、") + "** 上还需要加强，想从那里开始吗？"
                : "")
        );
    }
}

function resetTutorSession() {
    tutorMessages = [];
    tutorGreeted = false;
    tutorBusy = false;

    abortChatVoiceInput();

    const windowEl = document.getElementById("chatWindow");
    const empty = document.getElementById("chatEmpty");

    if (windowEl) {
        windowEl.querySelectorAll(".chat-msg").forEach(function (item) {
            item.remove();
        });
    }

    if (empty) {
        empty.hidden = false;
    }
}

document.getElementById("chatForm").addEventListener("submit", function (event) {
    event.preventDefault();
    sendTutorMessage(document.getElementById("chatInput").value);
});

document.getElementById("chatInput").addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendTutorMessage(this.value);
    }
});

document.getElementById("chatInput").addEventListener("input", function () {
    resizeChatInput(this);
});

document.querySelectorAll(".chat-chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
        const input = document.getElementById("chatInput");

        input.value = chip.dataset.prompt || chip.textContent;
        input.focus();
        resizeChatInput(input);
    });
});

// ===== AI 辅导教师 · 语音输入 =====

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
const chatMicBtn = document.getElementById("chatMicBtn");
const chatMicLabel = document.getElementById("chatMicLabel");
const chatVoiceStatus = document.getElementById("chatVoiceStatus");

let chatRecognition = null;
let chatVoiceBaseText = "";
let chatVoiceFinalText = "";
let chatVoiceHadError = false;
let chatVoiceStatusTimer = null;

function resizeChatInput(input) {
    if (!input) return;

    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 130) + "px";
}

function setChatVoiceStatus(message, state, autoHideMs) {
    if (!chatVoiceStatus) return;

    window.clearTimeout(chatVoiceStatusTimer);

    if (!message) {
        chatVoiceStatus.hidden = true;
        chatVoiceStatus.textContent = "";
        delete chatVoiceStatus.dataset.state;
        return;
    }

    chatVoiceStatus.hidden = false;
    chatVoiceStatus.textContent = message;
    chatVoiceStatus.dataset.state = state || "info";

    if (autoHideMs) {
        chatVoiceStatusTimer = window.setTimeout(function () {
            setChatVoiceStatus("");
        }, autoHideMs);
    }
}

function resetChatMicButton() {
    if (!chatMicBtn || !SpeechRecognitionAPI) return;

    chatMicBtn.classList.remove("is-listening");
    chatMicBtn.setAttribute("aria-pressed", "false");
    chatMicBtn.setAttribute("aria-label", "使用语音输入问题");
    chatMicBtn.title = "语音输入";

    if (chatMicLabel) {
        chatMicLabel.textContent = "语音输入";
    }
}

function abortChatVoiceInput() {
    const recognition = chatRecognition;

    chatRecognition = null;

    if (recognition) {
        try {
            recognition.abort();
        } catch (error) {
            // 忽略停止录音时的浏览器异常
        }
    }

    resetChatMicButton();
    setChatVoiceStatus("");
}

function stopChatVoiceInput() {
    if (!chatRecognition) return;

    setChatVoiceStatus("正在结束录音……", "info");

    try {
        chatRecognition.stop();
    } catch (error) {
        abortChatVoiceInput();
    }
}

function startChatVoiceInput() {
    const input = document.getElementById("chatInput");

    if (!input) return;

    chatVoiceBaseText = input.value;
    chatVoiceFinalText = "";
    chatVoiceHadError = false;

    const recognition = new SpeechRecognitionAPI();

    chatRecognition = recognition;
    recognition.lang = "zh-CN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = function () {
        if (chatRecognition !== recognition) return;

        chatMicBtn.classList.add("is-listening");
        chatMicBtn.setAttribute("aria-pressed", "true");
        chatMicBtn.setAttribute("aria-label", "正在聆听，点击结束语音输入");
        chatMicBtn.title = "点击结束语音输入";
        setChatVoiceStatus("正在聆听，请说出你的问题；再次点击麦克风结束。", "listening");

        if (chatMicLabel) {
            chatMicLabel.textContent = "结束录音";
        }

        input.focus();
    };

    recognition.onresult = function (event) {
        if (chatRecognition !== recognition) return;

        let interimText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0] ? result[0].transcript : "";

            if (result.isFinal) {
                chatVoiceFinalText += transcript;
            } else {
                interimText += transcript;
            }
        }

        const spokenText = (chatVoiceFinalText + interimText).trim();

        if (!spokenText) {
            input.value = chatVoiceBaseText;
            return;
        }

        const separator = chatVoiceBaseText && !/[\s，。！？、；：,.!?;:]$/.test(chatVoiceBaseText) ? " " : "";

        input.value = chatVoiceBaseText + separator + spokenText;
        resizeChatInput(input);
    };

    recognition.onerror = function (event) {
        if (chatRecognition !== recognition || event.error === "aborted") return;

        chatVoiceHadError = true;

        const messages = {
            "not-allowed": "未获得麦克风权限，请允许浏览器访问麦克风后重试。",
            "service-not-allowed": "浏览器已禁用语音识别服务，请检查浏览器设置。",
            "audio-capture": "没有检测到可用的麦克风，请检查设备连接。",
            "network": "语音识别服务连接失败，请检查网络后重试。",
            "no-speech": "没有听清，请靠近麦克风再说一次。",
            "language-not-supported": "当前浏览器不支持中文语音识别。"
        };

        setChatVoiceStatus(messages[event.error] || "语音识别失败，请稍后重试。", "error");
    };

    recognition.onend = function () {
        if (chatRecognition !== recognition) return;

        chatRecognition = null;
        resetChatMicButton();

        if (chatVoiceHadError) return;

        const hasSpeech = chatVoiceFinalText.trim() ||
            input.value.trim() !== chatVoiceBaseText.trim();

        if (hasSpeech) {
            setChatVoiceStatus("语音已转成文字，确认后点击发送。", "success", 4000);
        } else {
            setChatVoiceStatus("没有听到内容，请再试一次。", "error", 4000);
        }
    };

    setChatVoiceStatus("正在启动麦克风……", "info");

    try {
        recognition.start();
    } catch (error) {
        if (chatRecognition === recognition) {
            chatRecognition = null;
        }

        resetChatMicButton();
        setChatVoiceStatus("无法启动语音输入，请稍后重试。", "error", 4000);
    }
}

if (SpeechRecognitionAPI && chatMicBtn) {
    chatMicBtn.addEventListener("click", function () {
        if (chatRecognition) {
            stopChatVoiceInput();
        } else {
            startChatVoiceInput();
        }
    });
} else if (chatMicBtn) {
    chatMicBtn.disabled = true;
    chatMicBtn.title = "当前浏览器不支持语音输入，请使用最新版 Chrome 或 Edge";
    chatMicBtn.setAttribute("aria-label", "语音输入不可用：当前浏览器不支持");

    if (chatMicLabel) {
        chatMicLabel.textContent = "不支持语音";
    }
}

document.addEventListener("visibilitychange", function () {
    if (document.hidden && chatRecognition) {
        abortChatVoiceInput();
    }
});

// ===== 学习时长 =====

let activeSeconds = 0;

setInterval(function () {
    if (!currentUser || document.hidden) return;

    activeSeconds++;

    if (activeSeconds >= 60) {
        activeSeconds = 0;

        const data = getData();
        const key = today();

        data.minutes[key] = (data.minutes[key] || 0) + 1;

        saveData(data);
        updateDashboard();
    }
}, 1000);

// ===== 恢复当前登录 =====

const savedUser = sessionStorage.getItem("dreamweave_current_user");

if (savedUser) {
    const users = getUsers();

    if (Object.prototype.hasOwnProperty.call(users, savedUser)) {
        currentUser = savedUser;
        enterApp();
    }
}
// 测试织梦前端与 Spring Boot 后端通信
fetch("/api/hello")
    .then(response => {
        if (!response.ok) {
            throw new Error("请求失败");
        }
        return response.text();
    })
    .then(data => {
        console.log("[DreamWeave] Spring Boot 返回：", data);
    })
    .catch(error => {
        console.error("后端连接失败：", error);
    });
