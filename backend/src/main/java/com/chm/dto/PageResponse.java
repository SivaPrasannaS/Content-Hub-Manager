package com.chm.dto;

import com.chm.enums.ContentStatus;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PageResponse {
    private Long id;
    private String title;
    private String slug;
    private String body;
    private ContentStatus status;
    private Long authorId;
    private String authorUsername;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}