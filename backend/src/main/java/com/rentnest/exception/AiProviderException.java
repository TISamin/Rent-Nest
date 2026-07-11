package com.rentnest.exception;

/**
 * Custom exception representing a failure in an AI provider API call.
 */
public class AiProviderException extends Exception {
    private final boolean isQuotaOrAvailability;

    public AiProviderException(String message, boolean isQuotaOrAvailability) {
        super(message);
        this.isQuotaOrAvailability = isQuotaOrAvailability;
    }

    public AiProviderException(String message, Throwable cause, boolean isQuotaOrAvailability) {
        super(message, cause);
        this.isQuotaOrAvailability = isQuotaOrAvailability;
    }

    public boolean isQuotaOrAvailability() {
        return isQuotaOrAvailability;
    }
}
