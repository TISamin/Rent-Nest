package com.rentnest.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * Initializes the Firebase Admin SDK on application startup.
 * Reads the service account JSON from the configured path.
 */
@Slf4j
@Configuration
public class FirebaseConfig {

    @Value("${firebase.config-path}")
    private String firebaseConfigPath;

    @PostConstruct
    public void initializeFirebase() {
        if (!FirebaseApp.getApps().isEmpty()) {
            log.info("Firebase already initialized — skipping.");
            return;
        }

        try {
            InputStream serviceAccount = getServiceAccountStream();
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            FirebaseApp.initializeApp(options);
            log.info("Firebase Admin SDK initialized successfully.");
        } catch (IOException e) {
            log.warn("Firebase service account not found at '{}'. " +
                     "Firebase auth will not work until a valid config is provided.", firebaseConfigPath);
        }
    }

    /**
     * Attempts to load the service account file from the classpath first,
     * then falls back to the filesystem path.
     */
    private InputStream getServiceAccountStream() throws IOException {
        try {
            ClassPathResource resource = new ClassPathResource(firebaseConfigPath);
            if (resource.exists()) {
                return resource.getInputStream();
            }
        } catch (Exception ignored) {
            // Fall through to filesystem
        }
        return new FileInputStream(firebaseConfigPath);
    }
}
