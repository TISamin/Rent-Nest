package com.rentnest.controller;

import com.rentnest.dto.AdminStatsResponse;
import com.rentnest.dto.ApiResponse;
import com.rentnest.dto.BanRequest;
import com.rentnest.model.Report;
import com.rentnest.model.User;
import com.rentnest.model.MarketplaceEscrow;
import com.rentnest.service.AdminService;
import com.rentnest.service.MarketplaceEscrowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final MarketplaceEscrowService escrowService;

    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<List<Report>>> getReports() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getReports(), "Reports fetched"));
    }

    @PutMapping("/reports/{id}/status")
    public ResponseEntity<ApiResponse<Report>> updateReportStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        return ResponseEntity.ok(ApiResponse.success(adminService.updateReportStatus(id, status), "Status updated"));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getStats(), "Stats fetched"));
    }

    @GetMapping("/users/search")
    public ResponseEntity<ApiResponse<List<User>>> searchUsers(@RequestParam String query) {
        return ResponseEntity.ok(ApiResponse.success(adminService.searchUsers(query), "Users fetched"));
    }

    @PutMapping("/users/{id}/ban")
    public ResponseEntity<ApiResponse<User>> toggleBan(
            @PathVariable UUID id,
            @RequestBody(required = false) BanRequest request) {
        String reason = request != null ? request.getReason() : null;
        return ResponseEntity.ok(ApiResponse.success(adminService.toggleBan(id, reason), "Ban toggled"));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable UUID id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User deleted"));
    }

    @DeleteMapping("/listings/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteListing(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> payload) {
        // We accept a reason payload, though currently we just delete.
        adminService.deleteListing(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Listing deleted"));
    }

    @GetMapping("/marketplace-escrow")
    public ResponseEntity<ApiResponse<List<MarketplaceEscrowController.EscrowResponse>>> getMarketplaceEscrows() {
        List<MarketplaceEscrow> escrows = escrowService.getAllEscrowsForAdmin();
        List<MarketplaceEscrowController.EscrowResponse> dtos = escrows.stream()
                .map(MarketplaceEscrowController.EscrowResponse::fromEntity)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos, "Escrows fetched"));
    }

    @PostMapping("/marketplace-escrow/{id}/action")
    public ResponseEntity<ApiResponse<MarketplaceEscrowController.EscrowResponse>> handleEscrowAction(
            @PathVariable UUID id,
            @RequestBody Map<String, String> payload) {
        try {
            String action = payload.get("action");
            MarketplaceEscrow escrow;
            if ("CONFIRM".equalsIgnoreCase(action)) {
                escrow = escrowService.adminConfirmPayment(id, true);
            } else if ("REJECT".equalsIgnoreCase(action)) {
                escrow = escrowService.adminConfirmPayment(id, false);
            } else if ("COMPLETE".equalsIgnoreCase(action)) {
                escrow = escrowService.adminCompleteTransaction(id);
            } else if ("REFUND".equalsIgnoreCase(action)) {
                escrow = escrowService.adminRefundTransaction(id);
            } else {
                return ResponseEntity.badRequest().body(ApiResponse.error("Invalid escrow action"));
            }
            return ResponseEntity.ok(ApiResponse.success(MarketplaceEscrowController.EscrowResponse.fromEntity(escrow), "Action performed successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
