package com.chm.repositories;

import com.chm.enums.ContentStatus;
import com.chm.models.Article;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ArticleRepository extends JpaRepository<Article, Long>, JpaSpecificationExecutor<Article> {
    Optional<Article> findBySlug(String slug);

    Page<Article> findByStatus(ContentStatus status, Pageable pageable);

    long countByStatus(ContentStatus status);

    long countByCategoryId(Long categoryId);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}