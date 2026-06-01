package com.rentnest.controller;

import com.rentnest.dto.ApiResponse;
import com.rentnest.dto.ListingRequest;
import com.rentnest.dto.ListingResponse;
import com.rentnest.model.Listing;
import com.rentnest.model.User;
import com.rentnest.service.ListingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/listings")
@RequiredArgsConstructor
public class ListingController {

    private final ListingService listingService;

    @PostMapping
    public ResponseEntity<ApiResponse<ListingResponse>> createListing(
            @AuthenticationPrincipal User user,
            @Validated @RequestBody ListingRequest request) {
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        }
        Listing listing = listingService.createListing(user, request);
        return ResponseEntity.ok(ApiResponse.success(ListingResponse.fromEntity(listing), "Listing created successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ListingResponse>> getListing(@PathVariable UUID id) {
        Listing listing = listingService.getListing(id);
        return ResponseEntity.ok(ApiResponse.success(ListingResponse.fromEntity(listing), "Listing retrieved successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ListingResponse>> updateListing(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            @Validated @RequestBody ListingRequest request) {
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        }
        Listing listing = listingService.updateListing(id, user, request);
        return ResponseEntity.ok(ApiResponse.success(ListingResponse.fromEntity(listing), "Listing updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteListing(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        }
        listingService.deleteListing(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Listing deleted successfully"));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<ListingResponse>>> getMyListings(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        }
        List<Listing> listings = listingService.getMyListings(user);
        List<ListingResponse> responses = listings.stream()
                .map(ListingResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(responses, "User listings retrieved successfully"));
    }
}
