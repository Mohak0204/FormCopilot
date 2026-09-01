package com.copilot.form_copilot.repositories;

import com.copilot.form_copilot.models.FormRequirement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface FormRequirementRepository extends JpaRepository<FormRequirement, UUID> {
    List<FormRequirement> findByFormId(UUID formId);
}
