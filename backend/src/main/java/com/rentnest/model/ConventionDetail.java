package com.rentnest.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "convention_detail")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConventionDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Listing listing;

    @Column(name = "capacity")
    private Integer capacity;

    @Column(name = "hall_count")
    @Builder.Default
    private Integer hallCount = 1;
}
