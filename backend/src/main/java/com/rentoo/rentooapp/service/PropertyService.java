package com.rentoo.rentooapp.service;

import com.rentoo.rentooapp.model.Property;
import com.rentoo.rentooapp.model.PropertyImage;
import com.rentoo.rentooapp.model.User;
import com.rentoo.rentooapp.repository.PropertyImageRepository;
import com.rentoo.rentooapp.repository.PropertyRepository;
import com.rentoo.rentooapp.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;

@Service
public class PropertyService {

    private static final Logger logger = LoggerFactory.getLogger(PropertyService.class);

    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final PropertyImageRepository propertyImageRepository;

    public PropertyService(PropertyRepository propertyRepository, UserRepository userRepository, FileStorageService fileStorageService, PropertyImageRepository propertyImageRepository) {
        this.propertyRepository = propertyRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
        this.propertyImageRepository = propertyImageRepository;
    }

    @Transactional
    public Property createProperty(Property property, Long ownerId, List<MultipartFile> files) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new NoSuchElementException("Owner not found with ID: " + ownerId));
        property.setOwner(owner);

        Property savedProperty = propertyRepository.save(property);

        if (files != null && !files.isEmpty()) {
            Set<PropertyImage> images = new HashSet<>();
            for (MultipartFile file : files) {
                if(!file.isEmpty()){
                    String fileName = fileStorageService.storeFile(file);
                    String fileDownloadUri = "/uploads/" + fileName;
                    images.add(new PropertyImage(fileDownloadUri, savedProperty));
                }
            }
            savedProperty.setImages(images);
            return propertyRepository.save(savedProperty);
        }

        return savedProperty;
    }
    
    @Transactional
    public Property updateProperty(Long propertyId, Property propertyDetails, Long ownerId) {
        Property existingProperty = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new NoSuchElementException("Property not found with ID: " + propertyId));

        if (!existingProperty.getOwner().getId().equals(ownerId)) {
            throw new SecurityException("User is not authorized to update this property.");
        }

        existingProperty.setAddress(propertyDetails.getAddress());
        existingProperty.setCity(propertyDetails.getCity());
        existingProperty.setState(propertyDetails.getState());
        existingProperty.setZipCode(propertyDetails.getZipCode());
        existingProperty.setRentPrice(propertyDetails.getRentPrice());
        existingProperty.setBedrooms(propertyDetails.getBedrooms());
        existingProperty.setBathrooms(propertyDetails.getBathrooms());
        existingProperty.setDescription(propertyDetails.getDescription());
        existingProperty.setVideoUrl(propertyDetails.getVideoUrl());

        return propertyRepository.save(existingProperty);
    }

    @Transactional
    public void deleteProperty(Long propertyId, Long ownerId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new NoSuchElementException("Property not found with ID: " + propertyId));

        if (!property.getOwner().getId().equals(ownerId)) {
            throw new SecurityException("User is not authorized to delete this property.");
        }
        
        propertyRepository.delete(property);
    }


    public List<Property> findAllProperties() {
        return propertyRepository.findAll();
    }

    public Property findPropertyById(Long id) {
        return propertyRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Property not found with ID: " + id));
    }

    public List<Property> findAllByOwnerId(Long ownerId) {
        return propertyRepository.findByOwnerId(ownerId);
    }

    @Transactional
    public void deletePropertyImage(Long imageId, Long ownerId) {
        PropertyImage image = propertyImageRepository.findById(imageId)
                .orElseThrow(() -> new NoSuchElementException("Image not found with ID: " + imageId));

        if (!image.getProperty().getOwner().getId().equals(ownerId)) {
            throw new SecurityException("User is not authorized to delete this image.");
        }

        String fileName = StringUtils.getFilename(image.getImageUrl());
        if (fileName != null) {
            fileStorageService.deleteFile(fileName);
        }

        propertyImageRepository.delete(image);
    }

    /**
     * UPDATED METHOD: Now handles advanced search with multiple filters.
     */
    public List<Property> searchProperties(String searchTerm, BigDecimal minPrice, BigDecimal maxPrice, Integer minBeds, Integer minBaths) {
        logger.info("Performing advanced search with criteria: searchTerm={}, minPrice={}, maxPrice={}, minBeds={}, minBaths={}", 
            searchTerm, minPrice, maxPrice, minBeds, minBaths);

        // Build a dynamic query using Specifications
        Specification<Property> spec = Specification.where(null);

        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            String lowerCaseSearchTerm = "%" + searchTerm.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> 
                cb.or(
                    cb.like(cb.lower(root.get("address")), lowerCaseSearchTerm),
                    cb.like(cb.lower(root.get("city")), lowerCaseSearchTerm),
                    cb.like(cb.lower(root.get("state")), lowerCaseSearchTerm)
                )
            );
        }

        if (minPrice != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("rentPrice"), minPrice));
        }
        if (maxPrice != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("rentPrice"), maxPrice));
        }
        if (minBeds != null && minBeds > 0) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("bedrooms"), minBeds));
        }
        if (minBaths != null && minBaths > 0) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("bathrooms"), minBaths));
        }

        return propertyRepository.findAll(spec);
    }
}

