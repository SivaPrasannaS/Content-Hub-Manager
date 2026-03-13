package com.chm.services;

import com.chm.dto.AnalyticsSummary;
import com.chm.enums.ContentStatus;
import com.chm.repositories.ArticleRepository;
import com.chm.repositories.CategoryRepository;
import com.chm.repositories.MediaRepository;
import com.chm.repositories.PageRepository;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class AnalyticsService {

    private final ArticleRepository articleRepository;
    private final PageRepository pageRepository;
    private final MediaRepository mediaRepository;
    private final CategoryRepository categoryRepository;

    public AnalyticsService(
        ArticleRepository articleRepository,
        PageRepository pageRepository,
        MediaRepository mediaRepository,
        CategoryRepository categoryRepository
    ) {
        this.articleRepository = articleRepository;
        this.pageRepository = pageRepository;
        this.mediaRepository = mediaRepository;
        this.categoryRepository = categoryRepository;
    }

    public AnalyticsSummary getSummary() {
        return AnalyticsSummary.builder()
            .totalArticles(articleRepository.count())
            .publishedArticles(articleRepository.countByStatus(ContentStatus.PUBLISHED))
            .draftArticles(articleRepository.countByStatus(ContentStatus.DRAFT))
            .totalPages(pageRepository.count())
            .totalMedia(mediaRepository.count())
            .totalCategories(categoryRepository.count())
            .monthly(getMonthly())
            .byCategory(getByCategory())
            .build();
    }

    public List<Map<String, Object>> getMonthly() {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth yearMonth = YearMonth.now().minusMonths(i);
            LocalDateTime start = yearMonth.atDay(1).atStartOfDay();
            LocalDateTime end = yearMonth.atEndOfMonth().atTime(23, 59, 59);
            rows.add(Map.of(
                "month", yearMonth.toString(),
                "count", articleRepository.countByCreatedAtBetween(start, end)
            ));
        }
        return rows;
    }

    public List<Map<String, Object>> getByCategory() {
        return categoryRepository.findAll().stream().map(category -> Map.<String, Object>of(
            "categoryId", category.getId(),
            "categoryName", category.getName(),
            "count", articleRepository.countByCategoryId(category.getId())
        )).toList();
    }
}