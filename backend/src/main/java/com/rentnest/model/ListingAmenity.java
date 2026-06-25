package com.rentnest.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "listing_amenity")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingAmenity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Listing listing;

    @Column(name = "amenity_name", nullable = false, length = 100)
    private String amenityName;
}
