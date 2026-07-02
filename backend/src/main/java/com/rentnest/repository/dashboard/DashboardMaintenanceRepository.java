package com.rentnest.repository.dashboard;

import com.rentnest.model.dashboard.DashboardMaintenanceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface DashboardMaintenanceRepository extends JpaRepository<DashboardMaintenanceRequest, UUID> {
    List<DashboardMaintenanceRequest> findByUserIdOrderByCreatedAtDesc(UUID userId);

    @Query("SELECT COUNT(m) FROM DashboardMaintenanceRequest m WHERE m.user.id = :userId AND m.status IN ('OPEN', 'IN_PROGRESS')")
    long countOpenByUserId(@Param("userId") UUID userId);

    @Query("SELECT COALESCE(SUM(m.cost), 0) FROM DashboardMaintenanceRequest m WHERE m.user.id = :userId AND m.status = 'RESOLVED' AND m.cost IS NOT NULL")
    BigDecimal sumResolvedCostByUserId(@Param("userId") UUID userId);

    @Query("SELECT m FROM DashboardMaintenanceRequest m WHERE m.user.id = :userId AND m.status = 'RESOLVED' AND m.cost IS NOT NULL ORDER BY m.resolvedAt DESC")
    List<DashboardMaintenanceRequest> findResolvedWithCostByUserId(@Param("userId") UUID userId);
}
