package com.chm.utils;

import com.chm.config.JwtConfig;
import com.chm.models.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Component;

@Component
public class JwtUtils {

    private final JwtConfig jwtConfig;

    public JwtUtils(JwtConfig jwtConfig) {
        this.jwtConfig = jwtConfig;
    }

    public String generateAccessToken(User user) {
        return buildToken(user, jwtConfig.getExpirationMs(), "access");
    }

    public String generateRefreshToken(User user) {
        return buildToken(user, jwtConfig.getRefreshExpirationMs(), "refresh");
    }

    public String getUsernameFromToken(String token) {
        return parseClaims(token).getSubject();
    }

    public String getTokenType(String token) {
        return parseClaims(token).get("type", String.class);
    }

    public boolean isValidToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception exception) {
            return false;
        }
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    private String buildToken(User user, long expiration, String tokenType) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expiration);
        List<String> roles = user.getRoles().stream().map(role -> role.getName().name()).toList();

        return Jwts.builder()
            .subject(user.getUsername())
            .claim("userId", user.getId())
            .claim("roles", roles)
            .claim("type", tokenType)
            .issuedAt(now)
            .expiration(expiry)
            .signWith(getSigningKey())
            .compact();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtConfig.getSecret().getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            keyBytes = Decoders.BASE64.decode("Y2htLXNlY3JldC0yNTYtYml0LWtleS1mb3Itand0LXNpZ25pbmc=");
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }
}