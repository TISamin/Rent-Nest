package com.rentnest.service;

import com.rentnest.dto.ReportRequest;
import com.rentnest.model.Report;
import com.rentnest.model.User;
import com.rentnest.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final ReportRepository reportRepository;

    public void submitReport(User user, ReportRequest request) {
        try {
            // First check to avoid unnecessary exceptions if possible
            Optional<Report> existing = reportRepository.findByReporterIdAndTargetTypeAndTargetId(
                    user.getId(), request.getTargetType(), request.getTargetId());
            
            if (existing.isPresent()) {
                log.info("Duplicate report silently ignored for user {} targeting {}", user.getId(), request.getTargetId());
                return;
            }

            Report report = Report.builder()
                    .reporter(user)
                    .targetType(request.getTargetType())
                    .targetId(request.getTargetId())
                    .reason(request.getReason())
                    .note(request.getNote())
                    .status("PENDING")
                    .build();

            reportRepository.save(report);
        } catch (DataIntegrityViolationException e) {
            // Silently catch concurrent duplicates based on unique constraint
            log.info("Concurrent duplicate report caught and ignored for user {}", user.getId());
        }
    }
}
