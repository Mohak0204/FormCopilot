package com.copilot.form_copilot.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Disable CSRF for local MVP
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/health", "/", "/index.html", "/assets/**", "/vite.svg").permitAll()
                        .anyRequest().permitAll() // Temporarily permit all for Phase 1
                )
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable());

        return http.build();
    }
}
