package com.rentnest.repository;

import com.rentnest.model.Listing;
import com.rentnest.model.enums.ListingCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    @Query(value = """
      SELECT l.*
      FROM listings l
      WHERE ST_DWithin(
          ST_SetSRID(ST_Point(l.longitude, l.latitude), 4326)::geography,
          ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography,
          :radius
        )
      AND l.category = :category
      AND l.is_active = true
      """, nativeQuery = true)
    List<Listing> findWithinRadius(
      @Param("lat") double lat,
      @Param("lng") double lng,
      @Param("radius") int radius,
      @Param("category") String category
    );

    /**
     * Native PostGIS query to find active listings of multiple categories within a geographic radius.
     */
    @Query(value = """
      SELECT l.*
      FROM listings l
      WHERE ST_DWithin(
          ST_SetSRID(ST_Point(l.longitude, l.latitude), 4326)::geography,
          ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography,
          :radius
        )
      AND l.category IN (:categories)
      AND l.is_active = true
      """, nativeQuery = true)
    List<Listing> findWithinRadiusMultipleCategories(
      @Param("lat") double lat,
      @Param("lng") double lng,
      @Param("radius") int radius,
      @Param("categories") List<String> categories
    );

    /**
     * Query to find distinct matching location texts for autocomplete suggestions.
     */
    @Query("SELECT DISTINCT l.locationText FROM Listing l WHERE l.isActive = true AND LOWER(l.locationText) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<String> findDistinctLocationTexts(@Param("query") String query);
}
