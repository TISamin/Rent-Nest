package com.rentnest.service;

import com.rentnest.dto.SearchRequest;
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

    public List<Listing> searchRentals(String location, ListingCategory category) {
        List<Listing> listings;
        if (category != null) {
            listings = listingRepository.findByCategoryAndIsActiveTrueOrderByCreatedAtDesc(category);
        } else {
            listings = listingRepository.findByIsActiveTrueOrderByCreatedAtDesc();
        }

        if (location != null && !location.trim().isEmpty()) {
            String lowerLoc = location.toLowerCase();
            return listings.stream()
                    .filter(l -> l.getLocationText() != null && l.getLocationText().toLowerCase().contains(lowerLoc))
                    .collect(Collectors.toList());
        }

        return listings;
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
}
