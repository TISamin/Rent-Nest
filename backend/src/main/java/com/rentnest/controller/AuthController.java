package com.rentnest.controller;

import com.rentnest.config.JwtTokenProvider;
import com.rentnest.dto.ApiResponse;
import com.rentnest.model.User;
import com.rentnest.service.AuthService;
import com.rentnest.service.OtpService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * Generate an OTP for the given email and return it.
     * The frontend will send this OTP to the user via EmailJS.
     */
    @PostMapping("/request-otp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> requestOtp(@RequestBody OtpRequest request) {
        try {
            String email = request.getEmail();
            if (email == null || email.isBlank()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Email is required"));
            }

            String otp = otpService.generateOtp(email);

            Map<String, Object> data = new HashMap<>();
            data.put("otp", otp);
            data.put("email", email);

            log.info("OTP requested for email: {}", email);
            return ResponseEntity.ok(ApiResponse.success(data, "OTP generated successfully"));
        } catch (Exception e) {
            log.error("OTP generation failed", e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to generate OTP: " + e.getMessage()));
        }
    }

    /**
     * Verify the OTP and return a JWT token if valid.
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyOtp(@RequestBody VerifyOtpRequest request) {
        try {
            String email = request.getEmail();
            String otp = request.getOtp();

            if (email == null || email.isBlank() || otp == null || otp.isBlank()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Email and OTP are required"));
            }

            boolean isValid = otpService.verifyOtp(email, otp);
            if (!isValid) {
                return ResponseEntity.status(401).body(ApiResponse.error("Invalid or expired verification code"));
            }

            User user = authService.findOrCreateUserByEmail(email);
            String jwt = jwtTokenProvider.generateToken(user.getId(), user.getEmail());

            Map<String, Object> data = new HashMap<>();
            data.put("token", jwt);
            data.put("user", user);

            log.info("User authenticated via email OTP: {}", email);
            return ResponseEntity.ok(ApiResponse.success(data, "Authentication successful"));
        } catch (Exception e) {
            log.error("OTP verification failed", e);
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication failed: " + e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<User>> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        }
        return ResponseEntity.ok(ApiResponse.success(user, "Current user fetched successfully"));
    }

    @Data
    public static class OtpRequest {
        private String email;
    }

    @Data
    public static class VerifyOtpRequest {
        private String email;
        private String otp;
    }
}
