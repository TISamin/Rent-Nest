package com.rentnest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Public-facing user profile DTO — never exposes sensitive fields like passwordHash or email.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicUserProfileDTO {
    private UUID id;
    private String name;
    private String profilePhotoUrl;
    private LocalDateTime memberSince;
}
