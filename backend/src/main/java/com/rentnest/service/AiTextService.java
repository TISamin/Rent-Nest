package com.rentnest.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rentnest.exception.AiProviderException;
import com.rentnest.model.enums.ListingCategory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiTextService {

    private final GeminiProvider geminiProvider;
    private final GroqProvider groqProvider;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String generateListingDescription(Map<String, Object> fields) throws Exception {
        String systemPrompt = "You are a professional real estate copywriter. Write a concise, appealing 2-4 sentence listing description using ONLY the facts provided. Explicitly do NOT invent or assume any amenities, features, layout details, or claims that are not explicitly given in the input facts.";
        
        String userPrompt = buildDescriptionUserPrompt(fields);

        try {
            return geminiProvider.complete(systemPrompt, userPrompt);
        } catch (AiProviderException e) {
            if (e.isQuotaOrAvailability()) {
                log.info("Gemini unavailable — served via Groq fallback");
                try {
                    return groqProvider.complete(systemPrompt, userPrompt);
                } catch (Exception ex) {
                    log.error("Groq fallback also failed for generateListingDescription: {}", ex.getMessage());
                    throw ex;
                }
            } else {
                // Safety blocked, do not retry Groq
                throw e;
            }
        }
    }

    public Map<String, Object> parseSearchQuery(String query) throws Exception {
        String systemPrompt = buildParserSystemPrompt();
        String userPrompt = "Parse the following natural language query: \"" + query + "\"";

        String jsonResponse = null;
        try {
            jsonResponse = geminiProvider.completeJson(systemPrompt, userPrompt);
        } catch (AiProviderException e) {
            if (e.isQuotaOrAvailability()) {
                log.info("Gemini unavailable — served via Groq fallback");
                try {
                    jsonResponse = groqProvider.completeJson(systemPrompt, userPrompt);
                } catch (Exception ex) {
                    log.error("Groq fallback also failed for parseSearchQuery: {}", ex.getMessage());
                    throw ex;
                }
            } else {
                throw e;
            }
        }

        try {
            return cleanAndParseJson(jsonResponse);
        } catch (Exception e) {
            log.warn("Failed to parse JSON response. Retrying once... Raw: {}", jsonResponse);
            // Retry parser instruction
            String retryUserPrompt = userPrompt + "\nRemember: return ONLY a raw JSON object. Do not wrap in markdown or add text.";
            try {
                String retryJson = geminiProvider.completeJson(systemPrompt, retryUserPrompt);
                return cleanAndParseJson(retryJson);
            } catch (Exception ex) {
                log.error("Retry parsing also failed: {}", ex.getMessage());
                // Return fallback empty map rather than crashing
                Map<String, Object> fallback = new HashMap<>();
                fallback.put("locationText", null);
                fallback.put("category", null);
                fallback.put("priceMax", null);
                fallback.put("bedroomCount", null);
                fallback.put("radius", null);
                return fallback;
            }
        }
    }

    private String buildDescriptionUserPrompt(Map<String, Object> fields) {
        StringBuilder sb = new StringBuilder("Listing details:\n");
        fields.forEach((k, v) -> {
            if (v != null && !v.toString().trim().isEmpty()) {
                sb.append("- ").append(k).append(": ").append(v).append("\n");
            }
        });
        return sb.toString();
    }

    private String buildParserSystemPrompt() {
        // Build list of valid rental ListingCategory enums
        List<String> categories = List.of(
                ListingCategory.FLAT.name(),
                ListingCategory.HOUSE.name(),
                ListingCategory.HOTEL.name(),
                ListingCategory.CONVENTION_HALL.name()
        );

        return "You are an assistant that parses user search queries into filter parameters.\n" +
                "You MUST respond with STRICT JSON ONLY. No prose, no conversation, no markdown code block formatting (i.e. do not use ```json wrappers).\n" +
                "The JSON object must have EXACTLY the following fields:\n" +
                "{\n" +
                "  \"locationText\": string or null,\n" +
                "  \"category\": one of " + categories + " or null,\n" +
                "  \"priceMax\": number or null (e.g. 20000 for 'under 20k', etc. Parse 'k' as thousand),\n" +
                "  \"bedroomCount\": number or null,\n" +
                "  \"radius\": number or null (in meters)\n" +
                "}\n" +
                "Extract as much relevant detail as possible using only facts from the input.";
    }

    private Map<String, Object> cleanAndParseJson(String jsonStr) throws Exception {
        if (jsonStr == null) {
            throw new IllegalArgumentException("JSON string is null");
        }
        String clean = jsonStr.trim();
        if (clean.startsWith("```")) {
            // Strip markdown block format if present
            clean = clean.replaceAll("^```[a-zA-Z]*\\s*", "");
            clean = clean.replaceAll("\\s*```$", "");
        }
        clean = clean.trim();
        return objectMapper.readValue(clean, Map.class);
    }
}
