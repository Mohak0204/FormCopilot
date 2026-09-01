package com.copilot.form_copilot.repositories;

import com.copilot.form_copilot.models.Form;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface FormRepository extends JpaRepository<Form, UUID> {
}
