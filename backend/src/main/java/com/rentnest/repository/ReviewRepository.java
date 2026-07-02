package com.rentnest.repository;

import com.rentnest.model.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {
    
    Page<Review> findByListingId(UUID listingId, Pageable pageable);
    
    Optional<Review> findByUserIdAndListingId(UUID userId, UUID listingId);
}
