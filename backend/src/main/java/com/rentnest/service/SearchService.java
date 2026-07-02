package com.rentnest.service;

import com.rentnest.dto.SearchRequest;
import com.rentnest.dto.ListingResponse;
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

    public List<ListingResponse> searchRentals(String location, ListingCategory category, Double lat, Double lng, Integer radius, Double minBudget, Double maxBudget) {
        if (lat != null && lng != null && radius != null) {
            List<Listing> listings;
            if (category != null) {
                listings = listingRepository.findWithinRadius(lat, lng, radius, category.name(), minBudget, maxBudget);
            } else {
                List<String> rentalCategoryNames = java.util.List.of(
                    ListingCategory.FLAT.name(),
                    ListingCategory.HOTEL.name(),
                    ListingCategory.HOUSE.name(),
                    ListingCategory.CONVENTION_HALL.name()
                );
                listings = listingRepository.findWithinRadiusMultipleCategories(lat, lng, radius, rentalCategoryNames, minBudget, maxBudget);
            }
            return listings.stream()
                    .map(l -> {
                        ListingResponse resp = ListingResponse.fromEntity(l);
                        if (l.getLatitude() != null && l.getLongitude() != null) {
                            double dist = calculateHaversineDistance(lat, lng, l.getLatitude().doubleValue(), l.getLongitude().doubleValue());
                            resp.setDistanceMetres(dist);
                        } else {
                            resp.setDistanceMetres(null);
                        }
                        return resp;
                    })
                    .sorted((r1, r2) -> {
                        if (r1.getDistanceMetres() == null && r2.getDistanceMetres() == null) return 0;
                        if (r1.getDistanceMetres() == null) return 1;
                        if (r2.getDistanceMetres() == null) return -1;
                        return Double.compare(r1.getDistanceMetres(), r2.getDistanceMetres());
                    })
                    .collect(Collectors.toList());
        }

        List<Listing> listings;
        if (category != null) {
            listings = listingRepository.findByCategoryAndBudget(category, minBudget, maxBudget);
        } else {
            // "All" tab: only rental categories, not services/marketplace/roommates
            List<ListingCategory> rentalCategories = java.util.List.of(
                ListingCategory.FLAT,
                ListingCategory.HOTEL,
                ListingCategory.HOUSE,
                ListingCategory.CONVENTION_HALL
            );
            listings = listingRepository.findByCategoriesAndBudget(rentalCategories, minBudget, maxBudget);
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

    /**
     * Get autocomplete location text suggestions matching the user's typed prefix/query.
     */
    public List<String> getLocationSuggestions(String query) {
        if (query == null || query.trim().length() < 1) {
            return java.util.List.of();
        }
        return listingRepository.findDistinctLocationTexts(query.trim());
    }

    /**
     * Helper to calculate the straight-line Haversine distance in metres between two coordinate points.
     */
    private double calculateHaversineDistance(double lat1, double lng1, double lat2, double lng2) {
        final int R = 6371000; // Radius of the earth in metres
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lng2 - lng1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
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
