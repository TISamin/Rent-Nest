package com.rentnest.repository;

import com.rentnest.model.Listing;
import com.rentnest.model.enums.ListingCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for Listing entity operations.
 */
@Repository
public interface ListingRepository extends JpaRepository<Listing, UUID> {

    /**
     * Get all listings by a specific user, ordered by newest first.
     */
    List<Listing> findByUserIdOrderByCreatedAtDesc(UUID userId);

    /**
     * Get active listings filtered by category, ordered by newest first.
     */
    List<Listing> findByCategoryAndIsActiveTrueOrderByCreatedAtDesc(ListingCategory category);

    /**
     * Get all active listings, ordered by newest first.
     */
    List<Listing> findByIsActiveTrueOrderByCreatedAtDesc();
}
