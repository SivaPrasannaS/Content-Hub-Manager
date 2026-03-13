package com.chm.services;

import com.chm.dto.MediaResponse;
import com.chm.enums.MediaType;
import com.chm.exceptions.AccessDeniedException;
import com.chm.exceptions.ResourceNotFoundException;
import com.chm.models.Media;
import com.chm.models.User;
import com.chm.repositories.MediaRepository;
import com.chm.utils.SecurityUtils;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class MediaService {

    private final MediaRepository mediaRepository;
    private final SecurityUtils securityUtils;
    private final Path uploadRoot;
    private final String mediaBaseUrl;

    public MediaService(
        MediaRepository mediaRepository,
        SecurityUtils securityUtils,
        @Value("${app.media.upload-dir}") String uploadDir,
        @Value("${app.media.base-url}") String mediaBaseUrl
    ) {
        this.mediaRepository = mediaRepository;
        this.securityUtils = securityUtils;
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.mediaBaseUrl = mediaBaseUrl.endsWith("/") ? mediaBaseUrl.substring(0, mediaBaseUrl.length() - 1) : mediaBaseUrl;
    }

    public List<MediaResponse> getAll() {
        return mediaRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public MediaResponse create(MultipartFile file, MediaType mediaType) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Media file is required");
        }

        User currentUser = securityUtils.getCurrentUser();
        String originalName = sanitizeFilename(file.getOriginalFilename());
        String storedFilename = buildStoredFilename(originalName);
        Path targetFile = uploadRoot.resolve(storedFilename).normalize();

        try {
            Files.createDirectories(uploadRoot);
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to store media file", exception);
        }

        Media media = Media.builder()
            .filename(storedFilename)
            .originalName(originalName)
            .url(mediaBaseUrl + "/media/" + storedFilename)
            .mediaType(mediaType)
            .size(file.getSize())
            .uploadedBy(currentUser)
            .build();
        return toResponse(Objects.requireNonNull(mediaRepository.save(media)));
    }

    @Transactional
    public void delete(Long id) {
        User currentUser = securityUtils.getCurrentUser();
        Media media = mediaRepository.findById(Objects.requireNonNull(id))
            .orElseThrow(() -> new ResourceNotFoundException("Media not found"));
        boolean isOwner = media.getUploadedBy().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.hasRole("ROLE_ADMIN");
        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("You cannot delete this media item");
        }
        deleteStoredFile(media.getFilename());
        mediaRepository.delete(media);
    }

    private void deleteStoredFile(String filename) {
        if (filename == null || filename.isBlank()) {
            return;
        }

        try {
            Files.deleteIfExists(uploadRoot.resolve(filename).normalize());
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to delete media file", exception);
        }
    }

    private String sanitizeFilename(String filename) {
        String fallback = filename == null || filename.isBlank() ? "media-file" : filename;
        return Paths.get(fallback).getFileName().toString().replaceAll("[^A-Za-z0-9._-]", "-");
    }

    private String buildStoredFilename(String originalName) {
        int extensionIndex = originalName.lastIndexOf('.');
        String baseName = extensionIndex > 0 ? originalName.substring(0, extensionIndex) : originalName;
        String extension = extensionIndex > 0 ? originalName.substring(extensionIndex) : "";
        return baseName + "-" + UUID.randomUUID().toString().substring(0, 8) + extension;
    }

    private MediaResponse toResponse(Media media) {
        return MediaResponse.builder()
            .id(media.getId())
            .filename(media.getFilename())
            .originalName(media.getOriginalName())
            .url(media.getUrl())
            .mediaType(media.getMediaType())
            .size(media.getSize())
            .uploadedById(media.getUploadedBy().getId())
            .uploadedByUsername(media.getUploadedBy().getUsername())
            .createdAt(media.getCreatedAt())
            .build();
    }
}