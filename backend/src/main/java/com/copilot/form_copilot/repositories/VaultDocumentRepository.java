package com.copilot.form_copilot.repositories;

import com.copilot.form_copilot.models.VaultDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface VaultDocumentRepository extends JpaRepository<VaultDocument, UUID> {
}
