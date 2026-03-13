package com.chm.services;

import com.chm.dto.JwtResponse;
import com.chm.models.User;
import com.chm.utils.JwtUtils;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final JwtUtils jwtUtils;

    public JwtService(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    public JwtResponse buildAuthResponse(User user) {
        return JwtResponse.builder()
            .id(user.getId())
            .username(user.getUsername())
            .roles(user.getRoles().stream().map(role -> role.getName().name()).toList())
            .token(jwtUtils.generateAccessToken(user))
            .refreshToken(jwtUtils.generateRefreshToken(user))
            .tokenType("Bearer")
            .build();
    }

    public String extractUsername(String token) {
        return jwtUtils.getUsernameFromToken(token);
    }

    public boolean isRefreshToken(String token) {
        return jwtUtils.isValidToken(token) && "refresh".equals(jwtUtils.getTokenType(token));
    }
}