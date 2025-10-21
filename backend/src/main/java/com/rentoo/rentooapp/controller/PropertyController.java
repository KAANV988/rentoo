package com.rentoo.rentooapp.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rentoo.rentooapp.model.Property;
import com.rentoo.rentooapp.model.User;
import com.rentoo.rentooapp.service.PropertyService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/properties")
public class PropertyController {

    private static final Logger logger = LoggerFactory.getLogger(PropertyController.class);

    private final PropertyService propertyService;
    private final ObjectMapper objectMapper;

    public PropertyController(PropertyService propertyService, ObjectMapper objectMapper) {
        this.propertyService = propertyService;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public ResponseEntity<List<Property>> getAllProperties() {
        return new ResponseEntity<>(propertyService.findAllProperties(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Property> getPropertyById(@PathVariable Long id) {
        try {
            return new ResponseEntity<>(propertyService.findPropertyById(id), HttpStatus.OK);
        } catch (NoSuchElementException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/my-listings")
    public ResponseEntity<List<Property>> getMyListings(Authentication authentication) {
        if (authentication == null) { return new ResponseEntity<>(HttpStatus.UNAUTHORIZED); }
        User loggedInUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(propertyService.findAllByOwnerId(loggedInUser.getId()));
    }

    @PostMapping(consumes = { "multipart/form-data" })
    public ResponseEntity<?> createProperty(
            @RequestPart("property") String propertyJson,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            Authentication authentication) {
        
        logger.info("Received request to create property.");
        if (authentication == null) { return new ResponseEntity<>("User must be logged in.", HttpStatus.UNAUTHORIZED); }
        User loggedInUser = (User) authentication.getPrincipal();
        if (loggedInUser.getRole() != com.rentoo.rentooapp.model.Role.OWNER) {
             return new ResponseEntity<>("Only owners can create properties.", HttpStatus.FORBIDDEN);
        }
        try {
            Property property = objectMapper.readValue(propertyJson, Property.class);
            Property newProperty = propertyService.createProperty(property, loggedInUser.getId(), files);
            return new ResponseEntity<>(newProperty, HttpStatus.CREATED);
        } catch (Exception e) {
            logger.error("Error creating property", e);
            return new ResponseEntity<>("Error creating property.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<?> deletePropertyImage(@PathVariable Long imageId, Authentication authentication) {
        if (authentication == null) { return new ResponseEntity<>("User must be logged in.", HttpStatus.UNAUTHORIZED); }
        User loggedInUser = (User) authentication.getPrincipal();
        try {
            propertyService.deletePropertyImage(imageId, loggedInUser.getId());
            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.FORBIDDEN);
        } catch (NoSuchElementException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{propertyId}")
    public ResponseEntity<?> updateProperty(@PathVariable Long propertyId, @RequestBody Property propertyDetails, Authentication authentication) {
        if (authentication == null) {
            return new ResponseEntity<>("User must be logged in.", HttpStatus.UNAUTHORIZED);
        }
        User loggedInUser = (User) authentication.getPrincipal();

        try {
            Property updatedProperty = propertyService.updateProperty(propertyId, propertyDetails, loggedInUser.getId());
            return ResponseEntity.ok(updatedProperty);
        } catch (SecurityException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.FORBIDDEN);
        } catch (NoSuchElementException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{propertyId}")
    public ResponseEntity<?> deleteProperty(@PathVariable Long propertyId, Authentication authentication) {
        if (authentication == null) {
            return new ResponseEntity<>("User must be logged in.", HttpStatus.UNAUTHORIZED);
        }
        User loggedInUser = (User) authentication.getPrincipal();

        try {
            propertyService.deleteProperty(propertyId, loggedInUser.getId());
            return ResponseEntity.noContent().build(); // 204 No Content
        } catch (SecurityException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.FORBIDDEN);
        } catch (NoSuchElementException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }

    /**
     * UPDATED ENDPOINT: Now handles advanced search with multiple optional filters.
     */
    @GetMapping("/search")
    public ResponseEntity<List<Property>> searchProperties(
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "minPrice", required = false) BigDecimal minPrice,
            @RequestParam(value = "maxPrice", required = false) BigDecimal maxPrice,
            @RequestParam(value = "minBeds", required = false) Integer minBeds,
            @RequestParam(value = "minBaths", required = false) Integer minBaths
    ) {
        List<Property> properties = propertyService.searchProperties(query, minPrice, maxPrice, minBeds, minBaths);
        return ResponseEntity.ok(properties);
    }
}