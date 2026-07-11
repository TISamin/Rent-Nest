package com.rentnest.service;

import com.rentnest.exception.AiProviderException;

/**
 * Interface definition for an AI completion provider.
 */
public interface AiProvider {
    /**
     * Complete a prompt yielding a plain text response.
     */
    String complete(String systemPrompt, String userPrompt) throws AiProviderException;

    /**
     * Complete a prompt requiring a structured JSON response.
     */
    String completeJson(String systemPrompt, String userPrompt) throws AiProviderException;
}
