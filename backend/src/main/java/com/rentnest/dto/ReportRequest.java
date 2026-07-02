package com.rentnest.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class ReportRequest {
    private String targetType; // 'LISTING', 'REVIEW', 'USER'
    private UUID targetId;
    private String reason;
    private String note;
}
