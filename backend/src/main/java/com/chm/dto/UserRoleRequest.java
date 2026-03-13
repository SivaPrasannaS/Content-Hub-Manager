package com.chm.dto;

import com.chm.enums.ERole;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserRoleRequest {
    @NotNull(message = "Role is required")
    private ERole role;
}