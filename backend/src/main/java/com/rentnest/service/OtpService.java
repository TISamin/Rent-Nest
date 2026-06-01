package com.rentnest.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory OTP generation and verification service.
 * OTPs expire after 5 minutes and are cleaned up periodically.
 */
@Slf4j
@Service
public class OtpService {

    private static final int OTP_LENGTH = 6;
    private static final long OTP_EXPIRY_SECONDS = 300; // 5 minutes

    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();
    private final Random random = new Random();

    /**
     * Generate a 6-digit OTP for the given email address.
     * Overwrites any existing OTP for the same email.
     */
    public String generateOtp(String email) {
        String otp = String.format("%06d", random.nextInt(1_000_000));
        Instant expiresAt = Instant.now().plusSeconds(OTP_EXPIRY_SECONDS);
        otpStore.put(email.toLowerCase(), new OtpEntry(otp, expiresAt));
        log.info("OTP generated for email: {}", email);
        return otp;
    }

    /**
     * Verify the OTP for the given email.
     * Returns true if valid and not expired. Removes OTP after successful verification.
     */
    public boolean verifyOtp(String email, String otp) {
        String key = email.toLowerCase();
        OtpEntry entry = otpStore.get(key);

        if (entry == null) {
            log.warn("No OTP found for email: {}", email);
            return false;
        }

        if (Instant.now().isAfter(entry.expiresAt())) {
            log.warn("OTP expired for email: {}", email);
            otpStore.remove(key);
            return false;
        }

        if (!entry.otp().equals(otp)) {
            log.warn("Invalid OTP attempt for email: {}", email);
            return false;
        }

        otpStore.remove(key);
        log.info("OTP verified successfully for email: {}", email);
        return true;
    }

    /**
     * Scheduled cleanup of expired OTP entries every 5 minutes.
     */
    @Scheduled(fixedRate = 300_000)
    public void cleanupExpiredOtps() {
        Instant now = Instant.now();
        int before = otpStore.size();
        otpStore.entrySet().removeIf(e -> now.isAfter(e.getValue().expiresAt()));
        int removed = before - otpStore.size();
        if (removed > 0) {
            log.info("Cleaned up {} expired OTP entries", removed);
        }
    }

    private record OtpEntry(String otp, Instant expiresAt) {}
}
