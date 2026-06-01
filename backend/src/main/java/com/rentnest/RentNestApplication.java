package com.rentnest;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * RentNest — Rental and Services Listing Platform.
 * <p>
 * Entry point for the Spring Boot backend application.
 */
@SpringBootApplication
@EnableScheduling
public class RentNestApplication {

    public static void main(String[] args) {
        SpringApplication.run(RentNestApplication.class, args);
    }
}
