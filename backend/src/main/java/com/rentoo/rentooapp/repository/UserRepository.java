package com.rentoo.rentooapp.repository;

import com.rentoo.rentooapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

/**
 * Repository interface for User entity.
 * This interface provides CRUD (Create, Read, Update, Delete) operations for Users.
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Finds a user by their email address.
     * Spring Data JPA automatically implements this method based on its name.
     *
     * @param email The email to search for.
     * @return An Optional containing the User if found, otherwise an empty Optional.
     */
    Optional<User> findByEmail(String email);
}

