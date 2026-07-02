package com.rentnest.controller;

import com.rentnest.dto.ApiResponse;
import com.rentnest.dto.ListingResponse;
import com.rentnest.dto.PublicUserProfileDTO;
import com.rentnest.dto.UserProfileDTO;
import com.rentnest.model.User;
import com.rentnest.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

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

    /**
     * Public profile — anyone can fetch a user's safe public info.
     * Only exposes: id, name, profilePhotoUrl, memberSince.
     */
    @GetMapping("/{id}/public")
    public ResponseEntity<ApiResponse<PublicUserProfileDTO>> getPublicProfile(@PathVariable UUID id) {
        return userService.findById(id)
                .map(user -> {
                    PublicUserProfileDTO dto = PublicUserProfileDTO.builder()
                            .id(user.getId())
                            .name(user.getName())
                            .profilePhotoUrl(user.getProfilePhotoUrl())
                            .memberSince(user.getCreatedAt())
                            .build();
                    return ResponseEntity.ok(ApiResponse.success(dto, "Public profile fetched"));
                })
                .orElse(ResponseEntity.status(404).body(ApiResponse.error("User not found")));
    }

    /**
     * Public listings for a user — returns all active listings posted by that user.
     */
    @GetMapping("/{id}/listings")
    public ResponseEntity<ApiResponse<List<ListingResponse>>> getPublicListings(@PathVariable UUID id) {
        List<ListingResponse> responses = userService.getPublicListingsForUser(id);
        return ResponseEntity.ok(ApiResponse.success(responses, "User listings fetched"));
    }
}
