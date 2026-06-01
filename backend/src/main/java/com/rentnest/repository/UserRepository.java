package com.rentnest.repository;

import com.rentnest.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for User entity operations.
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * Find a user by their phone number (legacy support).
     */
    Optional<User> findByPhoneNumber(String phoneNumber);

    /**
     * Find a user by their email address (primary auth method).
     */
    Optional<User> findByEmail(String email);
}
