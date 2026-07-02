package com.rentnest.repository.dashboard;

import com.rentnest.model.dashboard.DashboardExpenditure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface DashboardExpenditureRepository extends JpaRepository<DashboardExpenditure, UUID> {
    List<DashboardExpenditure> findByUserIdOrderByCreatedAtDesc(UUID userId);

    @Query("SELECT COALESCE(SUM(e.cost), 0) FROM DashboardExpenditure e WHERE e.user.id = :userId")
    BigDecimal sumCostByUserId(@Param("userId") UUID userId);
}
