package com.chm.dto;

import com.chm.enums.ContentStatus;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ArticleResponse {
    private Long id;
    private String title;
    private String slug;
    private String body;
    private String excerpt;
    private ContentStatus status;
    private Long authorId;
    private String authorUsername;
    private Long categoryId;
    private String categoryName;
    private List<String> tags;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}