package com.rentnest.controller;

import com.rentnest.dto.ApiResponse;
import com.rentnest.dto.ReportRequest;
import com.rentnest.model.User;
import com.rentnest.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> submitReport(
            @AuthenticationPrincipal User user,
            @RequestBody ReportRequest request) {
        
        reportService.submitReport(user, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Report submitted successfully"));
    }
}
