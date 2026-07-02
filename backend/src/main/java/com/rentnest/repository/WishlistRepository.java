package com.rentnest.repository;

import com.rentnest.model.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, UUID> {

    List<Wishlist> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<Wishlist> findByUserIdAndListingId(UUID userId, UUID listingId);

    @Query("SELECT w.listing.id FROM Wishlist w WHERE w.user.id = :userId AND w.listing.id IN :listingIds")
    List<UUID> findWishlistedListingIds(@Param("userId") UUID userId, @Param("listingIds") List<UUID> listingIds);

    @Modifying
    @Transactional
    void deleteByUserIdAndListingId(UUID userId, UUID listingId);
}
