package com.example.demo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@RestController
@RequestMapping("/api/ai")
public class DeepSeekController {

    private static final Logger log = LoggerFactory.getLogger(DeepSeekController.class);

    private static final List<String> TOPICS = List.of("变量", "条件", "循环", "数组", "面向对象");

    private static final List<String> SCENARIOS = List.of(
            "校园学习", "图书管理", "天气统计", "购物结算",
            "运动计分", "交通出行", "游戏积分", "餐厅点单"
    );

    private static final Map<String, String> LANGUAGES = Map.of(
            "java", "Java",
            "python", "Python",
            "c", "C",
            "cpp", "C++",
            "javascript", "JavaScript"
    );

    private static final String SYSTEM_PROMPT = "你是织梦 DreamWeave 的 AI 出题老师，精通编程教学。"
            + "你只输出严格合法的 JSON 对象，不输出任何多余文字、Markdown 或代码块标记。";

    private static final String ASSISTANT_PROMPT = "你是织梦 DreamWeave 的AI编程学习助手。"
            + "请用中文回答编程问题，分析代码错误，解释相关知识点，并给出修改建议。";

    private final DeepSeekService deepSeek;
    private final ObjectMapper mapper = new ObjectMapper();

    public DeepSeekController(DeepSeekService deepSeek) {
        this.deepSeek = deepSeek;
    }

    @PostMapping("/chat")
    public ResponseEntity<String> chat(
            @RequestBody Map<String, String> body) {

        String question = body.get("question");

        if (question == null || question.isBlank()) {
            return ResponseEntity.badRequest()
                    .body("请输入问题！");
        }

        try {
            String answer = deepSeek.complete(
                    List.of(
                            Map.of("role", "system", "content", ASSISTANT_PROMPT),
                            Map.of("role", "user", "content", question)
                    ),
                    false,
                    0.7
            );

            Map<String, Object> payload = Map.of(
                    "choices", List.of(
                            Map.of(
                                    "index", 0,
                                    "message", Map.of("role", "assistant", "content", answer)
                            )
                    )
            );

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(mapper.writeValueAsString(payload));

        } catch (DeepSeekService.DeepSeekException e) {
            log.warn("DeepSeek 对话请求失败：{}", e.getMessage());
            return jsonError(502, e.getMessage());
        } catch (Exception e) {
            log.error("DeepSeek 对话响应处理失败", e);
            return jsonError(500, "AI 服务异常，请稍后重试");
        }
    }

    /**
     * 让 DeepSeek 生成题目。
     * 请求体：{"type": "choice" | "coding", "topic": "数组", "language": "java"}
     */
    @PostMapping("/question")
    public ResponseEntity<String> generateQuestion(
            @RequestBody Map<String, Object> body) {

        String type = stringValue(body.get("type"), "choice");
        String topic = topicRule(stringValue(body.get("topic"), null));
        String language = languageRule(stringValue(body.get("language"), null));
        List<String> excludedTitles = readExcludedTitles(body.get("exclude"));
        String scenario = SCENARIOS.get(
                ThreadLocalRandom.current().nextInt(SCENARIOS.size())
        );

        String userPrompt = switch (type) {
            case "choice" -> choicePrompt(language, topic, scenario, excludedTitles);
            case "coding" -> codingPrompt(language, topic, scenario, excludedTitles);
            default -> null;
        };

        if (userPrompt == null) {
            return jsonError(400, "不支持的题目类型：" + type);
        }

        try {
            String content = deepSeek.complete(
                    List.of(
                            Map.of("role", "system", "content", SYSTEM_PROMPT),
                            Map.of("role", "user", "content", userPrompt)
                    ),
                    true,
                    0.95
            );

            JsonNode question = parseJson(content);

            if ("choice".equals(type)) {
                validateChoice(question);
            } else {
                validateCoding(question);
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(mapper.writeValueAsString(question));

        } catch (DeepSeekService.DeepSeekException e) {
            log.warn("DeepSeek 出题失败：{}", e.getMessage());
            return jsonError(502, e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("AI 出题结果不可用：{}", e.getMessage());
            return jsonError(502, e.getMessage());
        } catch (Exception e) {
            log.error("AI 出题响应处理失败", e);
            return jsonError(502, "AI 出题失败，请稍后重试");
        }
    }

    private String choicePrompt(String language, String topic, String scenario,
                                List<String> excludedTitles) {
        return """
                请为正在学习 %s 的初学者出一道选择题。
                知识点：%s
                请围绕「%s」这一具体场景设计题目。
                要求：
                1. 难度在基础到进阶之间；
                2. 题目中的代码（如有）必须使用 %s 语法；
                3. 提供 4 个选项，只有一个正确答案，干扰项要合理；
                4. 题目和解析全部使用中文；
                %s
                6. 严格只输出一个 JSON 对象，字段如下：
                {"type":"choice","topic":"知识点","title":"题干","options":["选项A","选项B","选项C","选项D"],"answer":0,"explain":"解析"}
                其中 answer 必须是正确选项的下标（0-3），topic 必须是【变量、条件、循环、数组、面向对象】之一。
                """.formatted(language, topic, scenario, language, avoidInstruction(excludedTitles));
    }

    private String codingPrompt(String language, String topic, String scenario,
                                List<String> excludedTitles) {
        return """
                请为正在学习 %s 的初学者出一道编程题。
                知识点：%s
                请围绕「%s」这一具体场景设计题目。
                要求：
                1. 难度在基础到进阶之间；
                2. 题目描述清楚输入、输出与约束；
                3. 起始代码和参考实现必须使用 %s 编写，并且可以直接运行（包含完整的程序入口，例如 main 方法或脚本入口）；
                4. 题目、要求、代码注释使用中文；
                %s
                6. 严格只输出一个 JSON 对象，字段如下：
                {"type":"coding","topic":"知识点","title":"题目描述","requirements":"输入输出与约束要求","starterCode":"起始代码","reference":"参考实现","explain":"解题思路"}
                topic 必须是【变量、条件、循环、数组、面向对象】之一。
                """.formatted(language, topic, scenario, language, avoidInstruction(excludedTitles));
    }

    private String avoidInstruction(List<String> excludedTitles) {
        StringBuilder instruction = new StringBuilder(
                "5. 必须更换新的考查角度、代码示例、变量名和数据，不要照搬常见入门题。"
        );

        if (!excludedTitles.isEmpty()) {
            instruction.append("\n   不得与以下已出题目重复：");

            for (String title : excludedTitles) {
                instruction.append("\n   - ").append(title);
            }
        }

        return instruction.toString();
    }

    private String stringValue(Object value, String fallback) {
        return value instanceof String text ? text : fallback;
    }

    private List<String> readExcludedTitles(Object value) {
        if (!(value instanceof List<?> list)) {
            return List.of();
        }

        return list.stream()
                .filter(String.class::isInstance)
                .map(String.class::cast)
                .map(title -> title.replaceAll("\\s+", " ").trim())
                .filter(title -> !title.isEmpty())
                .map(title -> title.length() > 120 ? title.substring(0, 120) : title)
                .distinct()
                .limit(10)
                .toList();
    }

    private String topicRule(String topic) {
        if (topic == null || topic.isBlank() || "all".equalsIgnoreCase(topic) || !TOPICS.contains(topic)) {
            return "从【" + String.join("、", TOPICS) + "】中随机选择一个";
        }
        return topic;
    }

    private String languageRule(String language) {
        if (language == null || language.isBlank()) {
            return "Java";
        }
        return LANGUAGES.getOrDefault(language.toLowerCase(Locale.ROOT), "Java");
    }

    private JsonNode parseJson(String content) throws Exception {
        String text = stripCodeFence(content);

        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');

        if (start < 0 || end <= start) {
            throw new IllegalArgumentException("DeepSeek 返回的内容不是合法 JSON，请重试");
        }

        return mapper.readTree(text.substring(start, end + 1));
    }

    private String stripCodeFence(String text) {
        String result = text.trim();

        if (result.startsWith("```")) {
            int firstNewline = result.indexOf('\n');
            if (firstNewline >= 0) {
                result = result.substring(firstNewline + 1);
            }
            if (result.endsWith("```")) {
                result = result.substring(0, result.length() - 3);
            }
        }

        return result.trim();
    }

    private void validateChoice(JsonNode question) {
        if (question.path("title").asText("").isBlank()) {
            throw new IllegalArgumentException("AI 返回的选择题缺少题干，请重试");
        }

        JsonNode options = question.path("options");

        if (!options.isArray() || options.size() < 2) {
            throw new IllegalArgumentException("AI 返回的选择题缺少选项，请重试");
        }

        int answer = question.path("answer").asInt(-1);

        if (answer < 0 || answer >= options.size()) {
            throw new IllegalArgumentException("AI 返回的答案下标不正确，请重试");
        }
    }

    private void validateCoding(JsonNode question) {
        if (question.path("title").asText("").isBlank()) {
            throw new IllegalArgumentException("AI 返回的编程题缺少题目描述，请重试");
        }
    }

    private ResponseEntity<String> jsonError(int status, String message) {
        String json;

        try {
            json = mapper.writeValueAsString(Map.of("error", message));
        } catch (Exception e) {
            json = "{\"error\":\"AI 服务异常\"}";
        }

        return ResponseEntity.status(status)
                .contentType(MediaType.APPLICATION_JSON)
                .body(json);
    }
}
