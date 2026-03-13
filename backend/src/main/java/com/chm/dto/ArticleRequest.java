package com.chm.dto;

import com.chm.enums.ContentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ArticleRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 200, message = "Title must be between 5 and 200 characters")
    private String title;

    @NotBlank(message = "Body is required")
    @Size(min = 20, message = "Body must be at least 20 characters")
    private String body;

    @Size(max = 500, message = "Excerpt must not exceed 500 characters")
    private String excerpt;

    @NotNull(message = "Category is required")
    private Long categoryId;

    private ContentStatus status;

    private String tags;
}