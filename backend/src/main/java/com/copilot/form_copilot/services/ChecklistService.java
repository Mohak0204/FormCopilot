package com.copilot.form_copilot.services;

import com.copilot.form_copilot.models.AuditLog;
import com.copilot.form_copilot.models.ChecklistItem;
import com.copilot.form_copilot.models.FormRequirement;
import com.copilot.form_copilot.models.VaultDocument;
import com.copilot.form_copilot.repositories.AuditLogRepository;
import com.copilot.form_copilot.repositories.ChecklistItemRepository;
import com.copilot.form_copilot.repositories.FormRequirementRepository;
import com.copilot.form_copilot.repositories.VaultDocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class ChecklistService {

    @Autowired
    private ChecklistItemRepository checklistRepository;

    @Autowired
    private FormRequirementRepository formReqRepository;

    @Autowired
    private VaultDocumentRepository vaultRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private SemanticMatcherService semanticMatcher;

    public void generateChecklist(UUID formId) {
        List<FormRequirement> reqs = formReqRepository.findByFormId(formId);
        List<VaultDocument> vault = vaultRepository.findAll();

        // Clear existing checklist items for this form
        List<ChecklistItem> existing = checklistRepository.findByFormId(formId);
        checklistRepository.deleteAll(existing);

        for (FormRequirement req : reqs) {
            ChecklistItem item = new ChecklistItem();
            item.setFormId(formId);
            item.setRequirementId(req.getRequirementId());
            item.setMatchConfidence(0.0);
            item.setStatus("missing");

            // Semantic matching using synonym dictionary
            VaultDocument matched = null;
            double bestConfidence = 0.0;

            for (VaultDocument doc : vault) {
                double confidence = semanticMatcher.match(req.getDocumentTypeNeeded(), doc.getDocumentType());
                if (confidence > bestConfidence && confidence >= 0.80) {
                    bestConfidence = confidence;
                    matched = doc;
                }
            }

            item.setMatchConfidence(bestConfidence);

            if (matched != null) {
                item.setMatchedDocumentId(matched.getDocumentId());

                // Business Rule BR-1: Aadhaar cards do not expire
                boolean isNonExpiring = "Aadhaar".equalsIgnoreCase(matched.getDocumentType());

                // Deterministic Rule Engine checks
                if (isNonExpiring || matched.getExpiryDate() == null) {
                    item.setStatus("available");
                    item.setRuleApplied("{\"rule\":\"ExpiryCheck\", \"result\":\"Passed - " +
                            (isNonExpiring ? "Document type never expires (BR-1)." : "No expiry date - assumed valid.")
                            +
                            "\"}");
                    logAudit(item, "ExpiryCheck", matched, "PASSED - Valid");
                } else if (matched.getExpiryDate().isBefore(LocalDate.now())) {
                    item.setStatus("expired");
                    item.setRuleApplied("{\"rule\":\"ExpiryCheck\", \"result\":\"Failed - Document expired on "
                            + matched.getExpiryDate() + "\"}");
                    logAudit(item, "ExpiryCheck", matched, "FAILED - Expired on " + matched.getExpiryDate());
                } else if (matched.getExpiryDate().isBefore(LocalDate.now().plusDays(90))) {
                    // F6.4: Flag documents expiring within 30/60/90 days
                    long daysUntilExpiry = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(),
                            matched.getExpiryDate());
                    item.setStatus("expiring_soon");
                    item.setRuleApplied("{\"rule\":\"ExpiryCheck\", \"result\":\"Warning - Document expires in "
                            + daysUntilExpiry + " days on " + matched.getExpiryDate() + "\"}");
                    logAudit(item, "ExpiryCheck", matched, "WARNING - Expires in " + daysUntilExpiry + " days");
                } else {
                    item.setStatus("available");
                    item.setRuleApplied("{\"rule\":\"ExpiryCheck\", \"result\":\"Passed - Document valid until "
                            + matched.getExpiryDate() + "\"}");
                    logAudit(item, "ExpiryCheck", matched, "PASSED - Valid until " + matched.getExpiryDate());
                }
            } else {
                if (Boolean.TRUE.equals(req.getMandatory())) {
                    item.setStatus("missing");
                } else {
                    item.setStatus("needs_review");
                }
                item.setRuleApplied("{\"rule\":\"MatchCheck\", \"result\":\"No matching document found in vault." +
                        " Accepted types: "
                        + String.join(", ", semanticMatcher.findMatchingTypes(req.getDocumentTypeNeeded())) + "\"}");
                logAudit(item, "MatchCheck", null, "No match found for: " + req.getDocumentTypeNeeded());
            }

            // Generate next steps based on status
            item.setNextSteps(generateNextSteps(item.getStatus(), req.getDocumentTypeNeeded()));

            // Set source clause from the requirement
            item.setExplanation(req.getSourceClause() != null ? req.getSourceClause()
                    : "Requirement: " + req.getDescription());

            checklistRepository.save(item);
        }
    }

    private String generateNextSteps(String status, String docType) {
        return switch (status) {
            case "missing" -> "Upload a " + docType + " to your Document Vault. " +
                    "You can obtain this from the relevant issuing authority.";
            case "expired" -> "Your " + docType + " has expired. Apply for renewal at the issuing authority " +
                    "and upload the renewed document.";
            case "expiring_soon" -> "Your " + docType + " is expiring soon. Consider renewing it before submission " +
                    "to avoid delays. Some forms require documents valid for 6+ months.";
            case "available" -> "This document is ready for submission. No action needed.";
            case "needs_review" -> "This is an optional requirement. Check if it applies to your specific situation " +
                    "(e.g., category, domicile state, income level).";
            default -> "Review this requirement carefully.";
        };
    }

    private void logAudit(ChecklistItem item, String ruleId, VaultDocument doc, String result) {
        AuditLog log = new AuditLog();
        log.setItemId(item.getItemId() != null ? item.getItemId() : UUID.randomUUID());
        log.setRuleId(ruleId);
        log.setResult(result);
        String inputData = "{\"requirementId\":\"" + item.getRequirementId() + "\"";
        if (doc != null) {
            inputData += ",\"matchedDocType\":\"" + doc.getDocumentType() + "\"";
            inputData += ",\"expiryDate\":\"" + (doc.getExpiryDate() != null ? doc.getExpiryDate() : "null") + "\"";
        }
        inputData += "}";
        log.setInputData(inputData);
        auditLogRepository.save(log);
    }

    public List<ChecklistItem> getChecklist(UUID formId) {
        return checklistRepository.findByFormId(formId);
    }
}
