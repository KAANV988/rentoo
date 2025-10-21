package com.rentoo.rentooapp.controller;

import com.rentoo.rentooapp.dto.ChangePasswordRequest;
import com.rentoo.rentooapp.dto.UpdateProfileRequest;
import com.rentoo.rentooapp.model.User;
import com.rentoo.rentooapp.service.AuthenticationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final AuthenticationService authService;

    public UserController(AuthenticationService authService) {
        this.authService = authService;
    }

    /**
     * Endpoint to get the profile of the currently logged-in user.
     */
    @GetMapping("/profile")
    public ResponseEntity<User> getMyProfile(Authentication authentication) {
        User loggedInUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(loggedInUser);
    }

    /**
     * Endpoint to update the profile of the currently logged-in user.
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateMyProfile(@RequestBody UpdateProfileRequest request, Authentication authentication) {
        User loggedInUser = (User) authentication.getPrincipal();
        try {
            User updatedUser = authService.updateProfile(loggedInUser.getId(), request);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Endpoint to change the password of the currently logged-in user.
     */
    @PutMapping("/profile/change-password")
    public ResponseEntity<?> changeMyPassword(@RequestBody ChangePasswordRequest request, Authentication authentication) {
        User loggedInUser = (User) authentication.getPrincipal();
        try {
            authService.changePassword(loggedInUser.getId(), request);
            return ResponseEntity.ok().body("Password changed successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
