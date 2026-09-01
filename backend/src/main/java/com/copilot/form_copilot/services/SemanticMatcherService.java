package com.copilot.form_copilot.services;

import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Deterministic synonym-based semantic matcher for Indian document types.
 * Maps form requirement descriptions to vault document types using a curated
 * synonym dictionary. This is the Phase 5 Semantic Matcher component from the
 * architecture spec, implemented without ML embeddings for reliability.
 */
@Service
public class SemanticMatcherService {

    // Maps a canonical document type to all known synonyms / aliases
    private static final Map<String, List<String>> SYNONYM_MAP = new LinkedHashMap<>();

    static {
        SYNONYM_MAP.put("Aadhaar", List.of(
                "aadhaar", "aadhar", "aadhaar card", "aadhar card", "uid", "uid card",
                "unique identification", "identity proof", "id proof", "photo id",
                "proof of identity", "government id"));
        SYNONYM_MAP.put("PAN Card", List.of(
                "pan", "pan card", "permanent account number", "income tax id",
                "financial id", "tax identification"));
        SYNONYM_MAP.put("Passport", List.of(
                "passport", "indian passport", "travel document",
                "passport book", "passport card"));
        SYNONYM_MAP.put("Voter ID", List.of(
                "voter id", "voter card", "voter identity card", "election card",
                "epic", "electoral photo identity card", "election commission id"));
        SYNONYM_MAP.put("Driving License", List.of(
                "driving license", "driving licence", "dl", "driver's license",
                "driver license", "motor vehicle license"));
        SYNONYM_MAP.put("Domicile Certificate", List.of(
                "domicile", "domicile certificate", "residence certificate",
                "proof of residence", "residential proof", "proof of domicile"));
        SYNONYM_MAP.put("Birth Certificate", List.of(
                "birth certificate", "date of birth proof", "dob proof",
                "proof of birth", "birth proof", "proof of date of birth"));
        SYNONYM_MAP.put("Caste Certificate", List.of(
                "caste certificate", "sc certificate", "st certificate",
                "obc certificate", "category certificate", "sc/st certificate"));
        SYNONYM_MAP.put("Income Certificate", List.of(
                "income certificate", "income proof", "proof of income",
                "ews certificate", "economically weaker section"));
        SYNONYM_MAP.put("10th Marksheet", List.of(
                "10th marksheet", "class 10 marksheet", "ssc marksheet",
                "10th certificate", "matriculation certificate", "class x marksheet"));
        SYNONYM_MAP.put("12th Marksheet", List.of(
                "12th marksheet", "class 12 marksheet", "hsc marksheet",
                "12th certificate", "intermediate certificate", "class xii marksheet"));
        SYNONYM_MAP.put("Degree Certificate", List.of(
                "degree certificate", "graduation certificate", "degree",
                "bachelor's degree", "bachelor degree", "undergraduate certificate"));
        SYNONYM_MAP.put("Bank Statement", List.of(
                "bank statement", "bank passbook", "account statement",
                "bank account statement", "financial statement"));
        SYNONYM_MAP.put("ITR", List.of(
                "itr", "income tax return", "itr acknowledgment", "it return",
                "income tax return acknowledgment", "tax return"));
        SYNONYM_MAP.put("Address Proof", List.of(
                "address proof", "proof of address", "residential address proof",
                "address verification", "utility bill", "electricity bill",
                "gas bill", "water bill", "telephone bill"));
    }

    /**
     * Match a requirement's documentTypeNeeded against a vault document's
     * documentType.
     * Returns a confidence score from 0.0 to 1.0.
     */
    public double match(String requirementType, String vaultDocumentType) {
        if (requirementType == null || vaultDocumentType == null)
            return 0.0;

        String reqLower = requirementType.toLowerCase().trim();
        String docLower = vaultDocumentType.toLowerCase().trim();

        // Exact match
        if (reqLower.equals(docLower))
            return 1.0;

        // Check if both resolve to the same canonical type
        String reqCanonical = resolveCanonical(reqLower);
        String docCanonical = resolveCanonical(docLower);

        if (reqCanonical != null && reqCanonical.equals(docCanonical)) {
            return 0.95;
        }

        // Check if requirement matches any synonym of the vault doc type
        if (reqCanonical != null) {
            List<String> docSynonyms = SYNONYM_MAP.getOrDefault(docCanonical, List.of());
            for (String syn : docSynonyms) {
                if (reqLower.contains(syn) || syn.contains(reqLower)) {
                    return 0.85;
                }
            }
        }

        // Special case: Address Proof can match Aadhaar, Voter ID, Driving License,
        // Passport, Utility Bill
        if (reqLower.contains("address proof") || reqLower.contains("proof of address")) {
            Set<String> addressDocs = Set.of("Aadhaar", "Voter ID", "Driving License", "Passport");
            if (addressDocs.contains(docCanonical))
                return 0.82;
        }

        // Special case: Identity Proof can match Aadhaar, PAN Card, Voter ID, Passport,
        // Driving License
        if (reqLower.contains("identity proof") || reqLower.contains("id proof") || reqLower.contains("photo id")) {
            Set<String> identityDocs = Set.of("Aadhaar", "PAN Card", "Voter ID", "Passport", "Driving License");
            if (identityDocs.contains(docCanonical))
                return 0.82;
        }

        return 0.0;
    }

    /**
     * Returns a list of all canonical document types that could satisfy a
     * requirement.
     */
    public List<String> findMatchingTypes(String requirementType) {
        if (requirementType == null)
            return List.of();
        String reqLower = requirementType.toLowerCase().trim();
        List<String> results = new ArrayList<>();

        for (Map.Entry<String, List<String>> entry : SYNONYM_MAP.entrySet()) {
            String canonical = entry.getKey();
            if (canonical.equalsIgnoreCase(requirementType)) {
                results.add(canonical);
                continue;
            }
            for (String synonym : entry.getValue()) {
                if (reqLower.contains(synonym) || synonym.contains(reqLower)) {
                    results.add(canonical);
                    break;
                }
            }
        }

        return results;
    }

    private String resolveCanonical(String input) {
        for (Map.Entry<String, List<String>> entry : SYNONYM_MAP.entrySet()) {
            if (entry.getKey().equalsIgnoreCase(input))
                return entry.getKey();
            for (String syn : entry.getValue()) {
                if (syn.equalsIgnoreCase(input))
                    return entry.getKey();
            }
        }
        return null;
    }
}
