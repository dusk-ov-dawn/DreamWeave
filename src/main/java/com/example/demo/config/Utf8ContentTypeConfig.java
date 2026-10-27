package com.example.demo.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletResponseWrapper;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Locale;

/**
 * 给静态文本资源（.js/.css/.html 等）的响应补上 charset=UTF-8。
 * 否则响应头只有 text/javascript 之类的类型，没有字符集，
 * 浏览器直接访问或按系统默认编码（如 GBK）解析时中文会乱码。
 */
@Configuration
public class Utf8ContentTypeConfig {

    @Bean
    public FilterRegistrationBean<OncePerRequestFilter> utf8ContentTypeFilter() {
        FilterRegistrationBean<OncePerRequestFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                            FilterChain filterChain) throws ServletException, IOException {
                filterChain.doFilter(request, new CharsetResponseWrapper(response));
            }
        });
        registration.addUrlPatterns("/*");
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registration;
    }

    private static final class CharsetResponseWrapper extends HttpServletResponseWrapper {

        CharsetResponseWrapper(HttpServletResponse response) {
            super(response);
        }

        @Override
        public void setContentType(String type) {
            super.setContentType(withUtf8(type));
        }

        @Override
        public void setHeader(String name, String value) {
            super.setHeader(name, "Content-Type".equalsIgnoreCase(name) ? withUtf8(value) : value);
        }

        private static String withUtf8(String type) {
            if (type == null) {
                return null;
            }
            String lower = type.toLowerCase(Locale.ROOT);
            boolean textual = lower.startsWith("text/")
                    || lower.startsWith("application/javascript")
                    || lower.startsWith("application/json")
                    || lower.startsWith("application/xml");
            if (textual && !lower.contains("charset=")) {
                return type + ";charset=UTF-8";
            }
            return type;
        }
    }
}
