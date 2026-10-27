package com.example.demo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * DeepSeek Chat Completions 的统一调用入口。
 * 控制器只负责业务提示词与结果校验，HTTP 细节集中在这里。
 */
@Service
public class DeepSeekService {

    private static final Logger log = LoggerFactory.getLogger(DeepSeekService.class);

    @Value("${deepseek.api.key}")
    private String apiKey;

    @Value("${deepseek.api.url}")
    private String apiUrl;

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    /**
     * 发送一轮对话，返回助手回复的纯文本内容。
     *
     * @param messages    完整消息列表（包含 system 消息）
     * @param jsonMode    是否要求模型只输出 JSON
     * @param temperature 采样温度
     */
    public String complete(List<Map<String, String>> messages, boolean jsonMode, double temperature) {
        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", "deepseek-chat");
        requestBody.put("messages", messages);
        requestBody.put("stream", false);
        requestBody.put("temperature", temperature);
        requestBody.put("max_tokens", jsonMode ? 3200 : 1600);

        if (jsonMode) {
            requestBody.put("response_format", Map.of("type", "json_object"));
        }

        try {
            String json = mapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .timeout(Duration.ofSeconds(120))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
            );

            if (response.statusCode() != 200) {
                log.error("DeepSeek 返回错误码 {}：{}", response.statusCode(), response.body());
                throw new DeepSeekException(statusMessage(response.statusCode()));
            }

            JsonNode root = mapper.readTree(response.body());
            JsonNode choices = root.path("choices");

            if (!choices.isArray() || choices.size() == 0) {
                throw new DeepSeekException("DeepSeek 没有返回内容，请重试");
            }

            String content = choices.get(0).path("message").path("content").asText("").trim();

            if (content.isEmpty()) {
                throw new DeepSeekException("DeepSeek 没有返回内容，请重试");
            }

            return content;

        } catch (DeepSeekException e) {
            throw e;
        } catch (Exception e) {
            log.error("DeepSeek 请求失败", e);
            throw new DeepSeekException("AI 请求失败，请稍后重试");
        }
    }

    private String statusMessage(int status) {
        return switch (status) {
            case 401, 403 -> "DeepSeek API Key 无效或已过期";
            case 402 -> "DeepSeek 账户余额不足";
            case 429 -> "请求过于频繁，请稍后再试";
            default -> "DeepSeek 接口返回错误（" + status + "）";
        };
    }

    public static class DeepSeekException extends RuntimeException {
        public DeepSeekException(String message) {
            super(message);
        }
    }
}
