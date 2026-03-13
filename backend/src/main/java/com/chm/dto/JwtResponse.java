package com.chm.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class JwtResponse {
    private Long id;
    private String username;
    private List<String> roles;
    private String token;
    private String refreshToken;
    private String tokenType;
}