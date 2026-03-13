package com.chm.dto;

import com.chm.enums.MediaType;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MediaResponse {
    private Long id;
    private String filename;
    private String originalName;
    private String url;
    private MediaType mediaType;
    private Long size;
    private Long uploadedById;
    private String uploadedByUsername;
    private LocalDateTime createdAt;
}