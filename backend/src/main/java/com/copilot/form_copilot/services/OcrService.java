package com.copilot.form_copilot.services;

import com.copilot.form_copilot.models.VaultDocument;
import com.copilot.form_copilot.repositories.VaultDocumentRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Files;

@Service
public class OcrService {

    @Autowired
    private VaultDocumentRepository vaultRepository;

    @Async
    public void extractTextAsync(VaultDocument document, byte[] decryptedData) {
        try {
            File tempImage = File.createTempFile("ocr_", ".tmp");
            Files.write(tempImage.toPath(), decryptedData);

            String extractedText = "";

            try {
                // Try PDF extraction
                try (PDDocument doc = org.apache.pdfbox.Loader.loadPDF(tempImage)) {
                    PDFTextStripper stripper = new PDFTextStripper();
                    extractedText = stripper.getText(doc);
                } catch (Exception notPdf) {
                    // Fallback simulated OCR for images
                    extractedText = "Simulated Identity Information. \nName: John Doe\nDOB: 15/08/1990\nID: XX123456";
                }
            } finally {
                tempImage.delete();
            }

            final String finalText = extractedText;
            vaultRepository.findById(document.getDocumentId()).ifPresent(doc -> {
                // Simple pattern matching for mock document typing
                String type = "Unknown Document";
                if (finalText.toLowerCase().contains("uid") || finalText.toLowerCase().contains("aadhaar"))
                    type = "Aadhaar";
                else if (finalText.toLowerCase().contains("pan") || finalText.toLowerCase().contains("income tax"))
                    type = "PAN Card";
                else if (finalText.toLowerCase().contains("passport") || finalText.toLowerCase().contains("visa"))
                    type = "Passport";
                else if (finalText.toLowerCase().contains("bank") || finalText.toLowerCase().contains("statement"))
                    type = "Bank Statement";

                doc.setDocumentType(type);
                doc.setExtractedFields(finalText.length() > 500 ? finalText.substring(0, 500) + "..." : finalText);
                doc.setOcrConfidence(finalText.isEmpty() ? 0.0 : 0.88);
                vaultRepository.save(doc);
            });

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
