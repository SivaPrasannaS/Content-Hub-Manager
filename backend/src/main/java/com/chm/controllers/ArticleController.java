package com.chm.controllers;

import com.chm.dto.ArticleRequest;
import com.chm.dto.ArticleResponse;
import com.chm.enums.ContentStatus;
import com.chm.models.User;
import com.chm.services.ArticleService;
import com.chm.services.UserService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
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
@RequestMapping("/api/articles")
public class ArticleController {

    private final ArticleService articleService;
    private final UserService userService;

    public ArticleController(ArticleService articleService, UserService userService) {
        this.articleService = articleService;
        this.userService = userService;
    }

    @GetMapping
    public Map<String, Object> getArticles(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(required = false) Long categoryId,
        @RequestParam(required = false) ContentStatus status,
        @RequestParam(required = false) String month,
        @RequestParam(required = false) String tag,
        Principal principal
    ) {
        User currentUser = principal != null ? userService.getUserByUsername(principal.getName()) : null;
        Page<ArticleResponse> result = articleService.getAll(page, size, categoryId, status, month, tag, currentUser);
        return Map.of(
            "items", result.getContent(),
            "total", result.getTotalElements(),
            "page", result.getNumber(),
            "size", result.getSize()
        );
    }

    @GetMapping("/{id}")
    public ArticleResponse getArticle(@PathVariable Long id, Principal principal) {
        User currentUser = principal != null ? userService.getUserByUsername(principal.getName()) : null;
        return articleService.getById(id, currentUser);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public ArticleResponse createArticle(@Valid @RequestBody ArticleRequest request) {
        return articleService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ArticleResponse updateArticle(@PathVariable Long id, @Valid @RequestBody ArticleRequest request) {
        return articleService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public Map<String, String> deleteArticle(@PathVariable Long id) {
        articleService.delete(id);
        return Map.of("message", "Article deleted successfully");
    }

    @PatchMapping("/{id}/publish")
    @PreAuthorize("isAuthenticated()")
    public ArticleResponse publishArticle(@PathVariable Long id) {
        return articleService.publish(id);
    }
}