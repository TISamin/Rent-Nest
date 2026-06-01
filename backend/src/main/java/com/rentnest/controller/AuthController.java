package com.rentnest.controller;

import com.rentnest.config.JwtTokenProvider;
import com.rentnest.dto.ApiResponse;
import com.rentnest.model.User;
import com.rentnest.service.AuthService;
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
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/verify-token")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyToken(@RequestBody TokenRequest request) {
        try {
            String phoneNumber = authService.verifyFirebaseToken(request.getIdToken());
            User user = authService.findOrCreateUser(phoneNumber);
            String jwt = jwtTokenProvider.generateToken(user.getId(), user.getPhoneNumber());

            Map<String, Object> data = new HashMap<>();
            data.put("token", jwt);
            data.put("user", user);

            return ResponseEntity.ok(ApiResponse.success(data, "Token verified successfully"));
        } catch (Exception e) {
            log.error("Token verification failed", e);
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
    public static class TokenRequest {
        private String idToken;
    }
}
