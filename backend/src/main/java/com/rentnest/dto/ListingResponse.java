package com.rentnest.dto;

import com.rentnest.model.Listing;
import com.rentnest.model.RoommateListing;
import com.rentnest.model.RoommateMember;
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
 * Response DTO for listing details, including owner info and optional roommate data.
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
    private String imageUrl;
    private String locationText;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String contactPhone;
    private LocalDateTime createdAt;
    private Boolean isActive;

    // Owner info (flattened from User)
    private UUID userId;
    private String userName;
    private String userPhone;
    private String userPhotoUrl;

    // Roommate info (null if not a ROOMMATE_FINDER listing)
    private RoommateInfo roommateInfo;

    // ---- Nested response DTOs ----

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RoommateInfo {
        private UUID id;
        private String ownerPhotoUrl;
        private Integer totalRoommatesWanted;
        private Integer roommatesAlreadyHave;
        private List<MemberInfo> members;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MemberInfo {
        private UUID id;
        private String memberDescription;
        private String memberPhotoUrl;
    }

    /**
     * Build a ListingResponse from a Listing entity, including user and roommate data.
     */
    public static ListingResponse fromEntity(Listing listing) {
        ListingResponseBuilder builder = ListingResponse.builder()
                .id(listing.getId())
                .category(listing.getCategory())
                .title(listing.getTitle())
                .description(listing.getDescription())
                .price(listing.getPrice())
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
                    .members(memberInfos)
                    .build());
        }

        return builder.build();
    }
}
