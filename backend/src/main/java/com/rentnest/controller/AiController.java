package com.rentnest.controller;

import com.rentnest.dto.ApiResponse;
import com.rentnest.model.User;
import com.rentnest.service.AiTextService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiTextService aiTextService;

    // Rate Limit In-Memory Tracks
    private final ConcurrentHashMap<String, RateLimitBucket> rateLimits = new ConcurrentHashMap<>();

    private static class RateLimitBucket {
        long resetTime;
        final AtomicInteger count = new AtomicInteger(0);

        RateLimitBucket() {
            this.resetTime = System.currentTimeMillis() + 3600000; // 1 hour window
        }

        synchronized boolean tryConsume(int limit) {
            long now = System.currentTimeMillis();
            if (now > resetTime) {
                resetTime = now + 3600000;
                count.set(0);
            }
            return count.incrementAndGet() <= limit;
        }
    }

    @PostMapping("/generate-description")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateDescription(
            @RequestBody Map<String, Object> fields,
            @AuthenticationPrincipal User user) {

        if (fields == null || !fields.containsKey("category") || fields.get("category") == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Category is required to generate description."));
        }

        // Rate Limit per User: Max 10 requests / hour
        String key = "USER:" + user.getId().toString();
        RateLimitBucket bucket = rateLimits.computeIfAbsent(key, k -> new RateLimitBucket());
        if (!bucket.tryConsume(10)) {
            return ResponseEntity.status(429).body(ApiResponse.error("Too many AI requests — please try again shortly."));
        }

        try {
            String desc = aiTextService.generateListingDescription(fields);
            return ResponseEntity.ok(ApiResponse.success(Map.of("description", desc), "Description generated successfully"));
        } catch (Exception e) {
            log.error("AI description generation failed: {}", e.getMessage());
            return ResponseEntity.ok(ApiResponse.error("AI generation failed. Please type your description manually."));
        }
    }

    @PostMapping("/parse-search-query")
    public ResponseEntity<ApiResponse<Map<String, Object>>> parseSearchQuery(
            @RequestBody Map<String, String> requestBody,
            HttpServletRequest request) {

        String query = requestBody != null ? requestBody.get("query") : null;
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Query is required."));
        }

        // Rate Limit per IP: Max 15 requests / hour
        String ip = getClientIp(request);
        String key = "IP:" + ip;
        RateLimitBucket bucket = rateLimits.computeIfAbsent(key, k -> new RateLimitBucket());
        if (!bucket.tryConsume(15)) {
            return ResponseEntity.status(429).body(ApiResponse.error("Too many AI requests — please try again shortly."));
        }

        try {
            Map<String, Object> result = aiTextService.parseSearchQuery(query);
            return ResponseEntity.ok(ApiResponse.success(result, "Search query parsed successfully"));
        } catch (Exception e) {
            log.error("AI search query parsing failed: {}", e.getMessage());
            return ResponseEntity.ok(ApiResponse.error("Failed to parse query."));
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
