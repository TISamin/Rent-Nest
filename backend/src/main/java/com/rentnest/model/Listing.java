package com.rentnest.model;

import com.rentnest.model.enums.ListingCategory;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Listing entity representing a rental property or service posted by a user.
 * Supports optional one-to-one extension for roommate-specific data.
 */
@Entity
@Table(name = "listings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Listing {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private ListingCategory category;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "price_min", precision = 12, scale = 2)
    private BigDecimal priceMin;

    @Column(name = "price_max", precision = 12, scale = 2)
    private BigDecimal priceMax;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "location_text", length = 300)
    private String locationText;

    @Column(name = "latitude", precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 11, scale = 8)
    private BigDecimal longitude;

    @Column(name = "contact_phone", length = 20)
    private String contactPhone;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = true;

    @OneToOne(mappedBy = "listing", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private RoommateListing roommateListing;

    @OneToOne(mappedBy = "listing", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private ResidentialDetail residentialDetail;

    @OneToOne(mappedBy = "listing", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private ConventionDetail conventionDetail;

    @Builder.Default
    @OneToMany(mappedBy = "listing", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<RoomDetail> roomDetails = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "listing", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<ListingAmenity> amenities = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "listing", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<ServiceOffering> serviceOfferings = new ArrayList<>();

    public RoommateListing getRoommateInfo() {
        return roommateListing;
    }

    public void setRoommateInfo(RoommateListing roommateListing) {
        this.roommateListing = roommateListing;
    }
}
