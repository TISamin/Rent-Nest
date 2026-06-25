package com.rentnest.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "room_detail")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Listing listing;

    @Column(name = "room_type", nullable = false, length = 50)
    private String roomType;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_urls", columnDefinition = "TEXT")
    private String imageUrls;
}
