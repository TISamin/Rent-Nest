package com.rentnest.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Extension entity for listings with category ROOMMATE_FINDER.
 * Holds roommate-specific information such as vacancy count and existing members.
 */
@Entity
@Table(name = "roommate_listings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoommateListing {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Listing listing;

    @Column(name = "owner_photo_url", columnDefinition = "TEXT")
    private String ownerPhotoUrl;

    @Column(name = "total_roommates_wanted")
    private Integer totalRoommatesWanted;

    @Column(name = "roommates_already_have")
    private Integer roommatesAlreadyHave;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Builder.Default
    @OneToMany(mappedBy = "roommateListing", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<RoommateMember> members = new ArrayList<>();

    /**
     * Helper to maintain bidirectional relationship when adding members.
     */
    public void addMember(RoommateMember member) {
        members.add(member);
        member.setRoommateListing(this);
    }
}
