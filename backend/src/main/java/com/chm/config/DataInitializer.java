package com.chm.config;

import com.chm.enums.ERole;
import com.chm.models.Role;
import com.chm.models.User;
import com.chm.repositories.RoleRepository;
import com.chm.repositories.UserRepository;
import java.util.Set;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements ApplicationRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(RoleRepository roleRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        seedRole(ERole.ROLE_USER);
        seedRole(ERole.ROLE_MANAGER);
        seedRole(ERole.ROLE_ADMIN);

        if (!userRepository.existsByUsername("admin")) {
            User adminRoleUser = User.builder()
                .username("admin")
                .password(passwordEncoder.encode("Admin@123"))
                .active(true)
                .roles(Set.of(getRole(ERole.ROLE_ADMIN)))
                .build();
            userRepository.save(adminRoleUser);
        }
    }

    private void seedRole(ERole roleName) {
        if (!roleRepository.existsByName(roleName)) {
            roleRepository.save(Role.builder().name(roleName).build());
        }
    }

    private Role getRole(ERole roleName) {
        return roleRepository.findByName(roleName)
            .orElseThrow(() -> new IllegalArgumentException("Role not found: " + roleName));
    }
}