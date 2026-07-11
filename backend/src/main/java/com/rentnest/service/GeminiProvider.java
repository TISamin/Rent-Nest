package com.rentnest.service;

import com.rentnest.exception.AiProviderException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.*;

@Slf4j
@Service
public class GeminiProvider implements AiProvider {

    private final RestTemplate restTemplate;

    @Value("${ai.gemini.api-key}")
    private String apiKey;

    @Value("${ai.gemini.model}")
    private String model;

    public GeminiProvider(RestTemplateBuilder restTemplateBuilder) {
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(15))
                .setReadTimeout(Duration.ofSeconds(30))
                .build();
    }

    @Override
    public String complete(String systemPrompt, String userPrompt) throws AiProviderException {
        return callGemini(systemPrompt, userPrompt);
    }

    @Override
    public String completeJson(String systemPrompt, String userPrompt) throws AiProviderException {
        // Gemini handles JSON via natural language prompt guidance or optional config
        return callGemini(systemPrompt, userPrompt);
    }

    private String callGemini(String systemPrompt, String userPrompt) throws AiProviderException {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new AiProviderException("Gemini API key is not configured.", true);
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

        // Build Payload
        Map<String, Object> requestBody = new HashMap<>();
        
        List<Map<String, Object>> contents = new ArrayList<>();
        Map<String, Object> contentMap = new HashMap<>();
        contentMap.put("role", "user");
        
        List<Map<String, Object>> parts = new ArrayList<>();
        Map<String, Object> partMap = new HashMap<>();
        partMap.put("text", userPrompt);
        parts.add(partMap);
        
        contentMap.put("parts", parts);
        contents.add(contentMap);
        requestBody.put("contents", contents);

        // Add system instruction if present
        if (systemPrompt != null && !systemPrompt.trim().isEmpty()) {
            Map<String, Object> systemInstruction = new HashMap<>();
            List<Map<String, Object>> sysParts = new ArrayList<>();
            Map<String, Object> sysPartMap = new HashMap<>();
            sysPartMap.put("text", systemPrompt);
            sysParts.add(sysPartMap);
            systemInstruction.put("parts", sysParts);
            requestBody.put("systemInstruction", systemInstruction);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return parseGeminiResponse(response.getBody());
            } else {
                throw new AiProviderException("Gemini returned non-2xx status: " + response.getStatusCode(), true);
            }
        } catch (HttpStatusCodeException e) {
            log.warn("Gemini HTTP error status code: {}", e.getStatusCode());
            // Treat 429, 5xx, and 404 (model unavailable) as availability issues → trigger fallback
            int code = e.getStatusCode().value();
            boolean isQuotaOrAvail = code == 429 || code == 404 || e.getStatusCode().is5xxServerError();
            throw new AiProviderException("Gemini service failed with HTTP: " + e.getStatusCode(), e, isQuotaOrAvail);
        } catch (AiProviderException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Gemini communication failure: {}", e.getMessage());
            throw new AiProviderException("Gemini communication failed: " + e.getMessage(), e, true);
        }
    }

    private String parseGeminiResponse(Map responseBody) throws AiProviderException {
        // Guard against blocked prompts / safety filters
        List promptFeedback = (List) responseBody.get("promptFeedback");
        if (promptFeedback != null && !promptFeedback.isEmpty()) {
            log.warn("Gemini prompt feedback contains blocks or warnings: {}", promptFeedback);
        }

        List candidates = (List) responseBody.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            log.warn("Gemini response returned 200 OK but candidates array is empty or blocked by safety filters.");
            throw new AiProviderException("Gemini returned no response candidates (blocked or empty).", false);
        }

        Map candidate = (Map) candidates.get(0);
        if (candidate == null) {
            throw new AiProviderException("Gemini candidate is null.", false);
        }

        String finishReason = (String) candidate.get("finishReason");
        if ("SAFETY".equalsIgnoreCase(finishReason) || "RECITATION".equalsIgnoreCase(finishReason)) {
            log.warn("Gemini candidate blocked. Finish reason: {}", finishReason);
            throw new AiProviderException("Gemini candidate blocked by safety filter: " + finishReason, false);
        }

        Map content = (Map) candidate.get("content");
        if (content == null) {
            throw new AiProviderException("Gemini content is null.", false);
        }

        List parts = (List) content.get("parts");
        if (parts == null || parts.isEmpty()) {
            throw new AiProviderException("Gemini content parts are null or empty.", false);
        }

        Map part = (Map) parts.get(0);
        if (part == null) {
            throw new AiProviderException("Gemini content part is null.", false);
        }

        String text = (String) part.get("text");
        if (text == null) {
            throw new AiProviderException("Gemini text content is null.", false);
        }

        return text;
    }
}
