package com.rentnest.dto;

import com.rentnest.model.Listing;

/**
 * Projection interface to retrieve a Listing entity along with its calculated distance.
 */
public interface ListingDistanceProjection {
    Listing getListing();
    Double getDistanceMetres();
}
