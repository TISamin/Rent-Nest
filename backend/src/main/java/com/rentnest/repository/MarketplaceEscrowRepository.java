package com.rentnest.repository;

import com.rentnest.model.MarketplaceEscrow;
import com.rentnest.model.User;
import com.rentnest.model.enums.MarketplaceEscrowStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MarketplaceEscrowRepository extends JpaRepository<MarketplaceEscrow, UUID> {
    
    @EntityGraph(attributePaths = {"listing.user", "buyer"})
    Optional<MarketplaceEscrow> findById(UUID id);

    @EntityGraph(attributePaths = {"listing.user", "buyer"})
    List<MarketplaceEscrow> findByBuyerOrderByCreatedAtDesc(User buyer);
    
    @EntityGraph(attributePaths = {"listing.user", "buyer"})
    List<MarketplaceEscrow> findByListingUserOrderByCreatedAtDesc(User seller);
    
    @EntityGraph(attributePaths = {"listing.user", "buyer"})
    List<MarketplaceEscrow> findByListingIdOrderByCreatedAtDesc(UUID listingId);
    
    long countByListingIdAndStatus(UUID listingId, MarketplaceEscrowStatus status);

    @EntityGraph(attributePaths = {"listing.user", "buyer"})
    List<MarketplaceEscrow> findAll();
}
