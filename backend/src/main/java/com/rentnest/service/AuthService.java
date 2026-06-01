package com.rentnest.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.rentnest.model.User;
import com.rentnest.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

import com.google.firebase.auth.UserRecord;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;

    /**
     * Verifies a Firebase ID token using the Firebase Admin SDK.
     * Returns the phone number associated with the token.
     */
    public String verifyFirebaseToken(String idToken) throws Exception {
        FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
        String uid = decodedToken.getUid();
        UserRecord userRecord = FirebaseAuth.getInstance().getUser(uid);
        String phoneNumber = userRecord.getPhoneNumber();
        if (phoneNumber == null || phoneNumber.isEmpty()) {
            throw new IllegalArgumentException("Firebase token does not contain a phone number.");
        }
        return phoneNumber;
    }

    /**
     * Finds a user by phone number or creates a new one.
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
