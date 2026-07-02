package com.rentnest.repository;

import com.rentnest.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReportRepository extends JpaRepository<Report, UUID> {
    
    Optional<Report> findByReporterIdAndTargetTypeAndTargetId(UUID reporterId, String targetType, UUID targetId);

    List<Report> findAllByOrderByCreatedAtDesc();
}
