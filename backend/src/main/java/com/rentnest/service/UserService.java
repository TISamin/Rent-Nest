package com.rentnest.service;

import com.rentnest.dto.UserProfileDTO;
import com.rentnest.model.User;
import com.rentnest.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public User updateProfile(User currentUser, UserProfileDTO dto) {
        if (dto.getName() != null) {
            currentUser.setName(dto.getName());
        }
        if (dto.getEmail() != null) {
            currentUser.setEmail(dto.getEmail());
        }
        if (dto.getAddress() != null) {
            currentUser.setAddress(dto.getAddress());
        }
        if (dto.getProfilePhotoUrl() != null) {
            currentUser.setProfilePhotoUrl(dto.getProfilePhotoUrl());
        }
        return userRepository.save(currentUser);
    }
}
