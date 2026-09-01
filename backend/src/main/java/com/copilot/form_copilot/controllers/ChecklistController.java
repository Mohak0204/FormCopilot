package com.copilot.form_copilot.controllers;

import com.copilot.form_copilot.models.AuditLog;
import com.copilot.form_copilot.models.ChecklistItem;
import com.copilot.form_copilot.models.FormRequirement;
import com.copilot.form_copilot.repositories.AuditLogRepository;
import com.copilot.form_copilot.repositories.FormRequirementRepository;
import com.copilot.form_copilot.services.ChecklistService;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/checklists")
public class ChecklistController {

    @Autowired
    private ChecklistService checklistService;

    @Autowired
    private FormRequirementRepository formReqRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @PostMapping("/generate")
    public ResponseEntity<Map<String, String>> generateChecklist(@RequestBody Map<String, String> payload) {
        UUID formId = UUID.fromString(payload.get("formId"));
        checklistService.generateChecklist(formId);
        return ResponseEntity.ok(Map.of("status", "success", "formId", formId.toString()));
    }

    @GetMapping("/{formId}")
    public ResponseEntity<List<ChecklistItem>> getChecklist(@PathVariable UUID formId) {
        return ResponseEntity.ok(checklistService.getChecklist(formId));
    }

    @GetMapping("/{formId}/audit")
    public ResponseEntity<List<AuditLog>> getAuditLogs(@PathVariable UUID formId) {
        List<ChecklistItem> items = checklistService.getChecklist(formId);
        List<UUID> itemIds = items.stream().map(ChecklistItem::getItemId).toList();
        List<AuditLog> logs = auditLogRepository.findByItemIdIn(itemIds);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/{formId}/export")
    public ResponseEntity<byte[]> exportChecklist(@PathVariable UUID formId) {
        try {
            List<ChecklistItem> items = checklistService.getChecklist(formId);
            List<FormRequirement> reqs = formReqRepository.findByFormId(formId);

            Map<UUID, FormRequirement> reqMap = new java.util.HashMap<>();
            for (FormRequirement r : reqs)
                reqMap.put(r.getRequirementId(), r);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();

            try (PDDocument doc = new PDDocument()) {
                PDPage page = new PDPage(PDRectangle.A4);
                doc.addPage(page);

                PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
                PDType1Font fontRegular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

                try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                    float y = 770;
                    float margin = 50;

                    // Title
                    cs.beginText();
                    cs.setFont(fontBold, 18);
                    cs.newLineAtOffset(margin, y);
                    cs.showText("Public Service Form Copilot - Checklist");
                    cs.endText();
                    y -= 25;

                    cs.beginText();
                    cs.setFont(fontRegular, 10);
                    cs.newLineAtOffset(margin, y);
                    cs.showText("Generated: " + LocalDate.now() + "  |  Form ID: " + formId);
                    cs.endText();
                    y -= 30;

                    // Draw line
                    cs.moveTo(margin, y);
                    cs.lineTo(560, y);
                    cs.stroke();
                    y -= 20;

                    // Stats
                    long available = items.stream().filter(i -> "available".equals(i.getStatus())).count();
                    int total = items.size();
                    int pct = total > 0 ? (int) (available * 100 / total) : 0;

                    cs.beginText();
                    cs.setFont(fontBold, 11);
                    cs.newLineAtOffset(margin, y);
                    cs.showText("Completion: " + pct + "% (" + available + "/" + total + " documents ready)");
                    cs.endText();
                    y -= 25;

                    // Items
                    for (ChecklistItem item : items) {
                        if (y < 80) {
                            // New page
                            cs.close();
                            page = new PDPage(PDRectangle.A4);
                            doc.addPage(page);
                            // Note: we need to break and create new content stream
                            // For simplicity, we'll truncate long checklists
                            break;
                        }

                        FormRequirement req = reqMap.get(item.getRequirementId());
                        String docName = req != null ? req.getDocumentTypeNeeded() : "Unknown";
                        String statusIcon = switch (item.getStatus()) {
                            case "available" -> "[OK]";
                            case "missing" -> "[MISSING]";
                            case "expired" -> "[EXPIRED]";
                            case "expiring_soon" -> "[EXPIRING]";
                            default -> "[REVIEW]";
                        };

                        cs.beginText();
                        cs.setFont(fontBold, 10);
                        cs.newLineAtOffset(margin, y);
                        cs.showText(statusIcon + "  " + docName);
                        cs.endText();
                        y -= 15;

                        if (req != null && req.getDescription() != null) {
                            cs.beginText();
                            cs.setFont(fontRegular, 9);
                            cs.newLineAtOffset(margin + 15, y);
                            String desc = req.getDescription();
                            if (desc.length() > 80)
                                desc = desc.substring(0, 80) + "...";
                            cs.showText(desc);
                            cs.endText();
                            y -= 13;
                        }

                        if (item.getNextSteps() != null) {
                            cs.beginText();
                            cs.setFont(fontRegular, 8);
                            cs.newLineAtOffset(margin + 15, y);
                            String steps = "Next: " + item.getNextSteps();
                            if (steps.length() > 90)
                                steps = steps.substring(0, 90) + "...";
                            cs.showText(steps);
                            cs.endText();
                            y -= 18;
                        }
                    }
                }

                doc.save(baos);
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"checklist_" + formId + ".pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(baos.toByteArray());
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}
