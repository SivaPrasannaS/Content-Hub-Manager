package com.chm.repositories;

import com.chm.enums.ContentStatus;
import com.chm.models.Page;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PageRepository extends JpaRepository<Page, Long> {
    List<Page> findByStatus(ContentStatus status);

    Optional<Page> findBySlug(String slug);
}