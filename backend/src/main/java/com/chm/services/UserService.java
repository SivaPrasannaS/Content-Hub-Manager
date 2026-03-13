package com.chm.services;

import com.chm.dto.UserRoleRequest;
import com.chm.enums.ERole;
import com.chm.exceptions.ResourceNotFoundException;
import com.chm.models.AuditLog;
import com.chm.models.Role;
import com.chm.models.User;
import com.chm.repositories.AuditLogRepository;
import com.chm.repositories.RoleRepository;
import com.chm.repositories.UserRepository;
import com.chm.utils.SecurityUtils;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AuditLogRepository auditLogRepository;
    private final SecurityUtils securityUtils;

    public UserService(
        UserRepository userRepository,
        RoleRepository roleRepository,
        AuditLogRepository auditLogRepository,
        SecurityUtils securityUtils
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.auditLogRepository = auditLogRepository;
        this.securityUtils = securityUtils;
    }

    public List<Map<String, Object>> getAllUsers() {
        return userRepository.findAllExcludingRole(ERole.ROLE_ADMIN).stream().map(user -> Map.<String, Object>of(
            "id", user.getId(),
            "username", user.getUsername(),
            "active", user.isActive(),
            "roles", user.getRoles().stream().map(role -> role.getName().name()).toList()
        )).toList();
    }

    @Transactional
    public Map<String, Object> assignRole(Long id, UserRoleRequest request) {
        if (request.getRole() == ERole.ROLE_ADMIN) {
            throw new IllegalArgumentException("Admin role cannot be assigned from the dashboard API");
        }

        User user = getUser(id);
        Role role = roleRepository.findByName(request.getRole())
            .orElseThrow(() -> new ResourceNotFoundException("Role not found"));
        user.setRoles(new HashSet<>(Set.of(role)));
        User saved = userRepository.save(user);
        log("ASSIGN_ROLE", "User", saved.getId(), "Assigned role " + request.getRole());
        return Map.of("id", saved.getId(), "role", request.getRole().name());
    }

    @Transactional
    public void deactivate(Long id) {
        User currentUser = securityUtils.getCurrentUser();
        if (currentUser.getId().equals(id)) {
            throw new IllegalArgumentException("Admin cannot deactivate own account");
        }
        User user = getUser(id);
        user.setActive(false);
        userRepository.save(user);
        log("DEACTIVATE_USER", "User", user.getId(), "User deactivated");
    }

    @Transactional
    public void reactivate(Long id) {
        User user = getUser(id);
        user.setActive(true);
        userRepository.save(user);
        log("REACTIVATE_USER", "User", user.getId(), "User reactivated");
    }

    public List<Map<String, Object>> getAuditLogs() {
        return auditLogRepository.findTop50ByOrderByCreatedAtDesc().stream().map(log -> Map.<String, Object>of(
            "id", log.getId(),
            "action", log.getAction(),
            "entityType", log.getEntityType(),
            "entityId", log.getEntityId(),
            "details", log.getDetails(),
            "createdAt", log.getCreatedAt(),
            "performedBy", log.getPerformedBy() != null ? log.getPerformedBy().getUsername() : "system"
        )).toList();
    }

    public User getUser(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private void log(String action, String entityType, Long entityId, String details) {
        auditLogRepository.save(AuditLog.builder()
            .action(action)
            .entityType(entityType)
            .entityId(entityId)
            .details(details)
            .performedBy(securityUtils.getCurrentUser())
            .build());
    }
}