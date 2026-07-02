package com.rentnest.controller;

import com.rentnest.dto.ApiResponse;
import com.rentnest.dto.ListingResponse;
import com.rentnest.model.User;
import com.rentnest.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @PostMapping("/toggle/{listingId}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> toggleWishlist(
            @AuthenticationPrincipal User user,
            @PathVariable UUID listingId) {
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        }
        boolean added = wishlistService.toggleWishlist(user, listingId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("added", added), 
                added ? "Added to wishlist" : "Removed from wishlist"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ListingResponse>>> getWishlist(
            @AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        }
        List<ListingResponse> wishlist = wishlistService.getWishlist(user);
        return ResponseEntity.ok(ApiResponse.success(wishlist, "Wishlist retrieved successfully"));
    }

    @PostMapping("/check")
    public ResponseEntity<ApiResponse<List<UUID>>> checkWishlisted(
            @AuthenticationPrincipal User user,
            @RequestBody List<UUID> listingIds) {
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        }
        List<UUID> wishlistedIds = wishlistService.checkWishlisted(user, listingIds);
        return ResponseEntity.ok(ApiResponse.success(wishlistedIds, "Checked wishlist status successfully"));
    }
}
