package com.rentnest.controller;

import com.rentnest.dto.ApiResponse;
import com.rentnest.model.MarketplaceEscrow;
import com.rentnest.model.User;
import com.rentnest.service.MarketplaceEscrowService;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/marketplace-escrow")
public class MarketplaceEscrowController {

    private final MarketplaceEscrowService escrowService;

    public MarketplaceEscrowController(MarketplaceEscrowService escrowService) {
        this.escrowService = escrowService;
    }

    @PostMapping("/request/{listingId}")
    public ResponseEntity<ApiResponse<EscrowResponse>> submitBuyRequest(
            @PathVariable UUID listingId,
            @AuthenticationPrincipal User currentUser) {
        try {
            MarketplaceEscrow escrow = escrowService.submitBuyRequest(listingId, currentUser);
            return ResponseEntity.ok(ApiResponse.success(EscrowResponse.fromEntity(escrow), "Buy request sent successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/accept-request/{escrowId}")
    public ResponseEntity<ApiResponse<EscrowResponse>> acceptBuyRequest(
            @PathVariable UUID escrowId,
            @AuthenticationPrincipal User currentUser) {
        try {
            MarketplaceEscrow escrow = escrowService.acceptBuyRequest(escrowId, currentUser);
            return ResponseEntity.ok(ApiResponse.success(EscrowResponse.fromEntity(escrow), "Request accepted successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/decline-request/{escrowId}")
    public ResponseEntity<ApiResponse<EscrowResponse>> declineBuyRequest(
            @PathVariable UUID escrowId,
            @AuthenticationPrincipal User currentUser) {
        try {
            MarketplaceEscrow escrow = escrowService.declineBuyRequest(escrowId, currentUser);
            return ResponseEntity.ok(ApiResponse.success(EscrowResponse.fromEntity(escrow), "Request declined."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/withdraw/{escrowId}")
    public ResponseEntity<ApiResponse<EscrowResponse>> withdrawRequest(
            @PathVariable UUID escrowId,
            @AuthenticationPrincipal User currentUser) {
        try {
            MarketplaceEscrow escrow = escrowService.withdrawRequest(escrowId, currentUser);
            return ResponseEntity.ok(ApiResponse.success(EscrowResponse.fromEntity(escrow), "Request withdrawn."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/submit-payment/{escrowId}")
    public ResponseEntity<ApiResponse<EscrowResponse>> submitPayment(
            @PathVariable UUID escrowId,
            @RequestBody PaymentRequest request,
            @AuthenticationPrincipal User currentUser) {
        try {
            MarketplaceEscrow escrow = escrowService.submitPayment(
                    escrowId, 
                    request.getPaymentMethod(), 
                    request.getTransactionReference(), 
                    currentUser
            );
            return ResponseEntity.ok(ApiResponse.success(EscrowResponse.fromEntity(escrow), "Payment details submitted. Waiting for admin approval."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/ship/{escrowId}")
    public ResponseEntity<ApiResponse<EscrowResponse>> shipItem(
            @PathVariable UUID escrowId,
            @AuthenticationPrincipal User currentUser) {
        try {
            MarketplaceEscrow escrow = escrowService.shipItem(escrowId, currentUser);
            return ResponseEntity.ok(ApiResponse.success(EscrowResponse.fromEntity(escrow), "Item marked as shipped."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/confirm-receipt/{escrowId}")
    public ResponseEntity<ApiResponse<EscrowResponse>> confirmReceipt(
            @PathVariable UUID escrowId,
            @AuthenticationPrincipal User currentUser) {
        try {
            MarketplaceEscrow escrow = escrowService.confirmReceipt(escrowId, currentUser);
            return ResponseEntity.ok(ApiResponse.success(EscrowResponse.fromEntity(escrow), "Receipt confirmed. Listing closed."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/dispute/{escrowId}")
    public ResponseEntity<ApiResponse<EscrowResponse>> raiseDispute(
            @PathVariable UUID escrowId,
            @RequestBody DisputeRequest request,
            @AuthenticationPrincipal User currentUser) {
        try {
            MarketplaceEscrow escrow = escrowService.raiseDispute(escrowId, request.getReason(), currentUser);
            return ResponseEntity.ok(ApiResponse.success(EscrowResponse.fromEntity(escrow), "Dispute raised. Admin will review the transaction."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/listing/{listingId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getListingEscrowDetails(
            @PathVariable UUID listingId) {
        try {
            List<MarketplaceEscrow> escrows = escrowService.getListingEscrows(listingId);
            List<EscrowResponse> dtos = escrows.stream().map(EscrowResponse::fromEntity).collect(Collectors.toList());
            long interestCount = escrowService.getListingInterestCount(listingId);
            Map<String, Object> data = Map.of(
                    "escrows", dtos,
                    "interestCount", interestCount
            );
            return ResponseEntity.ok(ApiResponse.success(data, "Escrow details fetched successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/activity")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyActivity(
            @AuthenticationPrincipal User currentUser) {
        try {
            Map<String, Object> data = escrowService.getUserActivity(currentUser);
            List<MarketplaceEscrow> sent = (List<MarketplaceEscrow>) data.get("sent");
            List<MarketplaceEscrow> received = (List<MarketplaceEscrow>) data.get("received");
            
            List<EscrowResponse> sentDtos = sent.stream().map(EscrowResponse::fromEntity).collect(Collectors.toList());
            List<EscrowResponse> receivedDtos = received.stream().map(EscrowResponse::fromEntity).collect(Collectors.toList());
            
            Map<String, Object> resData = Map.of(
                    "sent", sentDtos,
                    "received", receivedDtos
            );
            return ResponseEntity.ok(ApiResponse.success(resData, "Activity data fetched."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @Data
    public static class PaymentRequest {
        private String paymentMethod;
        private String transactionReference;
    }

    @Data
    public static class DisputeRequest {
        private String reason;
    }

    @Data
    public static class EscrowResponse {
        private UUID id;
        private ListingDto listing;
        private BuyerDto buyer;
        private String status;
        private String paymentMethod;
        private String transactionReference;
        private String adminNotes;
        private String disputeReason;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        @Data
        public static class ListingDto {
            private UUID id;
            private String title;
            private Double price;
            private Double priceMin;
            private Double priceMax;
            private String priceUnit;
            private String userName;
            private String contactPhone;
            private UUID userId;
        }

        @Data
        public static class BuyerDto {
            private UUID id;
            private String name;
            private String email;
        }

        public static EscrowResponse fromEntity(MarketplaceEscrow entity) {
            EscrowResponse dto = new EscrowResponse();
            dto.setId(entity.getId());
            dto.setStatus(entity.getStatus().name());
            dto.setPaymentMethod(entity.getPaymentMethod());
            dto.setTransactionReference(entity.getTransactionReference());
            dto.setAdminNotes(entity.getAdminNotes());
            dto.setDisputeReason(entity.getDisputeReason());
            dto.setCreatedAt(entity.getCreatedAt());
            dto.setUpdatedAt(entity.getUpdatedAt());

            if (entity.getListing() != null) {
                ListingDto lDto = new ListingDto();
                lDto.setId(entity.getListing().getId());
                lDto.setTitle(entity.getListing().getTitle());
                lDto.setPriceMin(entity.getListing().getPriceMin() != null ? entity.getListing().getPriceMin().doubleValue() : null);
                lDto.setPriceMax(entity.getListing().getPriceMax() != null ? entity.getListing().getPriceMax().doubleValue() : null);
                lDto.setPriceUnit(entity.getListing().getPriceUnit());
                lDto.setContactPhone(entity.getListing().getContactPhone());
                if (entity.getListing().getUser() != null) {
                    lDto.setUserName(entity.getListing().getUser().getName());
                    lDto.setUserId(entity.getListing().getUser().getId());
                }
                dto.setListing(lDto);
            }

            if (entity.getBuyer() != null) {
                BuyerDto bDto = new BuyerDto();
                bDto.setId(entity.getBuyer().getId());
                bDto.setName(entity.getBuyer().getName());
                bDto.setEmail(entity.getBuyer().getEmail());
                dto.setBuyer(bDto);
            }

            return dto;
        }
    }
}
