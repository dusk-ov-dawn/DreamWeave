package com.example.demo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * AI 辅导教师：带学习画像的多轮苏格拉底式问答。
 */
@RestController
@RequestMapping("/api/ai")
public class AiMentorController {

    private static final Logger log = LoggerFactory.getLogger(AiMentorController.class);

    private final DeepSeekService deepSeek;
    private final ObjectMapper mapper = new ObjectMapper();

    public AiMentorController(DeepSeekService deepSeek) {
        this.deepSeek = deepSeek;
    }

    public record Message(String role, String content) {
    }

    public record TutorRequest(List<Message> messages, Map<String, Object> profile) {
    }

    @PostMapping("/tutor")
    public ResponseEntity<String> tutor(@RequestBody TutorRequest request) {
        List<Message> history = request.messages() == null ? List.of() : request.messages();
        List<Map<String, String>> messages = new ArrayList<>();

        messages.add(Map.of("role", "system", "content", tutorSystemPrompt(request.profile())));

        int start = Math.max(0, history.size() - 14);

        for (int i = start; i < history.size(); i++) {
            Message item = history.get(i);

            if (item == null || item.content() == null) {
                continue;
            }

            String content = item.content().strip();

            if (content.isEmpty()) {
                continue;
            }

            if (content.length() > 4000) {
                content = content.substring(0, 4000);
            }

            String role = "assistant".equals(item.role()) ? "assistant" : "user";
            messages.add(Map.of("role", role, "content", content));
        }

        if (messages.size() < 2
                || !"user".equals(messages.get(messages.size() - 1).get("role"))) {
            return jsonError(400, "请输入你的问题！");
        }

        try {
            String reply = deepSeek.complete(messages, false, 0.7);
            return jsonOk(Map.of("reply", reply));
        } catch (DeepSeekService.DeepSeekException e) {
            log.warn("AI 辅导教师请求失败：{}", e.getMessage());
            return jsonError(502, e.getMessage());
        }
    }

    private String tutorSystemPrompt(Map<String, Object> profile) {
        return """
                你是「织梦 DreamWeave」的 AI 辅导教师，面向编程初学者。
                教学原则：
                1. 全程使用中文，语气耐心、鼓励，不评判学生；
                2. 优先用提问、类比和提示引导学生自己思考，不要一上来就给完整答案；
                3. 学生明确要求答案或连续卡住时，再给出分步骤讲解；
                4. 代码放在 Markdown 代码块中，并解释关键步骤；
                5. 单次回答尽量控制在 350 字以内，除非需要解释代码。
                学生画像：%s
                """.formatted(profileSummary(profile));
    }

    private String profileSummary(Map<String, Object> profile) {
        if (profile == null || profile.isEmpty()) {
            return "暂无学习数据。";
        }

        int total = number(profile.get("total"));
        int accuracy = number(profile.get("accuracy"));
        int streak = number(profile.get("streak"));
        String weak = joinList(profile.get("weakTopics"));

        StringBuilder text = new StringBuilder();
        text.append("累计完成 ").append(total).append(" 题，正确率 ")
                .append(accuracy).append("%，连续学习 ").append(streak).append(" 天");

        if (!weak.isBlank()) {
            text.append("，薄弱知识点：").append(weak);
        }

        Object topics = profile.get("topics");

        if (topics instanceof List<?> list && !list.isEmpty()) {
            text.append("。各知识点情况：");
            int count = 0;

            for (Object item : list) {
                if (!(item instanceof Map<?, ?> map) || map.get("name") == null) {
                    continue;
                }

                if (count++ > 0) {
                    text.append("；");
                }

                text.append(map.get("name"))
                        .append(" ")
                        .append(number(map.get("accuracy")))
                        .append("%");

                if (count >= 5) {
                    break;
                }
            }
        }

        return text.append("。").toString();
    }

    private int number(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }

        if (value instanceof String text) {
            try {
                return (int) Double.parseDouble(text);
            } catch (NumberFormatException ignored) {
                return 0;
            }
        }

        return 0;
    }

    private String joinList(Object value) {
        if (!(value instanceof List<?> list)) {
            return "";
        }

        StringBuilder text = new StringBuilder();
        int count = 0;

        for (Object item : list) {
            if (item == null) {
                continue;
            }

            String label = String.valueOf(item).strip();

            if (label.isEmpty()) {
                continue;
            }

            if (count++ > 0) {
                text.append("、");
            }

            text.append(label);

            if (count >= 5) {
                break;
            }
        }

        return text.toString();
    }

    private ResponseEntity<String> jsonOk(Object payload) {
        try {
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(mapper.writeValueAsString(payload));
        } catch (Exception e) {
            log.error("AI 响应序列化失败", e);
            return jsonError(500, "AI 服务异常，请稍后重试");
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
