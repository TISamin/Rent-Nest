package com.rentnest.service;

import com.rentnest.dto.ReviewRequest;
import com.rentnest.dto.ReviewResponse;
import com.rentnest.exception.ResourceNotFoundException;
import com.rentnest.model.Listing;
import com.rentnest.model.Review;
import com.rentnest.model.User;
import com.rentnest.model.enums.ListingCategory;
import com.rentnest.repository.ListingRepository;
import com.rentnest.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ListingRepository listingRepository;

    @Transactional
    public ReviewResponse addReview(User user, ReviewRequest request) {
        Listing listing = listingRepository.findById(request.getListingId())
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found"));

        // Cannot review own listing
        if (listing.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Cannot review your own listing");
        }

        // Check category
        if (!isReviewableCategory(listing.getCategory())) {
            throw new IllegalArgumentException("This category does not support reviews");
        }

        // Check if already reviewed
        Optional<Review> existing = reviewRepository.findByUserIdAndListingId(user.getId(), listing.getId());
        if (existing.isPresent()) {
            throw new IllegalArgumentException("You have already reviewed this listing");
        }

        Review review = Review.builder()
                .user(user)
                .listing(listing)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Review savedReview = reviewRepository.save(review);
        updateListingStats(listing);

        return ReviewResponse.fromEntity(savedReview);
    }

    @Transactional
    public ReviewResponse updateReview(UUID reviewId, User user, ReviewRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));

        if (review.getUser() == null || !review.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You can only edit your own reviews");
        }

        review.setRating(request.getRating());
        review.setComment(request.getComment());
        Review savedReview = reviewRepository.save(review);
        
        updateListingStats(review.getListing());

        return ReviewResponse.fromEntity(savedReview);
    }

    @Transactional
    public void deleteReview(UUID reviewId, User user) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));

        if (review.getUser() == null || !review.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You can only delete your own reviews");
        }

        Listing listing = review.getListing();
        reviewRepository.delete(review);
        
        updateListingStats(listing);
    }

    public Page<ReviewResponse> getReviewsByListing(UUID listingId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Review> reviews = reviewRepository.findByListingId(listingId, pageable);
        return reviews.map(ReviewResponse::fromEntity);
    }

    private void updateListingStats(Listing listing) {
        // Find all reviews for this listing. We can just use an aggregate query but let's do a quick calculation.
        // Wait, reviewRepository.findByListingId(listing.getId(), Pageable.unpaged()) would return all.
        // Let's create a custom query or calculate it here.
        Page<Review> allReviews = reviewRepository.findByListingId(listing.getId(), PageRequest.of(0, Integer.MAX_VALUE));
        List<Review> reviewsList = allReviews.getContent();
        
        int count = reviewsList.size();
        if (count == 0) {
            listing.setReviewCount(0);
            listing.setAverageRating(BigDecimal.ZERO);
        } else {
            double total = reviewsList.stream().mapToInt(Review::getRating).sum();
            BigDecimal avg = BigDecimal.valueOf(total / count).setScale(2, RoundingMode.HALF_UP);
            listing.setReviewCount(count);
            listing.setAverageRating(avg);
        }
        listingRepository.save(listing);
    }

    private boolean isReviewableCategory(ListingCategory category) {
        return category == ListingCategory.FLAT ||
               category == ListingCategory.HOTEL ||
               category == ListingCategory.HOUSE ||
               category == ListingCategory.CONVENTION_HALL ||
               category == ListingCategory.SHIFTING_SERVICE ||
               category == ListingCategory.CATERING_SERVICE;
    }
}
