package com.rentnest.service;

import com.rentnest.dto.ListingRequest;
import com.rentnest.model.*;
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
        // Resolve price: prefer priceMin/priceMax; fall back to legacy 'price' field
        var priceMin = request.getPriceMin() != null ? request.getPriceMin() : request.getPrice();
        var priceMax = request.getPriceMax();

        Listing listing = Listing.builder()
                .user(user)
                .category(request.getCategory())
                .title(request.getTitle())
                .description(request.getDescription())
                .priceMin(priceMin)
                .priceMax(priceMax)
                .imageUrl(request.getImageUrl())
                .locationText(request.getLocationText())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .contactPhone(request.getContactPhone())
                .createdAt(LocalDateTime.now())
                .isActive(true)
                .build();

        Listing savedListing = listingRepository.save(listing);

        // --- Residential Detail (FLAT, HOUSE, HOTEL) ---
        ListingCategory cat = request.getCategory();
        if ((cat == ListingCategory.FLAT || cat == ListingCategory.HOUSE || cat == ListingCategory.HOTEL)
                && (request.getBedroomCount() != null || request.getBathroomCount() != null)) {
            ResidentialDetail rd = ResidentialDetail.builder()
                    .listing(savedListing)
                    .bedroomCount(request.getBedroomCount() != null ? request.getBedroomCount() : 0)
                    .bathroomCount(request.getBathroomCount() != null ? request.getBathroomCount() : 0)
                    .otherRoomsCount(request.getOtherRoomsCount() != null ? request.getOtherRoomsCount() : 0)
                    .build();
            savedListing.setResidentialDetail(rd);
        }

        // --- Room Details ---
        if (request.getRooms() != null && !request.getRooms().isEmpty()) {
            List<RoomDetail> roomDetails = new ArrayList<>();
            for (ListingRequest.RoomRequest roomReq : request.getRooms()) {
                RoomDetail room = RoomDetail.builder()
                        .listing(savedListing)
                        .roomType(roomReq.getRoomType())
                        .description(roomReq.getDescription())
                        .imageUrls(roomReq.getImageUrls() != null ? String.join(",", roomReq.getImageUrls()) : null)
                        .build();
                roomDetails.add(room);
            }
            savedListing.setRoomDetails(roomDetails);
        }

        // --- Convention Detail ---
        if (cat == ListingCategory.CONVENTION_HALL && request.getCapacity() != null) {
            ConventionDetail cd = ConventionDetail.builder()
                    .listing(savedListing)
                    .capacity(request.getCapacity())
                    .hallCount(request.getHallCount() != null ? request.getHallCount() : 1)
                    .build();
            savedListing.setConventionDetail(cd);
        }

        // --- Amenities ---
        if (request.getAmenities() != null && !request.getAmenities().isEmpty()) {
            List<ListingAmenity> amenityList = new ArrayList<>();
            for (String name : request.getAmenities()) {
                ListingAmenity amenity = ListingAmenity.builder()
                        .listing(savedListing)
                        .amenityName(name)
                        .build();
                amenityList.add(amenity);
            }
            savedListing.setAmenities(amenityList);
        }

        // --- Service Offerings ---
        if (request.getOfferings() != null && !request.getOfferings().isEmpty()) {
            List<ServiceOffering> offeringList = new ArrayList<>();
            for (ListingRequest.OfferingRequest ofReq : request.getOfferings()) {
                ServiceOffering offering = ServiceOffering.builder()
                        .listing(savedListing)
                        .offeringName(ofReq.getOfferingName())
                        .priceMin(ofReq.getPriceMin())
                        .priceMax(ofReq.getPriceMax())
                        .description(ofReq.getDescription())
                        .build();
                offeringList.add(offering);
            }
            savedListing.setServiceOfferings(offeringList);
        }

        // --- Roommate ---
        if (cat == ListingCategory.ROOMMATE_FINDER && request.getRoommateInfo() != null) {
            ListingRequest.RoommateRequest roommateReq = request.getRoommateInfo();
            RoommateListing roommateListing = RoommateListing.builder()
                    .listing(savedListing)
                    .ownerPhotoUrl(roommateReq.getOwnerPhotoUrl())
                    .totalRoommatesWanted(roommateReq.getTotalRoommatesWanted())
                    .roommatesAlreadyHave(roommateReq.getRoommatesAlreadyHave())
                    .budgetMin(roommateReq.getBudgetMin())
                    .budgetMax(roommateReq.getBudgetMax())
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

        // Save again to persist cascade children
        return listingRepository.save(savedListing);
    }

    @Transactional(readOnly = true)
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
        listing.setPriceMin(request.getPriceMin() != null ? request.getPriceMin() : request.getPrice());
        listing.setPriceMax(request.getPriceMax());
        listing.setImageUrl(request.getImageUrl());
        listing.setLocationText(request.getLocationText());
        listing.setLatitude(request.getLatitude());
        listing.setLongitude(request.getLongitude());
        listing.setContactPhone(request.getContactPhone());

        // --- Update Residential Detail ---
        ListingCategory cat = request.getCategory();
        if ((cat == ListingCategory.FLAT || cat == ListingCategory.HOUSE || cat == ListingCategory.HOTEL)) {
            ResidentialDetail rd = listing.getResidentialDetail();
            if (rd == null) {
                rd = ResidentialDetail.builder().listing(listing).build();
            }
            rd.setBedroomCount(request.getBedroomCount() != null ? request.getBedroomCount() : 0);
            rd.setBathroomCount(request.getBathroomCount() != null ? request.getBathroomCount() : 0);
            rd.setOtherRoomsCount(request.getOtherRoomsCount() != null ? request.getOtherRoomsCount() : 0);
            listing.setResidentialDetail(rd);
        }

        // --- Update Room Details ---
        if (request.getRooms() != null) {
            listing.getRoomDetails().clear();
            for (ListingRequest.RoomRequest roomReq : request.getRooms()) {
                RoomDetail room = RoomDetail.builder()
                        .listing(listing)
                        .roomType(roomReq.getRoomType())
                        .description(roomReq.getDescription())
                        .imageUrls(roomReq.getImageUrls() != null ? String.join(",", roomReq.getImageUrls()) : null)
                        .build();
                listing.getRoomDetails().add(room);
            }
        }

        // --- Update Convention Detail ---
        if (cat == ListingCategory.CONVENTION_HALL) {
            ConventionDetail cd = listing.getConventionDetail();
            if (cd == null) {
                cd = ConventionDetail.builder().listing(listing).build();
            }
            cd.setCapacity(request.getCapacity());
            cd.setHallCount(request.getHallCount() != null ? request.getHallCount() : 1);
            listing.setConventionDetail(cd);
        }

        // --- Update Amenities ---
        if (request.getAmenities() != null) {
            listing.getAmenities().clear();
            for (String name : request.getAmenities()) {
                listing.getAmenities().add(ListingAmenity.builder()
                        .listing(listing)
                        .amenityName(name)
                        .build());
            }
        }

        // --- Update Service Offerings ---
        if (request.getOfferings() != null) {
            listing.getServiceOfferings().clear();
            for (ListingRequest.OfferingRequest ofReq : request.getOfferings()) {
                listing.getServiceOfferings().add(ServiceOffering.builder()
                        .listing(listing)
                        .offeringName(ofReq.getOfferingName())
                        .priceMin(ofReq.getPriceMin())
                        .priceMax(ofReq.getPriceMax())
                        .description(ofReq.getDescription())
                        .build());
            }
        }

        // --- Update Roommate ---
        if (cat == ListingCategory.ROOMMATE_FINDER && request.getRoommateInfo() != null) {
            ListingRequest.RoommateRequest roommateReq = request.getRoommateInfo();
            RoommateListing roommateListing = roommateRepository.findByListingId(id)
                    .orElse(RoommateListing.builder().listing(listing).build());

            roommateListing.setOwnerPhotoUrl(roommateReq.getOwnerPhotoUrl());
            roommateListing.setTotalRoommatesWanted(roommateReq.getTotalRoommatesWanted());
            roommateListing.setRoommatesAlreadyHave(roommateReq.getRoommatesAlreadyHave());
            roommateListing.setBudgetMin(roommateReq.getBudgetMin());
            roommateListing.setBudgetMax(roommateReq.getBudgetMax());
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
