package com.chm.services;

import com.chm.dto.CategoryRequest;
import com.chm.dto.CategoryResponse;
import com.chm.exceptions.ResourceNotFoundException;
import com.chm.models.Category;
import com.chm.repositories.CategoryRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<CategoryResponse> getAll() {
        return categoryRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        Category category = Category.builder()
            .name(request.getName())
            .slug(toSlug(request.getName()))
            .description(request.getDescription())
            .build();
        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = getCategoryEntity(id);
        category.setName(request.getName());
        category.setSlug(toSlug(request.getName()));
        category.setDescription(request.getDescription());
        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    public void delete(Long id) {
        Category category = getCategoryEntity(id);
        categoryRepository.delete(category);
    }

    public Category getCategoryEntity(Long id) {
        return categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
    }

    private CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
            .id(category.getId())
            .name(category.getName())
            .slug(category.getSlug())
            .description(category.getDescription())
            .build();
    }

    private String toSlug(String value) {
        return value.trim().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    }
}