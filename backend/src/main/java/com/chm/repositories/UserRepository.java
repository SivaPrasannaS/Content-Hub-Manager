package com.chm.repositories;

import com.chm.enums.ERole;
import com.chm.models.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    @Query("""
        select u from User u
        where not exists (
            select 1 from u.roles role where role.name = :roleName
        )
        order by u.username asc
        """)
    List<User> findAllExcludingRole(@Param("roleName") ERole roleName);

    boolean existsByUsername(String username);
}