package com.chm.dto;

import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class AnalyticsSummary {
    private long totalArticles;
    private long publishedArticles;
    private long draftArticles;
    private long totalPages;
    private long totalMedia;
    private long totalCategories;
    private List<Map<String, Object>> monthly;
    private List<Map<String, Object>> byCategory;
}