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
     * Standard email/password login.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@RequestBody LoginRequest request) {
        try {
            String email = request.getEmail();
            String password = request.getPassword();

            if (email == null || email.isBlank() || password == null || password.isBlank()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Email and password are required"));
            }

            User user = authService.loginWithPassword(email, password);
            String jwt = jwtTokenProvider.generateToken(user.getId(), user.getEmail());

            Map<String, Object> data = new HashMap<>();
            data.put("token", jwt);
            data.put("user", user);

            log.info("User logged in with password: {}", email);
            return ResponseEntity.ok(ApiResponse.success(data, "Login successful"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Login failed", e);
            return ResponseEntity.status(500).body(ApiResponse.error("Internal server error: " + e.getMessage()));
        }
    }

    /**
     * Signup OTP Request (Checks if email exists first).
     */
    @PostMapping("/signup/request-otp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> signupRequestOtp(@RequestBody OtpRequest request) {
        try {
            String email = request.getEmail();
            if (email == null || email.isBlank()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Email is required"));
            }

            if (authService.findUserByEmail(email).isPresent()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("An account with this email already exists"));
            }

            String otp = otpService.generateOtp(email);

            Map<String, Object> data = new HashMap<>();
            data.put("otp", otp);
            data.put("email", email);

            log.info("Signup OTP requested for email: {}", email);
            return ResponseEntity.ok(ApiResponse.success(data, "OTP generated successfully"));
        } catch (Exception e) {
            log.error("Signup OTP request failed", e);
            return ResponseEntity.status(500).body(ApiResponse.error("Failed to generate OTP: " + e.getMessage()));
        }
    }

    /**
     * Signup OTP Verification (Registers user on success).
     */
    @PostMapping("/signup/verify-otp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> signupVerifyOtp(@RequestBody VerifyOtpRequest request) {
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

            User user = authService.signupUserByEmail(email);
            String jwt = jwtTokenProvider.generateToken(user.getId(), user.getEmail());

            Map<String, Object> data = new HashMap<>();
            data.put("token", jwt);
            data.put("user", user);

            log.info("User registered via email signup OTP: {}", email);
            return ResponseEntity.ok(ApiResponse.success(data, "Signup verification successful"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Signup OTP verification failed", e);
            return ResponseEntity.status(500).body(ApiResponse.error("Verification failed: " + e.getMessage()));
        }
    }

    /**
     * Forgot Password OTP Request (Checks if email exists first).
     */
    @PostMapping("/forgot-password/request-otp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> forgotPasswordRequestOtp(@RequestBody OtpRequest request) {
        try {
            String email = request.getEmail();
            if (email == null || email.isBlank()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Email is required"));
            }

            if (authService.findUserByEmail(email).isEmpty()) {
                return ResponseEntity.status(404).body(ApiResponse.error("No account found with this email"));
            }

            String otp = otpService.generateOtp(email);

            Map<String, Object> data = new HashMap<>();
            data.put("otp", otp);
            data.put("email", email);

            log.info("Forgot password OTP requested for email: {}", email);
            return ResponseEntity.ok(ApiResponse.success(data, "OTP generated successfully"));
        } catch (Exception e) {
            log.error("Forgot password OTP request failed", e);
            return ResponseEntity.status(500).body(ApiResponse.error("Failed to generate OTP: " + e.getMessage()));
        }
    }

    /**
     * Forgot Password Reset (Verifies OTP and sets new password).
     */
    @PostMapping("/forgot-password/reset")
    public ResponseEntity<ApiResponse<Void>> forgotPasswordReset(@RequestBody ForgotPasswordResetRequest request) {
        try {
            String email = request.getEmail();
            String otp = request.getOtp();
            String password = request.getPassword();

            if (email == null || email.isBlank() || otp == null || otp.isBlank() || password == null || password.isBlank()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Email, OTP, and password are required"));
            }

            boolean isValid = otpService.verifyOtp(email, otp);
            if (!isValid) {
                return ResponseEntity.status(401).body(ApiResponse.error("Invalid or expired verification code"));
            }

            User user = authService.findUserByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("No account found with this email"));

            authService.setPassword(user, password);

            log.info("Password reset successfully for user: {}", email);
            return ResponseEntity.ok(ApiResponse.success(null, "Password reset successful"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Password reset failed", e);
            return ResponseEntity.status(500).body(ApiResponse.error("Failed to reset password: " + e.getMessage()));
        }
    }

    /**
     * Mandatory post-auth set password.
     */
    @PostMapping("/set-password")
    public ResponseEntity<ApiResponse<User>> setPassword(@AuthenticationPrincipal User user, @RequestBody SetPasswordRequest request) {
        try {
            if (user == null) {
                return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
            }

            String password = request.getPassword();
            if (password == null || password.isBlank()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Password is required"));
            }

            authService.setPassword(user, password);
            return ResponseEntity.ok(ApiResponse.success(user, "Password set successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Set password failed", e);
            return ResponseEntity.status(500).body(ApiResponse.error("Failed to set password: " + e.getMessage()));
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
    public static class LoginRequest {
        private String email;
        private String password;
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

    @Data
    public static class ForgotPasswordResetRequest {
        private String email;
        private String otp;
        private String password;
    }

    @Data
    public static class SetPasswordRequest {
        private String password;
    }
}
