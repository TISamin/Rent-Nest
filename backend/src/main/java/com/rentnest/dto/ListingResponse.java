package com.rentnest.dto;

import com.rentnest.model.*;
import com.rentnest.model.enums.ListingCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Response DTO for listing details, including owner info and all category-specific data.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingResponse {

    private UUID id;
    private ListingCategory category;
    private String title;
    private String description;
    private BigDecimal price;
    private BigDecimal priceMin;
    private BigDecimal priceMax;
    private String priceUnit;
    private String imageUrl;
    private String locationText;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String contactPhone;
    private LocalDateTime createdAt;
    private Boolean isActive;
    private Double distanceMetres;

    // Owner info (flattened from User)
    private UUID userId;
    private String userName;
    private String userPhone;
    private String userPhotoUrl;

    // Category-specific nested data
    private ResidentialInfo residentialInfo;
    private ConventionInfo conventionInfo;
    private List<RoomInfo> rooms;
    private List<String> amenities;
    private List<OfferingInfo> offerings;
    private RoommateInfo roommateInfo;

    // ---- Nested response DTOs ----

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ResidentialInfo {
        private Integer bedroomCount;
        private Integer bathroomCount;
        private Integer otherRoomsCount;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ConventionInfo {
        private Integer capacity;
        private Integer hallCount;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RoomInfo {
        private UUID id;
        private String roomType;
        private String description;
        private List<String> imageUrls;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class OfferingInfo {
        private UUID id;
        private String offeringName;
        private BigDecimal priceMin;
        private BigDecimal priceMax;
        private String description;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RoommateInfo {
        private UUID id;
        private String ownerPhotoUrl;
        private Integer totalRoommatesWanted;
        private Integer roommatesAlreadyHave;
        private Integer budgetMin;
        private Integer budgetMax;
        private List<MemberInfo> members;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class MemberInfo {
        private UUID id;
        private String memberDescription;
        private String memberPhotoUrl;
    }

    /**
     * Build a ListingResponse from a Listing entity, including all nested data.
     */
    public static ListingResponse fromEntity(Listing listing) {
        ListingResponseBuilder builder = ListingResponse.builder()
                .id(listing.getId())
                .category(listing.getCategory())
                .title(listing.getTitle())
                .description(listing.getDescription())
                .price(listing.getPriceMin()) // backward compat
                .priceMin(listing.getPriceMin())
                .priceMax(listing.getPriceMax())
                .priceUnit(listing.getPriceUnit() != null ? listing.getPriceUnit() : "month")
                .imageUrl(listing.getImageUrl())
                .locationText(listing.getLocationText())
                .latitude(listing.getLatitude())
                .longitude(listing.getLongitude())
                .contactPhone(listing.getContactPhone())
                .createdAt(listing.getCreatedAt())
                .isActive(listing.getIsActive());

        // Flatten user info
        if (listing.getUser() != null) {
            builder.userId(listing.getUser().getId())
                   .userName(listing.getUser().getName())
                   .userPhone(listing.getUser().getPhoneNumber())
                   .userPhotoUrl(listing.getUser().getProfilePhotoUrl());
        }

        // Map residential detail
        if (listing.getResidentialDetail() != null) {
            ResidentialDetail rd = listing.getResidentialDetail();
            builder.residentialInfo(ResidentialInfo.builder()
                    .bedroomCount(rd.getBedroomCount())
                    .bathroomCount(rd.getBathroomCount())
                    .otherRoomsCount(rd.getOtherRoomsCount())
                    .build());
        }

        // Map convention detail
        if (listing.getConventionDetail() != null) {
            ConventionDetail cd = listing.getConventionDetail();
            builder.conventionInfo(ConventionInfo.builder()
                    .capacity(cd.getCapacity())
                    .hallCount(cd.getHallCount())
                    .build());
        }

        // Map room details
        if (listing.getRoomDetails() != null && !listing.getRoomDetails().isEmpty()) {
            builder.rooms(listing.getRoomDetails().stream()
                    .map(r -> RoomInfo.builder()
                            .id(r.getId())
                            .roomType(r.getRoomType())
                            .description(r.getDescription())
                            .imageUrls(r.getImageUrls() != null && !r.getImageUrls().isBlank()
                                    ? List.of(r.getImageUrls().split(","))
                                    : Collections.emptyList())
                            .build())
                    .collect(Collectors.toList()));
        }

        // Map amenities
        if (listing.getAmenities() != null && !listing.getAmenities().isEmpty()) {
            builder.amenities(listing.getAmenities().stream()
                    .map(ListingAmenity::getAmenityName)
                    .collect(Collectors.toList()));
        }

        // Map service offerings
        if (listing.getServiceOfferings() != null && !listing.getServiceOfferings().isEmpty()) {
            builder.offerings(listing.getServiceOfferings().stream()
                    .map(s -> OfferingInfo.builder()
                            .id(s.getId())
                            .offeringName(s.getOfferingName())
                            .priceMin(s.getPriceMin())
                            .priceMax(s.getPriceMax())
                            .description(s.getDescription())
                            .build())
                    .collect(Collectors.toList()));
        }

        // Map roommate extension if present
        if (listing.getRoommateListing() != null) {
            RoommateListing rl = listing.getRoommateListing();
            List<MemberInfo> memberInfos = rl.getMembers() != null
                    ? rl.getMembers().stream()
                        .map(m -> MemberInfo.builder()
                                .id(m.getId())
                                .memberDescription(m.getMemberDescription())
                                .memberPhotoUrl(m.getMemberPhotoUrl())
                                .build())
                        .collect(Collectors.toList())
                    : Collections.emptyList();

            builder.roommateInfo(RoommateInfo.builder()
                    .id(rl.getId())
                    .ownerPhotoUrl(rl.getOwnerPhotoUrl())
                    .totalRoommatesWanted(rl.getTotalRoommatesWanted())
                    .roommatesAlreadyHave(rl.getRoommatesAlreadyHave())
                    .budgetMin(rl.getBudgetMin())
                    .budgetMax(rl.getBudgetMax())
                    .members(memberInfos)
                    .build());
        }

        return builder.build();
    }
}
