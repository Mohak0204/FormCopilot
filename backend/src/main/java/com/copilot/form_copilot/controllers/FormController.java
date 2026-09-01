package com.copilot.form_copilot.controllers;

import com.copilot.form_copilot.models.Form;
import com.copilot.form_copilot.models.FormRequirement;
import com.copilot.form_copilot.repositories.FormRepository;
import com.copilot.form_copilot.repositories.FormRequirementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

import java.io.File;
import java.io.IOException;
import java.util.UUID;
import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/v1/forms")
public class FormController {

    @Autowired
    private FormRepository formRepository;

    @Autowired
    private FormRequirementRepository formRequirementRepository;

    @PostMapping("/analyze")
    public ResponseEntity<Form> analyzeForm(@RequestParam("file") MultipartFile file) {
        try {
            File tempFile = File.createTempFile("form_", ".pdf");
            file.transferTo(tempFile);

            String rawText = "";
            int pageCount = 0;

            try (PDDocument document = org.apache.pdfbox.Loader.loadPDF(tempFile)) {
                pageCount = document.getNumberOfPages();
                PDFTextStripper stripper = new PDFTextStripper();
                rawText = stripper.getText(document);
            } catch (Exception e) {
                rawText = "Failed to parse PDF text.";
            } finally {
                tempFile.delete();
            }

            Form form = new Form();
            form.setFormId(UUID.randomUUID());
            form.setTitle(file.getOriginalFilename());
            form.setSourceFileName(file.getOriginalFilename());
            form.setPageCount(pageCount);
            form.setRawText(rawText);
            form.setStatus("ready");
            formRepository.save(form);

            // Mock rule extraction for MVP based on common Indian forms
            extractDummyRequirementsForMvp(form.getFormId(), rawText);

            return ResponseEntity.ok(form);
        } catch (IOException e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping
    public ResponseEntity<List<Form>> getForms() {
        return ResponseEntity.ok(formRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Form> getForm(@PathVariable UUID id) {
        return formRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteForm(@PathVariable UUID id) {
        if (!formRepository.existsById(id))
            return ResponseEntity.notFound().build();
        // Also delete requirements explicitly (or rely on Cascade, but let's be
        // explicit)
        List<FormRequirement> reqs = formRequirementRepository.findByFormId(id);
        formRequirementRepository.deleteAll(reqs);
        formRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/requirements")
    public ResponseEntity<List<FormRequirement>> getFormRequirements(@PathVariable UUID id) {
        return ResponseEntity.ok(formRequirementRepository.findByFormId(id));
    }

    private void extractDummyRequirementsForMvp(UUID formId, String rawText) {
        List<FormRequirement> basicReqs = new ArrayList<>();
        String lowerText = rawText.toLowerCase();

        boolean isPassport = lowerText.contains("passport") || lowerText.contains("visa");
        boolean isBank = lowerText.contains("bank") || lowerText.contains("account");
        boolean isEducation = lowerText.contains("university") || lowerText.contains("admission")
                || lowerText.contains("college");

        // Primary Identity (Always required)
        basicReqs.add(createReq(formId, "Aadhaar", "Primary Identity Proof (Aadhaar Card)", true, "Identity",
                "Required by Govt mandate for identity verification."));

        if (isPassport) {
            basicReqs.add(createReq(formId, "Birth Certificate", "Proof of Date of Birth for Passport Issuance", true,
                    "Identity", "Section 2.1: DOB proof must match exactly."));
            basicReqs.add(createReq(formId, "Address Proof", "Present Residential Address Proof", true, "Address",
                    "Must cover at least 1 year of continuous residence."));
            basicReqs.add(createReq(formId, "10th Marksheet", "ECNR Proof (Non-ECR Category)", false, "Education",
                    "Required if applying for ECNR status."));
        } else if (isBank) {
            basicReqs.add(createReq(formId, "PAN Card", "Permanent Account Number Card", true, "Financial",
                    "Mandatory for accounts per RBI KYC guidelines."));
            basicReqs.add(createReq(formId, "Address Proof", "Utility Bill or Passport for Address", true, "Address",
                    "RBI KYC: Local address verification."));
            basicReqs.add(createReq(formId, "Income Certificate", "Proof of Income", false, "Financial",
                    "Only if applying for credit card/loan facilities."));
        } else if (isEducation) {
            basicReqs.add(createReq(formId, "10th Marksheet", "Secondary School Certificate", true, "Education",
                    "Matriculation proof required for DOB."));
            basicReqs.add(createReq(formId, "12th Marksheet", "Higher Secondary Certificate", true, "Education",
                    "Required for undergraduate admissions."));
            basicReqs.add(createReq(formId, "Caste Certificate", "Category Reservation Certificate", false, "Identity",
                    "Required only if claiming SC/ST/OBC reservation quotas."));
            basicReqs.add(createReq(formId, "Domicile Certificate", "State Residence Proof", false, "Address",
                    "Required for state quota admissions."));
        } else {
            // Generic Fallback
            basicReqs.add(createReq(formId, "Address Proof", "General Address Verification", true, "Address",
                    "General requirement for matching correspondence address."));
            basicReqs.add(createReq(formId, "PAN Card", "Financial ID", false, "Financial",
                    "Required if specific financial transactions are involved."));
        }

        formRequirementRepository.saveAll(basicReqs);
    }

    private FormRequirement createReq(UUID formId, String docType, String desc, boolean mandatory, String category,
            String sourceClause) {
        FormRequirement req = new FormRequirement();
        req.setFormId(formId);
        req.setDocumentTypeNeeded(docType);
        req.setDescription(desc);
        req.setMandatory(mandatory);
        req.setCategory(category);
        req.setSourceClause(sourceClause);
        return req;
    }
}
