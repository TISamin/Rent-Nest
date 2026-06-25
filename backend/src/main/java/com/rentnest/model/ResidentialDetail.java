package com.rentnest.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "residential_detail")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResidentialDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Listing listing;

    @Column(name = "bedroom_count", nullable = false)
    @Builder.Default
    private Integer bedroomCount = 0;

    @Column(name = "bathroom_count", nullable = false)
    @Builder.Default
    private Integer bathroomCount = 0;

    @Column(name = "other_rooms_count", nullable = false)
    @Builder.Default
    private Integer otherRoomsCount = 0;
}
