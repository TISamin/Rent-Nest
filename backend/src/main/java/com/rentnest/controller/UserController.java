package com.rentnest.controller;

import com.rentnest.dto.ApiResponse;
import com.rentnest.dto.UserProfileDTO;
import com.rentnest.model.User;
import com.rentnest.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<User>> updateProfile(
            @AuthenticationPrincipal User currentUser,
            @Validated @RequestBody UserProfileDTO dto) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        }
        User updated = userService.updateProfile(currentUser, dto);
        return ResponseEntity.ok(ApiResponse.success(updated, "Profile updated successfully"));
    }
}
