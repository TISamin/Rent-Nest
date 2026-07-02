package com.rentnest.service;

import com.rentnest.dto.ListingResponse;
import com.rentnest.model.Listing;
import com.rentnest.model.User;
import com.rentnest.model.Wishlist;
import com.rentnest.repository.ListingRepository;
import com.rentnest.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final ListingRepository listingRepository;

    @Transactional
    public boolean toggleWishlist(User user, UUID listingId) {
        Optional<Wishlist> existing = wishlistRepository.findByUserIdAndListingId(user.getId(), listingId);
        if (existing.isPresent()) {
            wishlistRepository.deleteByUserIdAndListingId(user.getId(), listingId);
            return false; // Removed
        } else {
            Listing listing = listingRepository.findById(listingId)
                    .orElseThrow(() -> new IllegalArgumentException("Listing not found"));
            Wishlist wishlist = Wishlist.builder()
                    .user(user)
                    .listing(listing)
                    .build();
            wishlistRepository.save(wishlist);
            return true; // Added
        }
    }

    public List<ListingResponse> getWishlist(User user) {
        List<Wishlist> wishlists = wishlistRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return wishlists.stream()
                .map(w -> ListingResponse.fromEntity(w.getListing()))
                .collect(Collectors.toList());
    }

    public List<UUID> checkWishlisted(User user, List<UUID> listingIds) {
        if (listingIds == null || listingIds.isEmpty()) {
            return List.of();
        }
        return wishlistRepository.findWishlistedListingIds(user.getId(), listingIds);
    }
}
