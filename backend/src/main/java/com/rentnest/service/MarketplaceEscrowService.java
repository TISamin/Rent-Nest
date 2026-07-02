package com.rentnest.service;

import com.rentnest.model.Listing;
import com.rentnest.model.MarketplaceEscrow;
import com.rentnest.model.User;
import com.rentnest.model.enums.ListingCategory;
import com.rentnest.model.enums.MarketplaceEscrowStatus;
import com.rentnest.repository.ListingRepository;
import com.rentnest.repository.MarketplaceEscrowRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional
public class MarketplaceEscrowService {

    private final MarketplaceEscrowRepository escrowRepository;
    private final ListingRepository listingRepository;

    public MarketplaceEscrowService(MarketplaceEscrowRepository escrowRepository, ListingRepository listingRepository) {
        this.escrowRepository = escrowRepository;
        this.listingRepository = listingRepository;
    }

    public MarketplaceEscrow submitBuyRequest(UUID listingId, User buyer) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new IllegalArgumentException("Listing not found"));

        if (listing.getCategory() != ListingCategory.MARKETPLACE) {
            throw new IllegalArgumentException("Buy requests are only allowed for marketplace listings.");
        }

        if (listing.getUser().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("You cannot buy your own listing.");
        }

        // Check if there is already an active request (PENDING, ACCEPTED, PAID, SHIPPED)
        List<MarketplaceEscrow> existing = escrowRepository.findByListingIdOrderByCreatedAtDesc(listingId);
        boolean hasActive = existing.stream().anyMatch(e -> 
            e.getBuyer().getId().equals(buyer.getId()) &&
            (e.getStatus() == MarketplaceEscrowStatus.PENDING ||
             e.getStatus() == MarketplaceEscrowStatus.ACCEPTED ||
             e.getStatus() == MarketplaceEscrowStatus.PAID ||
             e.getStatus() == MarketplaceEscrowStatus.SHIPPED)
        );

        if (hasActive) {
            throw new IllegalArgumentException("You already have an active request for this listing.");
        }

        MarketplaceEscrow escrow = MarketplaceEscrow.builder()
                .listing(listing)
                .buyer(buyer)
                .status(MarketplaceEscrowStatus.PENDING)
                .build();

        return escrowRepository.save(escrow);
    }

    public MarketplaceEscrow acceptBuyRequest(UUID escrowId, User seller) {
        MarketplaceEscrow escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new IllegalArgumentException("Escrow record not found"));

        if (!escrow.getListing().getUser().getId().equals(seller.getId())) {
            throw new IllegalArgumentException("Only the listing owner can accept buy requests.");
        }

        if (escrow.getStatus() != MarketplaceEscrowStatus.PENDING) {
            throw new IllegalArgumentException("Only pending requests can be accepted.");
        }

        // Check if there is already an active escrow in progress for this listing
        List<MarketplaceEscrow> allEscrows = escrowRepository.findByListingIdOrderByCreatedAtDesc(escrow.getListing().getId());
        boolean alreadyActive = allEscrows.stream().anyMatch(e -> 
            e.getStatus() == MarketplaceEscrowStatus.ACCEPTED ||
            e.getStatus() == MarketplaceEscrowStatus.PAID ||
            e.getStatus() == MarketplaceEscrowStatus.SHIPPED ||
            e.getStatus() == MarketplaceEscrowStatus.COMPLETED ||
            e.getStatus() == MarketplaceEscrowStatus.DISPUTED
        );
        if (alreadyActive) {
            throw new IllegalArgumentException("There is already a transaction in progress for this listing.");
        }

        escrow.setStatus(MarketplaceEscrowStatus.ACCEPTED);
        return escrowRepository.save(escrow);
    }

    public MarketplaceEscrow declineBuyRequest(UUID escrowId, User seller) {
        MarketplaceEscrow escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new IllegalArgumentException("Escrow record not found"));

        if (!escrow.getListing().getUser().getId().equals(seller.getId())) {
            throw new IllegalArgumentException("Only the listing owner can decline buy requests.");
        }

        if (escrow.getStatus() != MarketplaceEscrowStatus.PENDING) {
            throw new IllegalArgumentException("Only pending requests can be declined.");
        }

        escrow.setStatus(MarketplaceEscrowStatus.DECLINED);
        return escrowRepository.save(escrow);
    }

    public MarketplaceEscrow withdrawRequest(UUID escrowId, User buyer) {
        MarketplaceEscrow escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new IllegalArgumentException("Escrow record not found"));

        if (!escrow.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("You can only withdraw your own requests.");
        }

        if (escrow.getStatus() != MarketplaceEscrowStatus.PENDING && escrow.getStatus() != MarketplaceEscrowStatus.ACCEPTED) {
            throw new IllegalArgumentException("You cannot withdraw a request after payment has been submitted.");
        }

        escrow.setStatus(MarketplaceEscrowStatus.DECLINED);
        return escrowRepository.save(escrow);
    }

    public MarketplaceEscrow submitPayment(UUID escrowId, String paymentMethod, String transactionReference, User buyer) {
        MarketplaceEscrow escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new IllegalArgumentException("Escrow record not found"));

        if (!escrow.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("Only the buyer can submit payment details.");
        }

        if (escrow.getStatus() != MarketplaceEscrowStatus.ACCEPTED) {
            throw new IllegalArgumentException("Payment can only be submitted for accepted requests.");
        }

        escrow.setPaymentMethod(paymentMethod);
        escrow.setTransactionReference(transactionReference);
        escrow.setStatus(MarketplaceEscrowStatus.PAID);
        escrow.setAdminNotes(null); // Reset any old admin notes
        return escrowRepository.save(escrow);
    }

    public MarketplaceEscrow shipItem(UUID escrowId, User seller) {
        MarketplaceEscrow escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new IllegalArgumentException("Escrow record not found"));

        if (!escrow.getListing().getUser().getId().equals(seller.getId())) {
            throw new IllegalArgumentException("Only the seller can mark the item as shipped.");
        }

        if (escrow.getStatus() != MarketplaceEscrowStatus.PAID) {
            throw new IllegalArgumentException("Item can only be shipped after payment is submitted.");
        }

        if (!"CONFIRMED".equalsIgnoreCase(escrow.getAdminNotes())) {
            throw new IllegalArgumentException("You must wait for admin to verify the payment before shipping.");
        }

        escrow.setStatus(MarketplaceEscrowStatus.SHIPPED);
        return escrowRepository.save(escrow);
    }

    public MarketplaceEscrow confirmReceipt(UUID escrowId, User buyer) {
        MarketplaceEscrow escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new IllegalArgumentException("Escrow record not found"));

        if (!escrow.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("Only the buyer can confirm receipt of the item.");
        }

        if (escrow.getStatus() != MarketplaceEscrowStatus.SHIPPED) {
            throw new IllegalArgumentException("You can only confirm receipt after the seller has shipped.");
        }

        escrow.setStatus(MarketplaceEscrowStatus.COMPLETED);
        
        // Auto-deactivate listing
        Listing listing = escrow.getListing();
        listing.setIsActive(false);
        listingRepository.save(listing);

        return escrowRepository.save(escrow);
    }

    public MarketplaceEscrow raiseDispute(UUID escrowId, String reason, User buyer) {
        MarketplaceEscrow escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new IllegalArgumentException("Escrow record not found"));

        if (!escrow.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("Only the buyer can raise a dispute.");
        }

        if (escrow.getStatus() != MarketplaceEscrowStatus.SHIPPED) {
            throw new IllegalArgumentException("Disputes can only be raised after the item has been shipped.");
        }

        escrow.setStatus(MarketplaceEscrowStatus.DISPUTED);
        escrow.setDisputeReason(reason);
        return escrowRepository.save(escrow);
    }

    public List<MarketplaceEscrow> getListingEscrows(UUID listingId) {
        return escrowRepository.findByListingIdOrderByCreatedAtDesc(listingId);
    }

    public long getListingInterestCount(UUID listingId) {
        return escrowRepository.countByListingIdAndStatus(listingId, MarketplaceEscrowStatus.PENDING);
    }

    public Map<String, Object> getUserActivity(User user) {
        Map<String, Object> activity = new HashMap<>();
        activity.put("sent", escrowRepository.findByBuyerOrderByCreatedAtDesc(user));
        activity.put("received", escrowRepository.findByListingUserOrderByCreatedAtDesc(user));
        return activity;
    }

    // Admin commands
    public List<MarketplaceEscrow> getAllEscrowsForAdmin() {
        return escrowRepository.findAll();
    }

    public MarketplaceEscrow adminConfirmPayment(UUID escrowId, boolean confirm) {
        MarketplaceEscrow escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new IllegalArgumentException("Escrow record not found"));

        if (escrow.getStatus() != MarketplaceEscrowStatus.PAID) {
            throw new IllegalArgumentException("Can only confirm or reject payments that are in PAID status.");
        }

        if (confirm) {
            escrow.setAdminNotes("CONFIRMED");
        } else {
            escrow.setStatus(MarketplaceEscrowStatus.DECLINED);
            escrow.setAdminNotes("REJECTED");
        }
        return escrowRepository.save(escrow);
    }

    public MarketplaceEscrow adminCompleteTransaction(UUID escrowId) {
        MarketplaceEscrow escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new IllegalArgumentException("Escrow record not found"));

        escrow.setStatus(MarketplaceEscrowStatus.COMPLETED);
        
        Listing listing = escrow.getListing();
        listing.setIsActive(false);
        listingRepository.save(listing);

        return escrowRepository.save(escrow);
    }

    public MarketplaceEscrow adminRefundTransaction(UUID escrowId) {
        MarketplaceEscrow escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new IllegalArgumentException("Escrow record not found"));

        escrow.setStatus(MarketplaceEscrowStatus.REFUNDED);
        return escrowRepository.save(escrow);
    }
}
