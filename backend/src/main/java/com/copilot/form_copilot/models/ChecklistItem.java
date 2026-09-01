package com.copilot.form_copilot.models;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
public class ChecklistItem {
    @Id
    private UUID itemId;
    private UUID formId;
    private UUID requirementId;
    private UUID matchedDocumentId; // Nullable

    // available, missing, expired, expiring_soon, needs_review
    private String status;
    private Double matchConfidence;

    private String ruleApplied; // JSON string
    private String explanation; // LLM output
    private String nextSteps;

    private LocalDateTime generatedAt;

    @PrePersist
    protected void onCreate() {
        if (itemId == null) {
            itemId = UUID.randomUUID();
        }
        generatedAt = LocalDateTime.now();
    }

    public UUID getItemId() {
        return itemId;
    }

    public void setItemId(UUID itemId) {
        this.itemId = itemId;
    }

    public UUID getFormId() {
        return formId;
    }

    public void setFormId(UUID formId) {
        this.formId = formId;
    }

    public UUID getRequirementId() {
        return requirementId;
    }

    public void setRequirementId(UUID requirementId) {
        this.requirementId = requirementId;
    }

    public UUID getMatchedDocumentId() {
        return matchedDocumentId;
    }

    public void setMatchedDocumentId(UUID matchedDocumentId) {
        this.matchedDocumentId = matchedDocumentId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Double getMatchConfidence() {
        return matchConfidence;
    }

    public void setMatchConfidence(Double matchConfidence) {
        this.matchConfidence = matchConfidence;
    }

    public String getRuleApplied() {
        return ruleApplied;
    }

    public void setRuleApplied(String ruleApplied) {
        this.ruleApplied = ruleApplied;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public String getNextSteps() {
        return nextSteps;
    }

    public void setNextSteps(String nextSteps) {
        this.nextSteps = nextSteps;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }
}
