package com.chm.services;

import com.chm.dto.ArticleRequest;
import com.chm.dto.ArticleResponse;
import com.chm.enums.ContentStatus;
import com.chm.exceptions.AccessDeniedException;
import com.chm.exceptions.ResourceNotFoundException;
import com.chm.models.Article;
import com.chm.models.Category;
import com.chm.models.User;
import com.chm.repositories.ArticleRepository;
import com.chm.utils.SecurityUtils;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final CategoryService categoryService;
    private final SecurityUtils securityUtils;

    public ArticleService(ArticleRepository articleRepository, CategoryService categoryService, SecurityUtils securityUtils) {
        this.articleRepository = articleRepository;
        this.categoryService = categoryService;
        this.securityUtils = securityUtils;
    }

    public org.springframework.data.domain.Page<ArticleResponse> getAll(
        int page,
        int size,
        Long categoryId,
        ContentStatus status,
        String month,
        String tag,
        User currentUser
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        boolean canManageAllArticles = currentUser != null && (currentUser.hasRole("ROLE_MANAGER") || currentUser.hasRole("ROLE_ADMIN"));
        return articleRepository.findAll((root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (categoryId != null) {
                predicates.add(builder.equal(root.get("category").get("id"), categoryId));
            }
            if (month != null && !month.isBlank()) {
                YearMonth yearMonth = YearMonth.parse(month);
                predicates.add(builder.between(root.get("createdAt"), yearMonth.atDay(1).atStartOfDay(), yearMonth.atEndOfMonth().atTime(23, 59, 59)));
            }
            if (tag != null && !tag.isBlank()) {
                predicates.add(builder.like(builder.lower(root.get("tags")), "%" + tag.toLowerCase() + "%"));
            }
            if (status != null) {
                predicates.add(builder.equal(root.get("status"), status));
                if (status == ContentStatus.DRAFT && !canManageAllArticles) {
                    if (currentUser == null) {
                        predicates.add(builder.disjunction());
                    } else {
                        predicates.add(builder.equal(root.get("author").get("id"), currentUser.getId()));
                    }
                }
            } else if (currentUser == null) {
                predicates.add(builder.equal(root.get("status"), ContentStatus.PUBLISHED));
            } else if (!canManageAllArticles) {
                predicates.add(
                    builder.or(
                        builder.equal(root.get("status"), ContentStatus.PUBLISHED),
                        builder.and(
                            builder.equal(root.get("status"), ContentStatus.DRAFT),
                            builder.equal(root.get("author").get("id"), currentUser.getId())
                        )
                    )
                );
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        }, pageable).map(this::toResponse);
    }

    public ArticleResponse getById(Long id, User currentUser) {
        Article article = getEntity(id);
        if (article.getStatus() == ContentStatus.PUBLISHED) {
            return toResponse(article);
        }
        validateOwnership(article, currentUser);
        return toResponse(article);
    }

    @Transactional
    public ArticleResponse create(ArticleRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        Category category = categoryService.getCategoryEntity(request.getCategoryId());
        ContentStatus status = currentUser.hasRole("ROLE_USER") ? ContentStatus.DRAFT : defaultStatus(request.getStatus());

        Article article = Article.builder()
            .title(request.getTitle())
            .slug(toSlug(request.getTitle()))
            .body(request.getBody())
            .excerpt(request.getExcerpt())
            .status(status)
            .author(currentUser)
            .category(category)
            .tags(normalizeTags(request.getTags()))
            .publishedAt(status == ContentStatus.PUBLISHED ? LocalDateTime.now() : null)
            .build();

        return toResponse(articleRepository.save(article));
    }

    @Transactional
    public ArticleResponse update(Long id, ArticleRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        Article article = getEntity(id);
        validateOwnership(article, currentUser);

        article.setTitle(request.getTitle());
        article.setSlug(toSlug(request.getTitle()));
        article.setBody(request.getBody());
        article.setExcerpt(request.getExcerpt());
        article.setCategory(categoryService.getCategoryEntity(request.getCategoryId()));
        article.setTags(normalizeTags(request.getTags()));

        ContentStatus targetStatus = currentUser.hasRole("ROLE_USER") ? ContentStatus.DRAFT : defaultStatus(request.getStatus());
        article.setStatus(targetStatus);
        article.setPublishedAt(targetStatus == ContentStatus.PUBLISHED ? LocalDateTime.now() : null);
        return toResponse(articleRepository.save(article));
    }

    @Transactional
    public ArticleResponse publish(Long id) {
        User currentUser = securityUtils.getCurrentUser();
        Article article = getEntity(id);
        validatePublishPermission(article, currentUser);
        article.setStatus(ContentStatus.PUBLISHED);
        article.setPublishedAt(LocalDateTime.now());
        return toResponse(articleRepository.save(article));
    }

    @Transactional
    public void delete(Long id) {
        User currentUser = securityUtils.getCurrentUser();
        Article article = getEntity(id);
        boolean isOwner = article.getAuthor().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.hasRole("ROLE_ADMIN");
        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("You cannot delete this article");
        }
        articleRepository.delete(article);
    }

    public Article getEntity(Long id) {
        return articleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Article not found"));
    }

    private void validateOwnership(Article article, User currentUser) {
        if (currentUser == null) {
            throw new AccessDeniedException("You do not have permission to access this article");
        }
        boolean isOwner = article.getAuthor().getId().equals(currentUser.getId());
        boolean isManager = currentUser.hasRole("ROLE_MANAGER");
        boolean isAdmin = currentUser.hasRole("ROLE_ADMIN");
        if (!isOwner && !isManager && !isAdmin) {
            throw new AccessDeniedException("You do not have permission to modify this article");
        }
    }

    private void validatePublishPermission(Article article, User currentUser) {
        if (currentUser == null) {
            throw new AccessDeniedException("You do not have permission to publish this article");
        }

        boolean isOwner = article.getAuthor().getId().equals(currentUser.getId());
        boolean isManager = currentUser.hasRole("ROLE_MANAGER");
        boolean isAdmin = currentUser.hasRole("ROLE_ADMIN");
        if (!isOwner && !isManager && !isAdmin) {
            throw new AccessDeniedException("You do not have permission to publish this article");
        }
    }

    private ContentStatus defaultStatus(ContentStatus status) {
        return status == null ? ContentStatus.DRAFT : status;
    }

    private ArticleResponse toResponse(Article article) {
        return ArticleResponse.builder()
            .id(article.getId())
            .title(article.getTitle())
            .slug(article.getSlug())
            .body(article.getBody())
            .excerpt(article.getExcerpt())
            .status(article.getStatus())
            .authorId(article.getAuthor().getId())
            .authorUsername(article.getAuthor().getUsername())
            .categoryId(article.getCategory().getId())
            .categoryName(article.getCategory().getName())
            .tags(article.getTags() == null || article.getTags().isBlank() ? List.of() : Arrays.stream(article.getTags().split(",")).map(String::trim).filter(tag -> !tag.isBlank()).toList())
            .publishedAt(article.getPublishedAt())
            .createdAt(article.getCreatedAt())
            .updatedAt(article.getUpdatedAt())
            .build();
    }

    private String normalizeTags(String tags) {
        if (tags == null || tags.isBlank()) {
            return "";
        }
        return Arrays.stream(tags.split(",")).map(String::trim).filter(tag -> !tag.isBlank()).distinct().reduce((a, b) -> a + "," + b).orElse("");
    }

    private String toSlug(String value) {
        return value.trim().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    }
}