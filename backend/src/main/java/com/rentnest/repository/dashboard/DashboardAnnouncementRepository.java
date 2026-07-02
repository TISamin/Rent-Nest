package com.rentnest.repository.dashboard;

import com.rentnest.model.dashboard.DashboardAnnouncement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DashboardAnnouncementRepository extends JpaRepository<DashboardAnnouncement, UUID> {
    List<DashboardAnnouncement> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
