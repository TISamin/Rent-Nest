package com.rentnest.service;

import com.rentnest.dto.SearchRequest;
import com.rentnest.dto.ListingResponse;
import com.rentnest.dto.ListingDistanceProjection;
import com.rentnest.model.Listing;
import com.rentnest.model.enums.ListingCategory;
import com.rentnest.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final ListingRepository listingRepository;

    public List<ListingResponse> searchRentals(String location, ListingCategory category, Double lat, Double lng, Integer radius) {
        if (lat != null && lng != null && radius != null) {
            List<ListingDistanceProjection> projections;
            if (category != null) {
                projections = listingRepository.findWithinRadius(lat, lng, radius, category.name());
            } else {
                List<String> rentalCategoryNames = java.util.List.of(
                    ListingCategory.FLAT.name(),
                    ListingCategory.HOTEL.name(),
                    ListingCategory.HOUSE.name(),
                    ListingCategory.CONVENTION_HALL.name()
                );
                projections = listingRepository.findWithinRadiusMultipleCategories(lat, lng, radius, rentalCategoryNames);
            }
            return projections.stream()
                    .map(proj -> {
                        ListingResponse resp = ListingResponse.fromEntity(proj.getListing());
                        resp.setDistanceMetres(proj.getDistanceMetres());
                        return resp;
                    })
                    .collect(Collectors.toList());
        }

        List<Listing> listings;
        if (category != null) {
            listings = listingRepository.findByCategoryAndIsActiveTrueOrderByCreatedAtDesc(category);
        } else {
            // "All" tab: only rental categories, not services/marketplace/roommates
            List<ListingCategory> rentalCategories = java.util.List.of(
                ListingCategory.FLAT,
                ListingCategory.HOTEL,
                ListingCategory.HOUSE,
                ListingCategory.CONVENTION_HALL
            );
            listings = listingRepository.findByIsActiveTrueOrderByCreatedAtDesc().stream()
                    .filter(l -> rentalCategories.contains(l.getCategory()))
                    .collect(Collectors.toList());
        }

        if (location != null && !location.trim().isEmpty()) {
            String lowerLoc = location.toLowerCase();
            listings = listings.stream()
                    .filter(l -> l.getLocationText() != null && l.getLocationText().toLowerCase().contains(lowerLoc))
                    .collect(Collectors.toList());
        }

        return listings.stream()
                .map(ListingResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<Listing> searchMarketplace(String item) {
        List<Listing> listings = listingRepository.findByCategoryAndIsActiveTrueOrderByCreatedAtDesc(ListingCategory.MARKETPLACE);
        if (item != null && !item.trim().isEmpty()) {
            String lowerItem = item.toLowerCase();
            return listings.stream()
                    .filter(l -> (l.getTitle() != null && l.getTitle().toLowerCase().contains(lowerItem)) ||
                                 (l.getDescription() != null && l.getDescription().toLowerCase().contains(lowerItem)))
                    .collect(Collectors.toList());
        }
        return listings;
    }

    public List<Listing> searchRoommates(String area) {
        List<Listing> listings = listingRepository.findByCategoryAndIsActiveTrueOrderByCreatedAtDesc(ListingCategory.ROOMMATE_FINDER);
        if (area != null && !area.trim().isEmpty()) {
            String lowerArea = area.toLowerCase();
            return listings.stream()
                    .filter(l -> l.getLocationText() != null && l.getLocationText().toLowerCase().contains(lowerArea))
                    .collect(Collectors.toList());
        }
        return listings;
    }

    public List<Listing> searchServices(String location, ListingCategory category) {
        List<Listing> listings;
        if (category != null) {
            listings = listingRepository.findByCategoryAndIsActiveTrueOrderByCreatedAtDesc(category);
        } else {
            List<ListingCategory> serviceCategories = java.util.List.of(
                ListingCategory.SHIFTING_SERVICE,
                ListingCategory.EVENT_PLANNING,
                ListingCategory.DECORATION_SERVICE,
                ListingCategory.MAINTENANCE_SERVICE,
                ListingCategory.CLEANING_SERVICE,
                ListingCategory.CATERING_SERVICE
            );
            listings = listingRepository.findByIsActiveTrueOrderByCreatedAtDesc().stream()
                    .filter(l -> serviceCategories.contains(l.getCategory()))
                    .collect(Collectors.toList());
        }

        if (location != null && !location.trim().isEmpty()) {
            String lowerLoc = location.toLowerCase();
            return listings.stream()
                    .filter(l -> l.getLocationText() != null && l.getLocationText().toLowerCase().contains(lowerLoc))
                    .collect(Collectors.toList());
        }
        return listings;
    }
}
