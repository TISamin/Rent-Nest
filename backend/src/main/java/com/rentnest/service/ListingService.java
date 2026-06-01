package com.rentnest.service;

import com.rentnest.dto.ListingRequest;
import com.rentnest.model.Listing;
import com.rentnest.model.RoommateListing;
import com.rentnest.model.RoommateMember;
import com.rentnest.model.User;
import com.rentnest.model.enums.ListingCategory;
import com.rentnest.repository.ListingRepository;
import com.rentnest.repository.RoommateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ListingService {

    private final ListingRepository listingRepository;
    private final RoommateRepository roommateRepository;

    @Transactional
    public Listing createListing(User user, ListingRequest request) {
        Listing listing = Listing.builder()
                .user(user)
                .category(request.getCategory())
                .title(request.getTitle())
                .description(request.getDescription())
                .price(request.getPrice())
                .imageUrl(request.getImageUrl())
                .locationText(request.getLocationText())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .contactPhone(request.getContactPhone())
                .createdAt(LocalDateTime.now())
                .isActive(true)
                .build();

        Listing savedListing = listingRepository.save(listing);

        if (request.getCategory() == ListingCategory.ROOMMATE_FINDER && request.getRoommateInfo() != null) {
            ListingRequest.RoommateRequest roommateReq = request.getRoommateInfo();
            RoommateListing roommateListing = RoommateListing.builder()
                    .listing(savedListing)
                    .ownerPhotoUrl(roommateReq.getOwnerPhotoUrl())
                    .totalRoommatesWanted(roommateReq.getTotalRoommatesWanted())
                    .roommatesAlreadyHave(roommateReq.getRoommatesAlreadyHave())
                    .createdAt(LocalDateTime.now())
                    .members(new ArrayList<>())
                    .build();

            if (roommateReq.getMembers() != null) {
                for (ListingRequest.MemberRequest memberReq : roommateReq.getMembers()) {
                    RoommateMember member = RoommateMember.builder()
                            .roommateListing(roommateListing)
                            .memberDescription(memberReq.getMemberDescription())
                            .memberPhotoUrl(memberReq.getMemberPhotoUrl())
                            .build();
                    roommateListing.getMembers().add(member);
                }
            }
            roommateRepository.save(roommateListing);
            savedListing.setRoommateInfo(roommateListing);
        }

        return savedListing;
    }

    public Listing getListing(UUID id) {
        return listingRepository.findById(id)
                .orElseThrow(() -> new com.rentnest.exception.ResourceNotFoundException("Listing not found with ID: " + id));
    }

    @Transactional
    public Listing updateListing(UUID id, User user, ListingRequest request) {
        Listing listing = getListing(id);
        if (!listing.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You are not the owner of this listing.");
        }

        listing.setCategory(request.getCategory());
        listing.setTitle(request.getTitle());
        listing.setDescription(request.getDescription());
        listing.setPrice(request.getPrice());
        listing.setImageUrl(request.getImageUrl());
        listing.setLocationText(request.getLocationText());
        listing.setLatitude(request.getLatitude());
        listing.setLongitude(request.getLongitude());
        listing.setContactPhone(request.getContactPhone());

        if (listing.getCategory() == ListingCategory.ROOMMATE_FINDER && request.getRoommateInfo() != null) {
            ListingRequest.RoommateRequest roommateReq = request.getRoommateInfo();
            RoommateListing roommateListing = roommateRepository.findByListingId(id)
                    .orElse(RoommateListing.builder().listing(listing).build());

            roommateListing.setOwnerPhotoUrl(roommateReq.getOwnerPhotoUrl());
            roommateListing.setTotalRoommatesWanted(roommateReq.getTotalRoommatesWanted());
            roommateListing.setRoommatesAlreadyHave(roommateReq.getRoommatesAlreadyHave());
            roommateListing.getMembers().clear();

            if (roommateReq.getMembers() != null) {
                for (ListingRequest.MemberRequest memberReq : roommateReq.getMembers()) {
                    RoommateMember member = RoommateMember.builder()
                            .roommateListing(roommateListing)
                            .memberDescription(memberReq.getMemberDescription())
                            .memberPhotoUrl(memberReq.getMemberPhotoUrl())
                            .build();
                    roommateListing.getMembers().add(member);
                }
            }
            roommateRepository.save(roommateListing);
            listing.setRoommateInfo(roommateListing);
        }

        return listingRepository.save(listing);
    }

    @Transactional
    public void deleteListing(UUID id, User user) {
        Listing listing = getListing(id);
        if (!listing.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You are not the owner of this listing.");
        }
        listing.setIsActive(false);
        listingRepository.save(listing);
    }

    public List<Listing> getMyListings(User user) {
        return listingRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }
}
