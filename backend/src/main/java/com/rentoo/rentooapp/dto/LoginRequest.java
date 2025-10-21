package com.rentoo.rentooapp.dto;

// Manually created DTO without Lombok
public class LoginRequest {
    private String username; // Can be email or phone number
    private String password;

    // No-Argument Constructor
    public LoginRequest() {
    }

    // Getters and Setters
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}

