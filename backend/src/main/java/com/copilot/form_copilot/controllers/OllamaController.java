package com.copilot.form_copilot.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/llm")
public class OllamaController {

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String OLLAMA_URL = "http://localhost:11434/api/generate";

    @PostMapping("/explain")
    public ResponseEntity<Map<String, String>> explain(@RequestBody Map<String, String> payload) {
        String ruleDescription = payload.get("rule");
        String nextSteps = payload.get("action");
        String document = payload.get("document");

        String prompt = "You are a helpful assistant for Indian public services. Explain this simply to an elder. " +
                "System says: " + ruleDescription + ". Action required: " + nextSteps + ". Document: " + document
                + ". Keep it under 2 sentences.";

        try {
            Map<String, Object> request = Map.of(
                    "model", "llama3.2",
                    "prompt", prompt,
                    "stream", false);

            // Mock LLM if Ollama isn't running
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> response = restTemplate.postForObject(OLLAMA_URL, request, Map.class);
                if (response != null) {
                    return ResponseEntity.ok(Map.of("explanation", response.get("response").toString()));
                }
                throw new RuntimeException("Null response");
            } catch (Exception e) {
                return ResponseEntity.ok(Map.of("explanation",
                        "If you can connect Ollama (llama3.2), I would give a detailed explanation. " +
                                "For now, here is the simulated local AI advice: Please make sure your " + document
                                + " is valid and updated."));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @SuppressWarnings("unchecked")
    @PostMapping("/summarize")
    public ResponseEntity<Map<String, String>> summarizeForm(@RequestBody Map<String, Object> payload) {
        String formTitle = (String) payload.getOrDefault("title", "Unknown Form");
        String rawTextSnippet = (String) payload.getOrDefault("rawText", "");
        List<Map<String, Object>> requirements = (List<Map<String, Object>>) payload.getOrDefault("requirements",
                List.of());

        // Build a structured requirement list for the prompt
        StringBuilder reqSummary = new StringBuilder();
        int mandatoryCount = 0;
        int optionalCount = 0;
        for (Map<String, Object> req : requirements) {
            String docType = (String) req.getOrDefault("documentTypeNeeded", "Document");
            String desc = (String) req.getOrDefault("description", "");
            boolean mandatory = Boolean.TRUE.equals(req.get("mandatory"));
            String category = (String) req.getOrDefault("category", "General");
            String sourceClause = (String) req.getOrDefault("sourceClause", "");

            if (mandatory)
                mandatoryCount++;
            else
                optionalCount++;

            reqSummary.append("- ").append(docType).append(" (").append(mandatory ? "Mandatory" : "Optional")
                    .append(", Category: ").append(category).append("): ").append(desc);
            if (sourceClause != null && !sourceClause.isEmpty()) {
                reqSummary.append(" [Clause: ").append(sourceClause).append("]");
            }
            reqSummary.append("\n");
        }

        // Truncate raw text to avoid exceeding context
        String snippet = rawTextSnippet.length() > 800 ? rawTextSnippet.substring(0, 800) + "..." : rawTextSnippet;

        String prompt = "You are a helpful Indian public services assistant. "
                + "A user uploaded a government/institutional form titled \"" + formTitle + "\". "
                + "The extracted text begins with: \"" + snippet + "\"\n\n"
                + "The system has extracted these requirements:\n" + reqSummary + "\n"
                + "Based ONLY on the information above, provide a brief plain-English summary with these sections:\n"
                + "1. WHAT THIS FORM IS FOR: One sentence about what the user is applying for.\n"
                + "2. WHAT YOU GENERALLY NEED: A short list of the main things the user needs to provide.\n"
                + "3. IMPORTANT CONDITIONS: Any eligibility conditions or special rules that can be inferred.\n"
                + "If you cannot determine something from the given information, say 'Cannot be determined from the analyzed text.' "
                + "Keep the entire response under 150 words. Do NOT invent information.";

        try {
            Map<String, Object> request = Map.of(
                    "model", "llama3.2",
                    "prompt", prompt,
                    "stream", false);

            try {
                Map<String, Object> response = restTemplate.postForObject(OLLAMA_URL, request, Map.class);
                if (response != null && response.get("response") != null) {
                    return ResponseEntity.ok(Map.of("summary", response.get("response").toString()));
                }
                throw new RuntimeException("Null response");
            } catch (Exception e) {
                // Deterministic fallback when Ollama is not available
                String fallback = buildDeterministicSummary(formTitle, mandatoryCount, optionalCount, requirements);
                return ResponseEntity.ok(Map.of("summary", fallback));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    private String buildDeterministicSummary(String formTitle, int mandatoryCount, int optionalCount,
            List<Map<String, Object>> requirements) {
        StringBuilder sb = new StringBuilder();

        // Infer form type from title
        String titleLower = formTitle.toLowerCase();
        if (titleLower.contains("passport")) {
            sb.append("This form is related to a Passport application or renewal process.");
        } else if (titleLower.contains("bank") || titleLower.contains("account")) {
            sb.append("This form is related to a Bank account opening or KYC verification process.");
        } else if (titleLower.contains("university") || titleLower.contains("admission")
                || titleLower.contains("college")) {
            sb.append("This form is related to an educational institution admission process.");
        } else {
            sb.append("This appears to be a government or institutional form requiring document verification.");
        }

        sb.append("\n\nYou need to provide ").append(mandatoryCount).append(" mandatory document(s)");
        if (optionalCount > 0) {
            sb.append(" and ").append(optionalCount).append(" optional document(s)");
        }
        sb.append(" for this application.");

        sb.append("\n\nRequired documents include: ");
        List<String> mandatoryDocs = new java.util.ArrayList<>();
        for (Map<String, Object> req : requirements) {
            if (Boolean.TRUE.equals(req.get("mandatory"))) {
                mandatoryDocs.add((String) req.getOrDefault("documentTypeNeeded", "Document"));
            }
        }
        sb.append(String.join(", ", mandatoryDocs)).append(".");

        sb.append(
                "\n\nNote: AI-powered detailed summary is available when Ollama (llama3.2) is running on localhost:11434.");

        return sb.toString();
    }
}
