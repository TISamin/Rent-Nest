package com.rentnest.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminStatsResponse {
    private long totalUsers;
    private long totalListings;
    private long totalReviews;
    private long pendingReports;
    private long resolvedReports;
}
