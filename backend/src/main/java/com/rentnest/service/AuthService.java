package com.rentnest.service;

import com.rentnest.model.User;
import com.rentnest.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Authentication service handling user lookup and creation.
 * Primary auth is now email-based OTP (no Firebase dependency).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;

    /**
     * Finds a user by email or creates a new one.
     */
    public User findOrCreateUserByEmail(String email) {
        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent()) {
            return existingUser.get();
        }

        log.info("Creating new user for email: {}", email);
        User newUser = User.builder()
                .email(email)
                .createdAt(LocalDateTime.now())
                .build();
        return userRepository.save(newUser);
    }

    /**
     * Finds a user by phone number or creates a new one (legacy support).
     */
    public User findOrCreateUser(String phoneNumber) {
        Optional<User> existingUser = userRepository.findByPhoneNumber(phoneNumber);
        if (existingUser.isPresent()) {
            return existingUser.get();
        }

        log.info("Creating new user for phone number: {}", phoneNumber);
        User newUser = User.builder()
                .phoneNumber(phoneNumber)
                .createdAt(LocalDateTime.now())
                .build();
        return userRepository.save(newUser);
    }
}
