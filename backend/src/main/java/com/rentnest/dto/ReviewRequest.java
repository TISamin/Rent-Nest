package com.rentnest.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class ReviewRequest {
    private UUID listingId;
    private Integer rating;
    private String comment;
}
