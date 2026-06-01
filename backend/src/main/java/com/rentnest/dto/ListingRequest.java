package com.rentnest.dto;

import com.rentnest.model.enums.ListingCategory;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Request DTO for creating or updating a listing.
 * Includes optional nested roommate data for ROOMMATE_FINDER category.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingRequest {

    @NotNull(message = "Category is required")
    private ListingCategory category;

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    private String description;

    private BigDecimal price;

    private String imageUrl;

    private String locationText;

    private BigDecimal latitude;

    private BigDecimal longitude;

    private String contactPhone;

    /** Roommate-specific data — only required when category is ROOMMATE_FINDER */
    @Valid
    private RoommateRequest roommateInfo;

    // ---- Nested DTOs ----

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RoommateRequest {
        private String ownerPhotoUrl;
        private Integer totalRoommatesWanted;
        private Integer roommatesAlreadyHave;

        @Valid
        private List<MemberRequest> members;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MemberRequest {
        private String memberDescription;
        private String memberPhotoUrl;
    }
}
