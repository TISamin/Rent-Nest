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
 * Supports nested data for residential, convention, service, and roommate categories.
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

    /** Legacy single price field — kept for backward compatibility */
    private BigDecimal price;

    /** New price range fields */
    private BigDecimal priceMin;
    private BigDecimal priceMax;
    private String priceUnit;

    private String imageUrl;

    private String locationText;

    private BigDecimal latitude;

    private BigDecimal longitude;

    private String contactPhone;

    // ---- Category-specific nested data ----

    /** Residential detail — for FLAT, HOUSE, HOTEL */
    private Integer bedroomCount;
    private Integer bathroomCount;
    private Integer otherRoomsCount;

    /** Room details — for FLAT, HOUSE, HOTEL */
    @Valid
    private List<RoomRequest> rooms;

    /** Amenities — for FLAT, HOUSE, HOTEL, CONVENTION_HALL, ROOMMATE_FINDER */
    private List<String> amenities;

    /** Convention detail — for CONVENTION_HALL */
    private Integer capacity;
    private Integer hallCount;

    /** Service offerings — for SHIFTING_SERVICE, CATERING_SERVICE, etc. */
    @Valid
    private List<OfferingRequest> offerings;

    /** Roommate-specific data — for ROOMMATE_FINDER */
    @Valid
    private RoommateRequest roommateInfo;

    // ---- Nested DTOs ----

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RoomRequest {
        private String roomType;
        private String description;
        private List<String> imageUrls;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OfferingRequest {
        private String offeringName;
        private BigDecimal priceMin;
        private BigDecimal priceMax;
        private String description;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RoommateRequest {
        private String ownerPhotoUrl;
        private Integer totalRoommatesWanted;
        private Integer roommatesAlreadyHave;
        private Integer budgetMin;
        private Integer budgetMax;

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
