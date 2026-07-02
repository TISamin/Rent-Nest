package com.rentnest.service;

import com.rentnest.dto.AdminStatsResponse;
import com.rentnest.exception.ResourceNotFoundException;
import com.rentnest.model.Listing;
import com.rentnest.model.Report;
import com.rentnest.model.User;
import com.rentnest.repository.ListingRepository;
import com.rentnest.repository.ReportRepository;
import com.rentnest.repository.ReviewRepository;
import com.rentnest.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final ReviewRepository reviewRepository;

    public List<Report> getReports() {
        return reportRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public Report updateReportStatus(UUID reportId, String status) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));
        report.setStatus(status);
        return reportRepository.save(report);
    }

    public AdminStatsResponse getStats() {
        long totalUsers = userRepository.count();
        long totalListings = listingRepository.count();
        long totalReviews = reviewRepository.count();
        
        List<Report> allReports = reportRepository.findAll();
        long pendingReports = allReports.stream().filter(r -> "PENDING".equals(r.getStatus())).count();
        long resolvedReports = allReports.stream().filter(r -> "RESOLVED".equals(r.getStatus())).count();

        return AdminStatsResponse.builder()
                .totalUsers(totalUsers)
                .totalListings(totalListings)
                .totalReviews(totalReviews)
                .pendingReports(pendingReports)
                .resolvedReports(resolvedReports)
                .build();
    }

    public List<User> searchUsers(String query) {
        if (query == null || query.trim().isEmpty()) {
            return userRepository.findAll();
        }
        return userRepository.findAll().stream()
                .filter(u -> (u.getName() != null && u.getName().toLowerCase().contains(query.toLowerCase())) || 
                             (u.getEmail() != null && u.getEmail().toLowerCase().contains(query.toLowerCase())))
                .collect(Collectors.toList());
    }

    @Transactional
    public User toggleBan(UUID userId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        user.setBanned(!user.isBanned());
        if (user.isBanned()) {
            user.setBanReason(reason);
        } else {
            user.setBanReason(null);
        }
        
        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        userRepository.delete(user);
    }

    @Transactional
    public void deleteListing(UUID listingId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found"));
        listingRepository.delete(listing);
    }
}
