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
public class GroqProvider implements AiProvider {

    private final RestTemplate restTemplate;

    @Value("${ai.groq.api-key}")
    private String apiKey;

    @Value("${ai.groq.model}")
    private String model;

    public GroqProvider(RestTemplateBuilder restTemplateBuilder) {
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(15))
                .setReadTimeout(Duration.ofSeconds(30))
                .build();
    }

    @Override
    public String complete(String systemPrompt, String userPrompt) throws AiProviderException {
        return callGroq(systemPrompt, userPrompt, false);
    }

    @Override
    public String completeJson(String systemPrompt, String userPrompt) throws AiProviderException {
        return callGroq(systemPrompt, userPrompt, true);
    }

    private String callGroq(String systemPrompt, String userPrompt, boolean jsonMode) throws AiProviderException {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new AiProviderException("Groq API key is not configured.", true);
        }

        String url = "https://api.groq.com/openai/v1/chat/completions";

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);

        List<Map<String, String>> messages = new ArrayList<>();
        if (systemPrompt != null && !systemPrompt.trim().isEmpty()) {
            messages.add(Map.of("role", "system", "content", systemPrompt));
        }
        messages.add(Map.of("role", "user", "content", userPrompt));
        requestBody.put("messages", messages);

        if (jsonMode) {
            requestBody.put("response_format", Map.of("type", "json_object"));
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return parseGroqResponse(response.getBody());
            } else {
                throw new AiProviderException("Groq returned non-2xx status: " + response.getStatusCode(), true);
            }
        } catch (HttpStatusCodeException e) {
            log.warn("Groq HTTP error status code: {}", e.getStatusCode());
            boolean isQuotaOrAvail = e.getStatusCode().value() == 429 || e.getStatusCode().is5xxServerError();
            throw new AiProviderException("Groq service failed with HTTP: " + e.getStatusCode(), e, isQuotaOrAvail);
        } catch (AiProviderException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Groq communication failure: {}", e.getMessage());
            throw new AiProviderException("Groq communication failed: " + e.getMessage(), e, true);
        }
    }

    private String parseGroqResponse(Map responseBody) throws AiProviderException {
        List choices = (List) responseBody.get("choices");
        if (choices == null || choices.isEmpty()) {
            throw new AiProviderException("Groq response choices are null or empty.", true);
        }

        Map choice = (Map) choices.get(0);
        if (choice == null) {
            throw new AiProviderException("Groq first choice is null.", true);
        }

        Map message = (Map) choice.get("message");
        if (message == null) {
            throw new AiProviderException("Groq choice message is null.", true);
        }

        String content = (String) message.get("content");
        if (content == null) {
            throw new AiProviderException("Groq message content is null.", true);
        }

        return content;
    }
}
