package com.chm.repositories;

import com.chm.models.Media;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MediaRepository extends JpaRepository<Media, Long> {
    List<Media> findByUploadedById(Long uploadedById);
}