package com.rentnest.model.dashboard;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "dashboard_units")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardUnit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private DashboardProperty property;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "rent_amount", precision = 12, scale = 2)
    private BigDecimal rentAmount;

    @Column(name = "rent_period", length = 20, nullable = false)
    @Builder.Default
    private String rentPeriod = "MONTHLY";

    @Column(name = "collection_day", nullable = false)
    @Builder.Default
    private Integer collectionDay = 1;

    @Builder.Default
    @Column(name = "is_vacant", nullable = false)
    private Boolean isVacant = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToOne(mappedBy = "unit", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private DashboardLease lease;

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("propertyId")
    public UUID getPropId() {
        return property != null ? property.getId() : null;
    }
}
