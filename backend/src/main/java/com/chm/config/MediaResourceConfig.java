package com.chm.config;

import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.lang.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class MediaResourceConfig implements WebMvcConfigurer {

    private final Path uploadRoot;

    public MediaResourceConfig(@Value("${app.media.upload-dir}") String uploadDir) {
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/media/**")
            .addResourceLocations(uploadRoot.toUri().toString());
    }
}