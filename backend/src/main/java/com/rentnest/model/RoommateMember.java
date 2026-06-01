package com.rentnest.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Represents a current roommate member within a roommate listing.
 * Each member has a description and optional photo.
 */
@Entity
@Table(name = "roommate_members")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoommateMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "roommate_listing_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private RoommateListing roommateListing;

    @Column(name = "member_description", columnDefinition = "TEXT")
    private String memberDescription;

    @Column(name = "member_photo_url", columnDefinition = "TEXT")
    private String memberPhotoUrl;
}
