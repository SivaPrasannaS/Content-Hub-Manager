package com.chm.controllers;

import com.chm.dto.MediaResponse;
import com.chm.enums.MediaType;
import com.chm.services.MediaService;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/media")
public class MediaController {

    private final MediaService mediaService;

    public MediaController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<MediaResponse> getMedia() {
        return mediaService.getAll();
    }

    @PostMapping(consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public MediaResponse createMedia(
        @RequestParam("file") MultipartFile file,
        @RequestParam("mediaType") MediaType mediaType
    ) {
        return mediaService.create(file, mediaType);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public Map<String, String> deleteMedia(@PathVariable Long id) {
        mediaService.delete(id);
        return Map.of("message", "Media deleted successfully");
    }
}