package com.rentnest.repository.dashboard;

import com.rentnest.model.dashboard.DashboardUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DashboardUnitRepository extends JpaRepository<DashboardUnit, UUID> {
    // List<DashboardUnit> findByPropertyIdOrderByCreatedAtAsc(UUID propertyId);
    List<DashboardUnit> findByProperty_IdOrderByCreatedAtAsc(UUID propertyId);

    @Query("SELECT u FROM DashboardUnit u WHERE u.property.user.id = :userId")
    List<DashboardUnit> findAllByUserId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(u) FROM DashboardUnit u WHERE u.property.user.id = :userId")
    long countByUserId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(u) FROM DashboardUnit u WHERE u.property.user.id = :userId AND u.isVacant = false")
    long countOccupiedByUserId(@Param("userId") UUID userId);
}
