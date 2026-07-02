package com.rentnest.controller;

import com.rentnest.dto.ApiResponse;
import com.rentnest.model.User;
import com.rentnest.model.dashboard.*;
import com.rentnest.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    // ─── Stats & Chart ───────────────────────────────────────

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getStats(user), "Stats retrieved"));
    }

    @GetMapping("/chart")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getChartData(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getChartData(user), "Chart data retrieved"));
    }

    // ─── Properties ──────────────────────────────────────────

    @GetMapping("/properties")
    public ResponseEntity<ApiResponse<List<DashboardProperty>>> getProperties(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getProperties(user), "Properties retrieved"));
    }

    @PostMapping("/properties")
    public ResponseEntity<ApiResponse<DashboardProperty>> createProperty(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        DashboardProperty property = dashboardService.createProperty(user, body.get("name"), body.get("location"), body.get("type"));
        return ResponseEntity.ok(ApiResponse.success(property, "Property created"));
    }

    @PutMapping("/properties/{id}")
    public ResponseEntity<ApiResponse<DashboardProperty>> updateProperty(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        DashboardProperty property = dashboardService.updateProperty(id, user, body.get("name"), body.get("location"), body.get("type"));
        return ResponseEntity.ok(ApiResponse.success(property, "Property updated"));
    }

    @DeleteMapping("/properties/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProperty(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        dashboardService.deleteProperty(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Property deleted"));
    }

    // ─── Units ───────────────────────────────────────────────

    @GetMapping("/units")
    public ResponseEntity<ApiResponse<List<DashboardUnit>>> getAllUnits(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getAllUnits(user), "Units retrieved"));
    }

    @GetMapping("/units/by-property/{propertyId}")
    public ResponseEntity<ApiResponse<List<DashboardUnit>>> getUnitsByProperty(
            @PathVariable UUID propertyId, @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getUnits(propertyId), "Units retrieved"));
    }

    @PostMapping("/units")
    public ResponseEntity<ApiResponse<DashboardUnit>> createUnit(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        DashboardUnit unit = dashboardService.createUnit(user,
                UUID.fromString((String) body.get("propertyId")),
                (String) body.get("name"),
                body.get("rentAmount") != null ? new BigDecimal(body.get("rentAmount").toString()) : BigDecimal.ZERO,
                (String) body.get("rentPeriod"),
                body.get("collectionDay") != null ? Integer.parseInt(body.get("collectionDay").toString()) : 1);
        return ResponseEntity.ok(ApiResponse.success(unit, "Unit created"));
    }

    @PutMapping("/units/{id}")
    public ResponseEntity<ApiResponse<DashboardUnit>> updateUnit(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        DashboardUnit unit = dashboardService.updateUnit(id, user,
                (String) body.get("name"),
                body.get("rentAmount") != null ? new BigDecimal(body.get("rentAmount").toString()) : BigDecimal.ZERO,
                (String) body.get("rentPeriod"),
                body.get("collectionDay") != null ? Integer.parseInt(body.get("collectionDay").toString()) : 1);
        return ResponseEntity.ok(ApiResponse.success(unit, "Unit updated"));
    }

    @DeleteMapping("/units/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUnit(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        dashboardService.deleteUnit(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Unit deleted"));
    }

    // ─── Leases ──────────────────────────────────────────────

    @GetMapping("/leases")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getLeases(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getLeases(user), "Leases retrieved"));
    }

    @PostMapping("/leases")
    public ResponseEntity<ApiResponse<DashboardLease>> createLease(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        DashboardLease lease = dashboardService.createLease(user,
                UUID.fromString(body.get("unitId")),
                body.get("tenantName"),
                body.get("whatsappNumber"),
                body.get("startDate"));
        return ResponseEntity.ok(ApiResponse.success(lease, "Lease created"));
    }

    @PutMapping("/leases/{id}")
    public ResponseEntity<ApiResponse<DashboardLease>> updateLease(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        DashboardLease lease = dashboardService.updateLease(id, user,
                body.get("tenantName"),
                body.get("whatsappNumber"),
                body.get("startDate"));
        return ResponseEntity.ok(ApiResponse.success(lease, "Lease updated"));
    }

    @DeleteMapping("/leases/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteLease(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        dashboardService.deleteLease(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Lease deleted"));
    }

    // ─── Rent Records ────────────────────────────────────────

    @GetMapping("/rent-records")
    public ResponseEntity<ApiResponse<List<RentRecord>>> getRentRecords(
            @RequestParam UUID leaseId, @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getRentRecords(leaseId), "Rent records retrieved"));
    }

    @PostMapping("/rent-records")
    public ResponseEntity<ApiResponse<RentRecord>> createRentRecord(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        RentRecord record = dashboardService.createRentRecord(user,
                UUID.fromString((String) body.get("leaseId")),
                (String) body.get("periodLabel"),
                new BigDecimal(body.get("amount").toString()));
        return ResponseEntity.ok(ApiResponse.success(record, "Rent record created"));
    }

    @PostMapping("/rent-records/{id}/pay")
    public ResponseEntity<ApiResponse<RentRecord>> payRentRecord(
            @PathVariable UUID id, @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        RentRecord record = dashboardService.payRentRecord(id, user);
        return ResponseEntity.ok(ApiResponse.success(record, "Rent marked as paid"));
    }

    // ─── Maintenance ─────────────────────────────────────────

    @GetMapping("/maintenance")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMaintenanceRequests(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getMaintenanceRequests(user), "Maintenance requests retrieved"));
    }

    @PostMapping("/maintenance")
    public ResponseEntity<ApiResponse<DashboardMaintenanceRequest>> createMaintenanceRequest(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        DashboardMaintenanceRequest request = dashboardService.createMaintenanceRequest(user,
                body.get("unitId") != null ? UUID.fromString(body.get("unitId").toString()) : null,
                (String) body.get("title"),
                (String) body.get("description"),
                (String) body.get("priority"),
                body.get("cost") != null ? new BigDecimal(body.get("cost").toString()) : null);
        return ResponseEntity.ok(ApiResponse.success(request, "Maintenance request created"));
    }

    @PutMapping("/maintenance/{id}")
    public ResponseEntity<ApiResponse<DashboardMaintenanceRequest>> updateMaintenanceRequest(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        DashboardMaintenanceRequest request = dashboardService.updateMaintenanceRequest(id, user,
                body.get("unitId") != null ? UUID.fromString(body.get("unitId").toString()) : null,
                (String) body.get("title"),
                (String) body.get("description"),
                (String) body.get("priority"),
                body.get("cost") != null ? new BigDecimal(body.get("cost").toString()) : null);
        return ResponseEntity.ok(ApiResponse.success(request, "Maintenance request updated"));
    }

    @PutMapping("/maintenance/{id}/status")
    public ResponseEntity<ApiResponse<DashboardMaintenanceRequest>> updateMaintenanceStatus(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        DashboardMaintenanceRequest request = dashboardService.updateMaintenanceStatus(id, user, body.get("status"));
        return ResponseEntity.ok(ApiResponse.success(request, "Status updated"));
    }

    @DeleteMapping("/maintenance/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMaintenanceRequest(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        dashboardService.deleteMaintenanceRequest(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Maintenance request deleted"));
    }

    // ─── Expenditures ────────────────────────────────────────

    @GetMapping("/expenditures")
    public ResponseEntity<ApiResponse<List<DashboardExpenditure>>> getExpenditures(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getExpenditures(user), "Expenditures retrieved"));
    }

    @PostMapping("/expenditures")
    public ResponseEntity<ApiResponse<DashboardExpenditure>> createExpenditure(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        DashboardExpenditure expenditure = dashboardService.createExpenditure(user,
                (String) body.get("name"),
                new BigDecimal(body.get("cost").toString()));
        return ResponseEntity.ok(ApiResponse.success(expenditure, "Expenditure created"));
    }

    @PutMapping("/expenditures/{id}")
    public ResponseEntity<ApiResponse<DashboardExpenditure>> updateExpenditure(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        DashboardExpenditure expenditure = dashboardService.updateExpenditure(id, user,
                (String) body.get("name"),
                new BigDecimal(body.get("cost").toString()));
        return ResponseEntity.ok(ApiResponse.success(expenditure, "Expenditure updated"));
    }

    @DeleteMapping("/expenditures/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteExpenditure(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        dashboardService.deleteExpenditure(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Expenditure deleted"));
    }

    // ─── Announcements ───────────────────────────────────────

    @GetMapping("/announcements")
    public ResponseEntity<ApiResponse<List<DashboardAnnouncement>>> getAnnouncements(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getAnnouncements(user), "Announcements retrieved"));
    }

    @PostMapping("/announcements")
    public ResponseEntity<ApiResponse<DashboardAnnouncement>> createAnnouncement(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        DashboardAnnouncement announcement = dashboardService.createAnnouncement(user, body.get("text"));
        return ResponseEntity.ok(ApiResponse.success(announcement, "Announcement created"));
    }

    @DeleteMapping("/announcements/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAnnouncement(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        dashboardService.deleteAnnouncement(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Announcement deleted"));
    }
}
