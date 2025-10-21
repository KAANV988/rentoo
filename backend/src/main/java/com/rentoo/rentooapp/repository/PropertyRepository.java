package com.rentoo.rentooapp.repository;

import com.rentoo.rentooapp.model.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor; // Import this
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Long>, JpaSpecificationExecutor<Property> { // Extend this

    List<Property> findByOwnerId(Long ownerId);

    // This method is kept for simple keyword searches
    @Query("SELECT p FROM Property p WHERE lower(p.address) LIKE lower(concat('%', :searchTerm, '%')) OR lower(p.city) LIKE lower(concat('%', :searchTerm, '%')) OR lower(p.state) LIKE lower(concat('%', :searchTerm, '%'))")
    List<Property> searchProperties(@Param("searchTerm") String searchTerm);
}

