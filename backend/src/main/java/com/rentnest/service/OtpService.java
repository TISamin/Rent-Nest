package com.rentnest.service;

import com.rentnest.model.OtpToken;
import com.rentnest.repository.OtpTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.Random;

/**
 * OTP generation and verification service backed by the database.
 * OTPs expire after 5 minutes and are cleaned up periodically.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private static final int OTP_LENGTH = 6;
    private static final long OTP_EXPIRY_SECONDS = 300; // 5 minutes

    private final OtpTokenRepository otpTokenRepository;
    private final Random random = new Random();

    /**
     * Generate a 6-digit OTP for the given email address and persist it.
     */
    public String generateOtp(String email) {
        String otp = String.format("%06d", random.nextInt(1_000_000));
        Instant expiresAt = Instant.now().plusSeconds(OTP_EXPIRY_SECONDS);
        
        OtpToken token = OtpToken.builder()
                .email(email.toLowerCase())
                .otp(otp)
                .expiresAt(expiresAt)
                .used(false)
                .build();
                
        otpTokenRepository.save(token);
        log.info("OTP generated and saved for email: {}", email);
        return otp;
    }

    /**
     * Verify the OTP for the given email.
     * Returns true if valid, not expired, and not used. Marks OTP as used after successful verification.
     */
    @Transactional
    public boolean verifyOtp(String email, String otp) {
        String key = email.toLowerCase();
        Optional<OtpToken> optionalToken = otpTokenRepository.findTopByEmailOrderByCreatedAtDesc(key);

        if (optionalToken.isEmpty()) {
            log.warn("No OTP found for email: {}", email);
            return false;
        }

        OtpToken token = optionalToken.get();

        if (token.isUsed()) {
            log.warn("OTP already used for email: {}", email);
            return false;
        }

        if (Instant.now().isAfter(token.getExpiresAt())) {
            log.warn("OTP expired for email: {}", email);
            return false;
        }

        if (!token.getOtp().equals(otp)) {
            log.warn("Invalid OTP attempt for email: {}", email);
            return false;
        }

        token.setUsed(true);
        otpTokenRepository.save(token);
        log.info("OTP verified successfully for email: {}", email);
        return true;
    }

    /**
     * Scheduled cleanup of expired OTP entries every 5 minutes.
     */
    @Scheduled(fixedRate = 300_000)
    public void cleanupExpiredOtps() {
        otpTokenRepository.deleteExpired(Instant.now());
        log.info("Cleaned up expired OTP entries from database");
    }
}
