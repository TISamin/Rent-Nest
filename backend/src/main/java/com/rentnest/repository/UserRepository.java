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
     * Find a user by their phone number (used during authentication).
     */
    Optional<User> findByPhoneNumber(String phoneNumber);
}
