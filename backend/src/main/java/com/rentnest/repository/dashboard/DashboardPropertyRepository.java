package com.rentnest.repository.dashboard;

import com.rentnest.model.dashboard.DashboardProperty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DashboardPropertyRepository extends JpaRepository<DashboardProperty, UUID> {
    List<DashboardProperty> findByUserIdOrderByCreatedAtDesc(UUID userId);
    long countByUserId(UUID userId);
}
