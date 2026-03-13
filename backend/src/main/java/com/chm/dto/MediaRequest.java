package com.chm.dto;

import com.chm.enums.MediaType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MediaRequest {
    @NotBlank(message = "Filename is required")
    private String filename;

    @NotBlank(message = "Original name is required")
    private String originalName;

    @NotBlank(message = "URL is required")
    private String url;

    @NotNull(message = "Media type is required")
    private MediaType mediaType;

    @NotNull(message = "Size is required")
    private Long size;
}