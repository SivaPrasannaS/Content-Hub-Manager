package com.chm.controllers;

import com.chm.dto.AnalyticsSummary;
import com.chm.services.AnalyticsService;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public AnalyticsSummary getSummary() {
        return analyticsService.getSummary();
    }

    @GetMapping("/monthly")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public List<Map<String, Object>> getMonthly() {
        return analyticsService.getMonthly();
    }

    @GetMapping("/by-category")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public List<Map<String, Object>> getByCategory() {
        return analyticsService.getByCategory();
    }
}