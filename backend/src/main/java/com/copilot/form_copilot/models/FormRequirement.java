package com.copilot.form_copilot.models;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import java.util.UUID;

@Entity
public class FormRequirement {
    @Id
    private UUID requirementId;
    private UUID formId;
    private String description;
    private String documentTypeNeeded;
    private Boolean isMandatory;
    private String eligibilityCondition; // JSON
    private String validityRequirement; // JSON
    private String formatRequirement;
    private String sourceClause;
    private String category;

    @PrePersist
    protected void onCreate() {
        if (requirementId == null) {
            requirementId = UUID.randomUUID();
        }
    }

    public UUID getRequirementId() {
        return requirementId;
    }

    public void setRequirementId(UUID requirementId) {
        this.requirementId = requirementId;
    }

    public UUID getFormId() {
        return formId;
    }

    public void setFormId(UUID formId) {
        this.formId = formId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDocumentTypeNeeded() {
        return documentTypeNeeded;
    }

    public void setDocumentTypeNeeded(String documentTypeNeeded) {
        this.documentTypeNeeded = documentTypeNeeded;
    }

    public Boolean getMandatory() {
        return isMandatory;
    }

    public void setMandatory(Boolean mandatory) {
        isMandatory = mandatory;
    }

    public String getEligibilityCondition() {
        return eligibilityCondition;
    }

    public void setEligibilityCondition(String eligibilityCondition) {
        this.eligibilityCondition = eligibilityCondition;
    }

    public String getValidityRequirement() {
        return validityRequirement;
    }

    public void setValidityRequirement(String validityRequirement) {
        this.validityRequirement = validityRequirement;
    }

    public String getFormatRequirement() {
        return formatRequirement;
    }

    public void setFormatRequirement(String formatRequirement) {
        this.formatRequirement = formatRequirement;
    }

    public String getSourceClause() {
        return sourceClause;
    }

    public void setSourceClause(String sourceClause) {
        this.sourceClause = sourceClause;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }
}
