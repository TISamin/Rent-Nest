package com.rentnest.dto;

import com.rentnest.model.Review;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ReviewResponse {
    private UUID id;
    private UUID listingId;
    // private UUID userId;
    private UUID reviewerId;
    private String userName;
    private String userPhotoUrl;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ReviewResponse fromEntity(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .listingId(review.getListing().getId())
                // .userId(review.getUser() != null ? review.getUser().getId() : null)
                .reviewerId(review.getUser() != null ? review.getUser().getId() : null)
                .userName(review.getUser() != null ? review.getUser().getName() : "Deleted User")
                .userPhotoUrl(review.getUser() != null ? review.getUser().getProfilePhotoUrl() : null)
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}
