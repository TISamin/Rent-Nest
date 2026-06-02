package com.rentnest.service;

import com.rentnest.model.User;
import com.rentnest.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Authentication service handling user lookup, creation, and password management.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    /**
     * Finds a user by email.
     */
    public Optional<User> findUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * Creates a new user for signup after OTP verification.
     */
    public User signupUserByEmail(String email) {
        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent()) {
            throw new IllegalArgumentException("Account already exists for this email");
        }

        log.info("Creating new user account for email: {}", email);
        User newUser = User.builder()
                .email(email)
                .createdAt(LocalDateTime.now())
                .build();
        return userRepository.save(newUser);
    }

    /**
     * Checks email and password credentials for logging in.
     */
    public User loginWithPassword(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
            throw new IllegalStateException("Password not set for this account. Please verify via signup to set a password.");
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        return user;
    }

    /**
     * Set/update user's password (used for setting and resetting password).
     */
    public void setPassword(User user, String password) {
        if (password == null || password.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters long");
        }
        user.setPasswordHash(passwordEncoder.encode(password));
        userRepository.save(user);
        log.info("Password updated for user: {}", user.getEmail());
    }

    /**
     * Finds a user by email or creates a new one (legacy fallback).
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
}
