package com.rentnest.repository;

import com.rentnest.dto.ListingDistanceProjection;
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
      SELECT l.id as listing_id, l.user_id as listing_user_id, l.category as listing_category,
             l.title as listing_title, l.description as listing_description,
             l.price_min as listing_price_min, l.price_max as listing_price_max,
             l.price_unit as listing_price_unit, l.image_url as listing_image_url,
             l.location_text as listing_location_text, l.latitude as listing_latitude,
             l.longitude as listing_longitude, l.contact_phone as listing_contact_phone,
             l.created_at as listing_created_at, l.is_active as listing_is_active,
        ST_Distance(
          ST_SetSRID(ST_Point(l.longitude, l.latitude), 4326)::geography,
          ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography
        ) as distanceMetres
      FROM listings l
      WHERE ST_DWithin(
          ST_SetSRID(ST_Point(l.longitude, l.latitude), 4326)::geography,
          ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography,
          :radius
        )
      AND l.category = :category
      AND l.is_active = true
      ORDER BY distanceMetres ASC
      """, nativeQuery = true)
    List<ListingDistanceProjection> findWithinRadius(
      @Param("lat") double lat,
      @Param("lng") double lng,
      @Param("radius") int radius,
      @Param("category") String category
    );

    /**
     * Native PostGIS query to find active listings of multiple categories within a geographic radius,
     * sorted by distance ascending.
     */
    @Query(value = """
      SELECT l.id as listing_id, l.user_id as listing_user_id, l.category as listing_category,
             l.title as listing_title, l.description as listing_description,
             l.price_min as listing_price_min, l.price_max as listing_price_max,
             l.price_unit as listing_price_unit, l.image_url as listing_image_url,
             l.location_text as listing_location_text, l.latitude as listing_latitude,
             l.longitude as listing_longitude, l.contact_phone as listing_contact_phone,
             l.created_at as listing_created_at, l.is_active as listing_is_active,
        ST_Distance(
          ST_SetSRID(ST_Point(l.longitude, l.latitude), 4326)::geography,
          ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography
        ) as distanceMetres
      FROM listings l
      WHERE ST_DWithin(
          ST_SetSRID(ST_Point(l.longitude, l.latitude), 4326)::geography,
          ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography,
          :radius
        )
      AND l.category IN (:categories)
      AND l.is_active = true
      ORDER BY distanceMetres ASC
      """, nativeQuery = true)
    List<ListingDistanceProjection> findWithinRadiusMultipleCategories(
      @Param("lat") double lat,
      @Param("lng") double lng,
      @Param("radius") int radius,
      @Param("categories") List<String> categories
    );
}
