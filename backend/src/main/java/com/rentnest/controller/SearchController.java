package com.rentnest.controller;

import com.rentnest.dto.ApiResponse;
import com.rentnest.dto.ListingResponse;
import com.rentnest.model.Listing;
import com.rentnest.model.enums.ListingCategory;
import com.rentnest.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping("/rental")
    public ResponseEntity<ApiResponse<List<ListingResponse>>> searchRental(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) ListingCategory category) {
        List<Listing> listings = searchService.searchRentals(location, category);
        List<ListingResponse> responses = listings.stream()
                .map(ListingResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(responses, "Rental listings retrieved successfully"));
    }

    @GetMapping("/marketplace")
    public ResponseEntity<ApiResponse<List<ListingResponse>>> searchMarketplace(
            @RequestParam(required = false) String item) {
        List<Listing> listings = searchService.searchMarketplace(item);
        List<ListingResponse> responses = listings.stream()
                .map(ListingResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(responses, "Marketplace listings retrieved successfully"));
    }

    @GetMapping("/roommate")
    public ResponseEntity<ApiResponse<List<ListingResponse>>> searchRoommate(
            @RequestParam(required = false) String area) {
        List<Listing> listings = searchService.searchRoommates(area);
        List<ListingResponse> responses = listings.stream()
                .map(ListingResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(responses, "Roommate listings retrieved successfully"));
    }
}
