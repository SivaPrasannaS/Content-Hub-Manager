package com.chm.controllers;

import com.chm.dto.PageRequest;
import com.chm.dto.PageResponse;
import com.chm.enums.ContentStatus;
import com.chm.services.PageService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pages")
public class PageController {

    private final PageService pageService;

    public PageController(PageService pageService) {
        this.pageService = pageService;
    }

    @GetMapping
    public List<PageResponse> getPages(
        Authentication authentication,
        @RequestParam(required = false) ContentStatus status
    ) {
        return pageService.getVisiblePages(authentication, status);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public PageResponse createPage(@Valid @RequestBody PageRequest request) {
        return pageService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public PageResponse updatePage(@PathVariable Long id, @Valid @RequestBody PageRequest request) {
        return pageService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> deletePage(@PathVariable Long id) {
        pageService.delete(id);
        return Map.of("message", "Page deleted successfully");
    }

    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public PageResponse publishPage(@PathVariable Long id) {
        return pageService.publish(id);
    }
}