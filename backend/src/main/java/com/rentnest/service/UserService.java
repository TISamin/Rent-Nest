package com.rentnest.service;

import com.rentnest.dto.ListingResponse;
import com.rentnest.dto.UserProfileDTO;
import com.rentnest.model.User;
import com.rentnest.repository.ListingRepository;
import com.rentnest.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;

    @Transactional
    public User updateProfile(User currentUser, UserProfileDTO dto) {
        if (dto.getName() != null) {
            currentUser.setName(dto.getName());
        }
        if (dto.getEmail() != null) {
            currentUser.setEmail(dto.getEmail());
        }
        if (dto.getPhoneNumber() != null && !dto.getPhoneNumber().isBlank()) {
            currentUser.setPhoneNumber(dto.getPhoneNumber());
        }
        if (dto.getAddress() != null) {
            currentUser.setAddress(dto.getAddress());
        }
        if (dto.getProfilePhotoUrl() != null) {
            currentUser.setProfilePhotoUrl(dto.getProfilePhotoUrl());
        }
        return userRepository.save(currentUser);
    }

    public Optional<User> findById(UUID id) {
        return userRepository.findById(id);
    }

    /**
     * Fetch all active listings for a given user.
     * Runs inside a transaction so lazy-loaded User relations in Listing are safe.
     */
    @Transactional(readOnly = true)
    public List<ListingResponse> getPublicListingsForUser(UUID userId) {
        return listingRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .filter(l -> Boolean.TRUE.equals(l.getIsActive()))
                .map(ListingResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
