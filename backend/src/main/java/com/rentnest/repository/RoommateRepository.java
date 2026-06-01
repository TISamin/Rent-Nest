package com.rentnest.repository;

import com.rentnest.model.RoommateListing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for RoommateListing entity operations.
 */
@Repository
public interface RoommateRepository extends JpaRepository<RoommateListing, UUID> {

    /**
     * Find the roommate extension data for a given listing.
     */
    Optional<RoommateListing> findByListingId(UUID listingId);
}
