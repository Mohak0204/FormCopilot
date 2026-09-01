package com.copilot.form_copilot.repositories;

import com.copilot.form_copilot.models.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findByItemId(UUID itemId);

    List<AuditLog> findByItemIdIn(List<UUID> itemIds);
}
