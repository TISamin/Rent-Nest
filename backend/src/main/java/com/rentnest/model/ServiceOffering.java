package com.rentnest.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "service_offering")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceOffering {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Listing listing;

    @Column(name = "offering_name", nullable = false, length = 100)
    private String offeringName;

    @Column(name = "price_min", precision = 12, scale = 2)
    private BigDecimal priceMin;

    @Column(name = "price_max", precision = 12, scale = 2)
    private BigDecimal priceMax;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}
