package com.chm.services;

import com.chm.dto.JwtResponse;
import com.chm.dto.LoginRequest;
import com.chm.dto.SignupRequest;
import com.chm.enums.ERole;
import com.chm.exceptions.ResourceNotFoundException;
import com.chm.models.Role;
import com.chm.models.User;
import com.chm.repositories.RoleRepository;
import com.chm.repositories.UserRepository;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(
        UserRepository userRepository,
        RoleRepository roleRepository,
        PasswordEncoder passwordEncoder,
        AuthenticationManager authenticationManager,
        JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public JwtResponse register(SignupRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }

        Role userRole = roleRepository.findByName(ERole.ROLE_USER)
            .orElseThrow(() -> new ResourceNotFoundException("Default role not found"));

        User user = User.builder()
            .username(request.getUsername())
            .password(passwordEncoder.encode(request.getPassword()))
            .active(true)
            .roles(Set.of(userRole))
            .build();

        return jwtService.buildAuthResponse(userRepository.save(user));
    }

    public JwtResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
        } catch (AuthenticationException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }

        User user = userRepository.findByUsername(request.getUsername())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return jwtService.buildAuthResponse(user);
    }

    public JwtResponse refresh(Map<String, String> payload) {
        String refreshToken = payload.get("refreshToken");
        if (refreshToken == null || !jwtService.isRefreshToken(refreshToken)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }
        User user = userRepository.findByUsername(jwtService.extractUsername(refreshToken))
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return jwtService.buildAuthResponse(user);
    }
}