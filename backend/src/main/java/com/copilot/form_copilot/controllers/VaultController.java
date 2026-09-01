package com.copilot.form_copilot.controllers;

import com.copilot.form_copilot.models.VaultDocument;
import com.copilot.form_copilot.repositories.VaultDocumentRepository;
import com.copilot.form_copilot.services.CryptoService;
import com.copilot.form_copilot.services.OcrService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.file.Files;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/vault")
public class VaultController {

    @Autowired
    private VaultDocumentRepository vaultRepository;

    @Autowired
    private CryptoService cryptoService;

    @Autowired
    private OcrService ocrService; // Added this bean!

    private static final String STORAGE_DIR = "vault_storage/";

    // Using a static dev key for MVP
    private final byte[] staticDevKey = new byte[32];

    public VaultController() {
        File dir = new File(STORAGE_DIR);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<VaultDocument> uploadDocument(@RequestParam("file") MultipartFile file) {
        try {
            byte[] fileBytes = file.getBytes();
            byte[] encryptedData = cryptoService.encrypt(fileBytes, staticDevKey);

            String fileName = UUID.randomUUID().toString() + ".enc";
            File dest = new File(STORAGE_DIR + fileName);
            try (FileOutputStream fos = new FileOutputStream(dest)) {
                fos.write(encryptedData);
            }

            VaultDocument doc = new VaultDocument();
            doc.setDocumentId(UUID.randomUUID());
            doc.setFilePath(dest.getAbsolutePath());

            // Temporarily set pending extraction
            doc.setDocumentType("Analyzing...");
            doc.setExtractedFields("");
            doc.setOcrConfidence(0.0);

            vaultRepository.save(doc);

            // Kick off OCR in the background (mock text for MVP)
            ocrService.extractTextAsync(doc, fileBytes);

            return ResponseEntity.ok(doc);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping
    public ResponseEntity<List<VaultDocument>> getDocuments(@RequestParam(required = false) String search) {
        List<VaultDocument> docs = vaultRepository.findAll();
        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase();
            docs = docs.stream()
                    .filter(d -> (d.getDocumentType() != null && d.getDocumentType().toLowerCase().contains(q)) ||
                            (d.getExtractedFields() != null && d.getExtractedFields().toLowerCase().contains(q)))
                    .collect(Collectors.toList());
        }
        return ResponseEntity.ok(docs);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable UUID id) {
        return vaultRepository.findById(id).map(doc -> {
            File f = new File(doc.getFilePath());
            if (f.exists()) {
                f.delete();
            }
            vaultRepository.delete(doc);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/metadata")
    public ResponseEntity<VaultDocument> updateMetadata(@PathVariable UUID id, @RequestBody VaultDocument updates) {
        return vaultRepository.findById(id).map(doc -> {
            if (updates.getDocumentType() != null)
                doc.setDocumentType(updates.getDocumentType());
            if (updates.getHolderName() != null)
                doc.setHolderName(updates.getHolderName());
            if (updates.getExpiryDate() != null)
                doc.setExpiryDate(updates.getExpiryDate());
            if (updates.getIssuingAuthority() != null)
                doc.setIssuingAuthority(updates.getIssuingAuthority());
            vaultRepository.save(doc);
            return ResponseEntity.ok(doc);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VaultDocument> getDocument(@PathVariable UUID id) {
        return vaultRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/preview")
    public ResponseEntity<byte[]> previewDocument(@PathVariable UUID id) {
        try {
            VaultDocument doc = vaultRepository.findById(id).orElse(null);
            if (doc == null) {
                return ResponseEntity.notFound().build();
            }

            File file = new File(doc.getFilePath());
            byte[] encryptedData = Files.readAllBytes(file.toPath());
            byte[] decryptedData = cryptoService.decrypt(encryptedData, staticDevKey);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF); // Simplified for MVP (assumes PDF)
            headers.setContentDispositionFormData("inline", doc.getDocumentId().toString() + ".pdf");
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

            return new ResponseEntity<>(decryptedData, headers, HttpStatus.OK);

        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}
