
package com.rentoo.rentooapp.dto;

// Using a record for a concise, immutable DTO
public record PropertyDto(
    String address,
    String city,
    String state,
    String zipCode,
    double rentPrice,
    int bedrooms,
    int bathrooms,
    String description,
    String videoUrl
) {}
