package com.rentnest.controller;

import com.rentnest.dto.ApiResponse;
import com.rentnest.dto.ReviewRequest;
import com.rentnest.dto.ReviewResponse;
import com.rentnest.model.User;
import com.rentnest.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReviewResponse>> addReview(
            @AuthenticationPrincipal User user,
            @RequestBody ReviewRequest request) {
        ReviewResponse review = reviewService.addReview(user, request);
        return ResponseEntity.ok(ApiResponse.success(review, "Review added successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ReviewResponse>> updateReview(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            @RequestBody ReviewRequest request) {
        ReviewResponse review = reviewService.updateReview(id, user, request);
        return ResponseEntity.ok(ApiResponse.success(review, "Review updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        reviewService.deleteReview(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Review deleted successfully"));
    }

    @GetMapping("/listing/{listingId}")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getReviews(
            @PathVariable UUID listingId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ReviewResponse> reviews = reviewService.getReviewsByListing(listingId, page, size);
        return ResponseEntity.ok(ApiResponse.success(reviews, "Reviews fetched"));
    }
}
