package com.chm.controllers;

import com.chm.dto.UserRoleRequest;
import com.chm.services.UserService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Map<String, Object>> getUsers() {
        return userService.getAllUsers();
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> assignRole(@PathVariable Long id, @Valid @RequestBody UserRoleRequest request) {
        return userService.assignRole(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> deactivateUser(@PathVariable Long id) {
        userService.deactivate(id);
        return Map.of("message", "User deactivated successfully");
    }

    @PutMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> reactivateUser(@PathVariable Long id) {
        userService.reactivate(id);
        return ResponseEntity.ok(Map.of("message", "User reactivated successfully"));
    }

    @GetMapping("/audit")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Map<String, Object>> getAuditLogs() {
        return userService.getAuditLogs();
    }
}