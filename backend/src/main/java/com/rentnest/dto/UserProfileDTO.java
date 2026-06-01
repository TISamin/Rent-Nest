package com.rentnest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for partial user profile updates.
 * All fields are optional to support patch-style updates.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileDTO {

    private String name;
    private String email;
    private String address;
    private String profilePhotoUrl;
}
