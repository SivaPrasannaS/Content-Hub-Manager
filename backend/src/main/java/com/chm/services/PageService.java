package com.chm.services;

import com.chm.dto.PageRequest;
import com.chm.dto.PageResponse;
import com.chm.enums.ContentStatus;
import com.chm.exceptions.AccessDeniedException;
import com.chm.exceptions.ResourceNotFoundException;
import com.chm.models.Page;
import com.chm.models.User;
import com.chm.repositories.PageRepository;
import com.chm.utils.SecurityUtils;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PageService {

    private final PageRepository pageRepository;
    private final SecurityUtils securityUtils;

    public PageService(PageRepository pageRepository, SecurityUtils securityUtils) {
        this.pageRepository = pageRepository;
        this.securityUtils = securityUtils;
    }

    public List<PageResponse> getVisiblePages(Authentication authentication, ContentStatus status) {
        if (canManagePages(authentication)) {
            return getPagesByStatus(status);
        }

        if (status == null || status == ContentStatus.PUBLISHED) {
            return pageRepository.findByStatus(ContentStatus.PUBLISHED).stream().map(this::toResponse).toList();
        }

        return List.of();
    }

    @Transactional
    public PageResponse create(PageRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        Page page = Page.builder()
            .title(request.getTitle())
            .slug(toSlug(request.getTitle()))
            .body(request.getBody())
            .status(defaultStatus(request.getStatus()))
            .author(currentUser)
            .build();
        return toResponse(pageRepository.save(page));
    }

    @Transactional
    public PageResponse update(Long id, PageRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        Page page = getEntity(id);
        validateOwnership(page, currentUser);
        page.setTitle(request.getTitle());
        page.setSlug(toSlug(request.getTitle()));
        page.setBody(request.getBody());
        page.setStatus(defaultStatus(request.getStatus()));
        return toResponse(pageRepository.save(page));
    }

    @Transactional
    public PageResponse publish(Long id) {
        Page page = getEntity(id);
        page.setStatus(ContentStatus.PUBLISHED);
        return toResponse(pageRepository.save(page));
    }

    @Transactional
    public void delete(Long id) {
        Page page = getEntity(id);
        pageRepository.delete(page);
    }

    public Page getEntity(Long id) {
        return pageRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Page not found"));
    }

    private void validateOwnership(Page page, User currentUser) {
        boolean isOwner = page.getAuthor().getId().equals(currentUser.getId());
        boolean isManager = currentUser.hasRole("ROLE_MANAGER");
        boolean isAdmin = currentUser.hasRole("ROLE_ADMIN");
        if (!isOwner && !isManager && !isAdmin) {
            throw new AccessDeniedException("You do not have permission to manage this page");
        }
    }

    private ContentStatus defaultStatus(ContentStatus status) {
        return status == null ? ContentStatus.DRAFT : status;
    }

    private boolean canManagePages(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return false;
        }

        return authentication.getAuthorities().stream().anyMatch((authority) ->
            "ROLE_MANAGER".equals(authority.getAuthority()) || "ROLE_ADMIN".equals(authority.getAuthority())
        );
    }

    private List<PageResponse> getPagesByStatus(ContentStatus status) {
        if (status == null) {
            return pageRepository.findAll().stream().map(this::toResponse).toList();
        }

        return pageRepository.findByStatus(status).stream().map(this::toResponse).toList();
    }

    private PageResponse toResponse(Page page) {
        return PageResponse.builder()
            .id(page.getId())
            .title(page.getTitle())
            .slug(page.getSlug())
            .body(page.getBody())
            .status(page.getStatus())
            .authorId(page.getAuthor().getId())
            .authorUsername(page.getAuthor().getUsername())
            .createdAt(page.getCreatedAt())
            .updatedAt(page.getUpdatedAt())
            .build();
    }

    private String toSlug(String value) {
        return value.trim().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    }
}