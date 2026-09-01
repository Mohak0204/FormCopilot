package com.copilot.form_copilot.repositories;

import com.copilot.form_copilot.models.ChecklistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ChecklistItemRepository extends JpaRepository<ChecklistItem, UUID> {
    List<ChecklistItem> findByFormId(UUID formId);
}
