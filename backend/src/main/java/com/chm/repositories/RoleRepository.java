package com.chm.repositories;

import com.chm.enums.ERole;
import com.chm.models.Role;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(ERole name);

    boolean existsByName(ERole name);
}