package com.rentoo.rentooapp.dto;

import com.rentoo.rentooapp.model.User;

// Manually created DTO without Lombok to ensure IDE compatibility
public class LoginResponse {

    private String token;
    private User user;

    // No-Argument Constructor
    public LoginResponse() {
    }

    // All-Argument Constructor (This is the one AuthenticationService needs)
    public LoginResponse(String token, User user) {
        this.token = token;
        this.user = user;
    }

    // Getters and Setters
    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}

