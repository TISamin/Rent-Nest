package com.rentnest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for search/filter requests.
 * Placeholder for Phase 3 full search implementation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchRequest {

    private String location;
    private String category;
    private String keyword;

    @Builder.Default
    private int page = 0;

    @Builder.Default
    private int size = 20;
}
