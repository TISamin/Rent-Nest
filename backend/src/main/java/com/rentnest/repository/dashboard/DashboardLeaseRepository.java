package com.rentnest.repository.dashboard;

import com.rentnest.model.dashboard.DashboardLease;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DashboardLeaseRepository extends JpaRepository<DashboardLease, UUID> {
    Optional<DashboardLease> findByUnitId(UUID unitId);

    @Query("SELECT l FROM DashboardLease l JOIN l.unit u JOIN u.property p WHERE p.user.id = :userId ORDER BY l.createdAt DESC")
    List<DashboardLease> findAllByUserId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(l) FROM DashboardLease l JOIN l.unit u JOIN u.property p WHERE p.user.id = :userId")
    long countByUserId(@Param("userId") UUID userId);
}
