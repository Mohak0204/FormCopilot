# Product Requirements Document (PRD)

## Public Service Form Copilot

**Version:** 1.0
**Date:** September 1, 2026
**Status:** Implementation-Ready

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Criteria](#3-goals--success-criteria)
4. [Target Users & Personas](#4-target-users--personas)
5. [Core Use Cases & User Journeys](#5-core-use-cases--user-journeys)
6. [Functional Requirements & Features](#6-functional-requirements--features)
7. [User Stories with Acceptance Criteria](#7-user-stories-with-acceptance-criteria)
8. [Business Rules & Edge Cases](#8-business-rules--edge-cases)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Authentication, Authorization & Permissions](#10-authentication-authorization--permissions)
11. [Data Requirements](#11-data-requirements)
12. [Integrations & External Services](#12-integrations--external-services)
13. [MVP Scope, Priorities & Future Enhancements](#13-mvp-scope-priorities--future-enhancements)
14. [Assumptions, Constraints, Dependencies & Risks](#14-assumptions-constraints-dependencies--risks)

---

## 1. Product Overview

**Public Service Form Copilot** is a privacy-first AI application that transforms complex government, university, banking, and insurance forms into personalized, actionable checklists. It does not merely summarize documents—it compares a form's requirements with the user's encrypted personal document vault, identifies documents that are available, missing, or expired, and explains requirements in plain English (with future Hindi support).

### Key Differentiator

The LLM is **not** the decision-maker. Critical logic (eligibility, expiry checks, mandatory conditions) is handled by a deterministic rule engine. The LLM's role is limited to human-readable explanation and jargon simplification. This hybrid architecture ensures reliability, auditability, and trust.

### Pipeline Architecture (One-liner)

> Upload form → understand requirements → compare with user's documents → check validity → apply rules → AI explains → personalized checklist.

---

## 2. Problem Statement

### The Problem

Millions of Indians interact with institutional forms—passport applications, university admissions, insurance claims, bank account openings, property registrations—that are:

- **Jargon-heavy**: Written in bureaucratic or legal language most people cannot parse.
- **Requirement-opaque**: Require specific documents, attestations, and validity conditions that are buried in fine print or scattered across multiple pages.
- **Error-prone**: Citizens frequently arrive at offices with incomplete or expired documents, wasting time, money, and institutional resources.
- **Inequitable**: People without access to intermediaries (CAs, agents, consultants) are disproportionately affected—particularly rural citizens, first-generation applicants, and economically weaker sections.

### Why Existing Solutions Fail

| Approach | Limitation |
|----------|-----------|
| Generic chatbots | Summarize text but don't compare against *your* documents |
| Cloud AI services | Require uploading sensitive PII (Aadhaar, PAN, bank statements) to third-party servers |
| Government websites | Provide static checklists without personalization or validity checks |
| Human agents | Expensive, inconsistent, and unavailable in rural areas |

---

## 3. Goals & Success Criteria

### Primary Goals

| # | Goal | Measurable Criterion |
|---|------|---------------------|
| G1 | Convert complex forms into structured requirement checklists | ≥ 90% of requirements correctly extracted from supported form types |
| G2 | Match form requirements with user's document vault | ≥ 85% semantic matching accuracy for standard Indian documents |
| G3 | Identify missing, expired, or incomplete documents | 100% accuracy on deterministic checks (expiry dates, mandatory fields) |
| G4 | Explain requirements in plain, simple English | User comprehension score ≥ 4/5 in usability testing |
| G5 | Keep all user data local and encrypted | Zero PII transmitted to external servers |

### Secondary Goals

| # | Goal | Measurable Criterion |
|---|------|---------------------|
| G6 | Support common Indian document types | ≥ 15 document types recognized in MVP |
| G7 | Support Hindi language explanations | Hindi output available in v2.0 |
| G8 | Provide explainable, auditable decisions | Every status decision traceable to a specific rule + form clause |

### SDG Alignment

- **SDG 10 (Reduced Inequalities)**: Makes institutional processes accessible regardless of education level, language, or access to intermediaries.
- **SDG 16 (Peace, Justice and Strong Institutions)**: Improves transparency and understandability of official processes.

---

## 4. Target Users & Personas

### Persona 1: Priya — First-Generation College Applicant

| Attribute | Detail |
|-----------|--------|
| Age | 18 |
| Location | Semi-urban Madhya Pradesh |
| Tech Literacy | Moderate (smartphone, WhatsApp) |
| Context | Applying for university admission; parents are small farmers with no experience navigating university processes |
| Pain Point | Overwhelmed by 12-page admission form requiring "migration certificate," "character certificate," "caste certificate (if applicable)" — doesn't know which she needs or if her existing documents are valid |
| Need | Plain-language checklist telling her exactly what to get, what she already has, and what's expired |

### Persona 2: Ramesh — Small Business Owner

| Attribute | Detail |
|-----------|--------|
| Age | 42 |
| Location | Tier-2 city, Gujarat |
| Tech Literacy | Moderate (uses laptop for GST filing) |
| Context | Applying for a business loan; bank requires financial statements, GST returns, property documents, identity proofs |
| Pain Point | Submitted application twice with missing documents; lost weeks each time |
| Need | Upload the bank's requirement form + his documents → instant gap analysis |

### Persona 3: Anita — Government Employee Processing Applications

| Attribute | Detail |
|-----------|--------|
| Age | 35 |
| Location | District office, Rajasthan |
| Tech Literacy | Moderate |
| Context | Processes 50+ applications daily; often returns incomplete applications |
| Pain Point | Spending time explaining missing documents to applicants |
| Need | Tool applicants can use *before* visiting, reducing rejections |

### Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **User** | Individual who uploads forms and manages personal document vault | Full access to own vault and checklists |
| **Admin** (future) | System administrator for organizational deployments | Manage form templates, view anonymized analytics |

---

## 5. Core Use Cases & User Journeys

### UC-1: Upload and Analyze a Form

**Actor:** User
**Precondition:** User has a PDF / image of an official form.

**Flow:**
1. User uploads form (PDF, image, or scanned document).
2. System runs Document AI / OCR to extract text and layout.
3. System uses structured information extraction to identify requirements (documents needed, eligibility conditions, validity periods, fees, deadlines).
4. System uses RAG to retrieve relevant clauses, rules, and instructions from the form.
5. System presents a structured list of extracted requirements to the user.
6. User can review and confirm/correct requirements.

**Postcondition:** A structured requirement set is stored for the form.

---

### UC-2: Build and Manage Personal Document Vault

**Actor:** User
**Precondition:** User is authenticated.

**Flow:**
1. User uploads personal documents (Aadhaar, PAN, certificates, bank statements, etc.).
2. System runs OCR + structured extraction on each document.
3. System extracts metadata: `documentType`, `holderName`, `issueDate`, `expiryDate`, `certificateNumber`, `issuingAuthority`, etc.
4. All extracted data is encrypted at rest using user's key.
5. User can view, edit metadata, re-upload, or delete documents.

**Postcondition:** Encrypted document vault populated with structured metadata.

---

### UC-3: Generate Personalized Checklist

**Actor:** User
**Precondition:** Form analyzed (UC-1), Document vault populated (UC-2).

**Flow:**
1. User selects an analyzed form and triggers checklist generation.
2. **Semantic Matching** module compares form requirements with vault documents (e.g., "proof of residence" ↔ "Domicile Certificate").
3. **Deterministic Rule Engine** checks:
   - Mandatory vs. optional requirements
   - Document expiry dates vs. required validity
   - Eligibility conditions (age, income thresholds, domicile state, etc.)
   - Document format/attestation requirements
4. Each requirement is assigned a status: `✅ Available`, `❌ Missing`, `⚠️ Expired`, `⏳ Expiring Soon`, `❓ Needs Review`.
5. **Local LLM** generates plain-English explanations for each item, citing the relevant form clause.
6. System presents the personalized checklist.

**Postcondition:** User has an actionable, explained checklist with clear next steps.

---

### UC-4: View Requirement Explanation

**Actor:** User
**Precondition:** Checklist generated (UC-3).

**Flow:**
1. User clicks on any checklist item.
2. System shows:
   - The original form clause (highlighted)
   - The rule applied (e.g., "Aadhaar card expires: Never; Domicile certificate valid for 3 years from issue date")
   - The matching vault document (if any) with relevant extracted fields
   - The LLM-generated plain-English explanation
   - Why the status was assigned (Explainable AI)
3. User can mark the explanation as helpful/unhelpful (feedback loop).

**Postcondition:** User understands why each item has its status.

---

### UC-5: Export Checklist

**Actor:** User
**Precondition:** Checklist generated (UC-3).

**Flow:**
1. User clicks "Export."
2. System generates a downloadable PDF/Markdown checklist.
3. Checklist includes: requirement, status, explanation, and next steps.

**Postcondition:** User has an offline-usable checklist document.

---

## 6. Functional Requirements & Features

### F1: Document Upload & OCR Processing

| ID | Requirement | Priority |
|----|------------|----------|
| F1.1 | Accept PDF, JPEG, PNG, TIFF uploads (max 20 MB per file) | P0 |
| F1.2 | Run OCR on scanned/image documents using Tesseract or equivalent | P0 |
| F1.3 | Extract text with layout preservation from native PDFs | P0 |
| F1.4 | Display extracted text for user confirmation | P1 |
| F1.5 | Support multi-page documents | P0 |
| F1.6 | Support batch upload (up to 10 files at once) | P1 |

### F2: Structured Information Extraction

| ID | Requirement | Priority |
|----|------------|----------|
| F2.1 | Extract document type (Aadhaar, PAN, passport, domicile, income, caste, birth, degree, marksheet, bank statement, ITR, GST, property, voter ID, driving license) | P0 |
| F2.2 | Extract common fields: `holderName`, `dateOfBirth`, `issueDate`, `expiryDate`, `documentNumber`, `issuingAuthority`, `address` | P0 |
| F2.3 | Handle multiple date formats (DD/MM/YYYY, DD-MMM-YYYY, etc.) | P0 |
| F2.4 | Return confidence scores for each extracted field | P1 |
| F2.5 | Allow user to manually correct extracted fields | P0 |

### F3: Form Requirement Extraction

| ID | Requirement | Priority |
|----|------------|----------|
| F3.1 | Parse uploaded forms to identify individual requirements/documents needed | P0 |
| F3.2 | Classify each requirement as mandatory or optional | P0 |
| F3.3 | Extract eligibility conditions (age, income, domicile, category) | P0 |
| F3.4 | Extract validity/format conditions (attested, self-attested, notarized, certified copy, original) | P1 |
| F3.5 | Extract deadlines and submission dates if present | P1 |
| F3.6 | Use RAG to retrieve and cite specific clauses from the form | P0 |

### F4: Personal Document Vault

| ID | Requirement | Priority |
|----|------------|----------|
| F4.1 | Encrypted local storage of document metadata and files | P0 |
| F4.2 | CRUD operations on vault documents | P0 |
| F4.3 | Automatic metadata extraction on upload | P0 |
| F4.4 | Manual metadata editing | P0 |
| F4.5 | Document preview (thumbnail/first page) | P1 |
| F4.6 | Vault search by document type, name, or date | P1 |
| F4.7 | Document deletion with secure wipe | P0 |

### F5: Semantic Matching

| ID | Requirement | Priority |
|----|------------|----------|
| F5.1 | Match form requirements to vault documents using semantic similarity | P0 |
| F5.2 | Handle synonyms and aliases (e.g., "address proof" = "Aadhaar" / "utility bill" / "voter ID") | P0 |
| F5.3 | Support one-to-many matching (one requirement satisfiable by multiple document types) | P0 |
| F5.4 | Return match confidence score | P1 |
| F5.5 | Allow user to override/correct matches | P0 |

### F6: Deterministic Rule Engine

| ID | Requirement | Priority |
|----|------------|----------|
| F6.1 | Check document expiry against current date and form-specified validity requirements | P0 |
| F6.2 | Evaluate mandatory vs. optional requirement fulfillment | P0 |
| F6.3 | Check eligibility conditions (age calculation, income thresholds, domicile matching) | P0 |
| F6.4 | Flag documents expiring within 30/60/90 days as "Expiring Soon" | P1 |
| F6.5 | Support configurable rules (JSON/YAML rule definitions) | P1 |
| F6.6 | Log every rule evaluation with input, rule applied, and result (audit trail) | P0 |

### F7: Local LLM Explanation Generation

| ID | Requirement | Priority |
|----|------------|----------|
| F7.1 | Generate plain-English explanation for each checklist item | P0 |
| F7.2 | Simplify bureaucratic/legal jargon | P0 |
| F7.3 | Cite the specific form clause or rule that drives the requirement | P0 |
| F7.4 | Generate actionable next steps for missing/expired documents | P0 |
| F7.5 | Run entirely locally (no external API calls for inference) | P0 |
| F7.6 | Support temperature = 0 for deterministic output | P1 |

### F8: Checklist Generation & Display

| ID | Requirement | Priority |
|----|------------|----------|
| F8.1 | Generate checklist with statuses: Available, Missing, Expired, Expiring Soon, Needs Review | P0 |
| F8.2 | Group requirements by category (identity, address, financial, educational, etc.) | P1 |
| F8.3 | Show completion percentage | P1 |
| F8.4 | Allow filtering by status | P1 |
| F8.5 | Export checklist as PDF | P1 |
| F8.6 | Export checklist as Markdown | P2 |

### F9: Explainability & Audit

| ID | Requirement | Priority |
|----|------------|----------|
| F9.1 | For each checklist item, show: original clause, applied rule, matching document, and explanation | P0 |
| F9.2 | Decision audit log persisted locally | P0 |
| F9.3 | User feedback on explanation quality (helpful/not helpful) | P1 |

---

## 7. User Stories with Acceptance Criteria

### US-1: Upload an Official Form

**As a** user,
**I want to** upload a government/institutional form (PDF or image),
**So that** the system can extract its requirements.

**Acceptance Criteria:**

- [ ] System accepts PDF, JPEG, PNG, TIFF files up to 20 MB.
- [ ] OCR successfully extracts text from scanned documents with ≥ 90% character accuracy on clear scans.
- [ ] System displays extracted text within 30 seconds for a typical 5-page form.
- [ ] User can see a list of identified requirements after processing.
- [ ] Error message shown if file format is unsupported or file is corrupted.

---

### US-2: Add a Personal Document to Vault

**As a** user,
**I want to** upload my personal documents (Aadhaar, PAN, certificates) to my encrypted vault,
**So that** the system can match them against form requirements.

**Acceptance Criteria:**

- [ ] Document file is encrypted before storage using AES-256.
- [ ] System automatically extracts metadata (type, name, dates, number).
- [ ] User can view and correct extracted metadata.
- [ ] Document appears in vault list immediately after upload.
- [ ] User can delete a document, and both file and metadata are securely wiped.

---

### US-3: Generate a Personalized Checklist

**As a** user,
**I want to** compare a form's requirements against my document vault,
**So that** I know exactly what I have, what I'm missing, and what's expired.

**Acceptance Criteria:**

- [ ] Each requirement shows one of: ✅ Available, ❌ Missing, ⚠️ Expired, ⏳ Expiring Soon, ❓ Needs Review.
- [ ] Deterministic checks (expiry, mandatory fields) are 100% accurate against test data.
- [ ] Semantic matching accuracy ≥ 85% on standard Indian documents.
- [ ] Checklist is generated within 60 seconds for a form with ≤ 20 requirements.
- [ ] Completion percentage is displayed.

---

### US-4: Understand a Requirement

**As a** user,
**I want to** see a plain-English explanation of each requirement,
**So that** I understand what's needed and why, even if I'm not familiar with bureaucratic language.

**Acceptance Criteria:**

- [ ] Each checklist item has an expandable explanation section.
- [ ] Explanation includes: simplified description, original form clause, applied rule, and next steps.
- [ ] Explanation is generated by local LLM without making external API calls.
- [ ] User can rate explanation as helpful or not helpful.

---

### US-5: View Decision Audit Trail

**As a** user,
**I want to** see why each requirement was marked as available/missing/expired,
**So that** I can trust and verify the system's decisions.

**Acceptance Criteria:**

- [ ] For each item, I can see: the rule that was applied, the input data used, and the result.
- [ ] If a document was matched, I can see which vault document matched and with what confidence.
- [ ] Audit trail is stored locally and not transmitted externally.

---

### US-6: Export My Checklist

**As a** user,
**I want to** download my checklist as a PDF,
**So that** I can carry it offline to the relevant office.

**Acceptance Criteria:**

- [ ] PDF includes: form name, date generated, each requirement with status and explanation.
- [ ] PDF is well-formatted and printable on A4.
- [ ] Download initiates within 5 seconds.

---

### US-7: Manage My Vault Documents

**As a** user,
**I want to** view, search, edit, and delete documents in my vault,
**So that** I can keep my document collection up to date.

**Acceptance Criteria:**

- [ ] Vault displays all documents with type, name, issue date, and expiry date.
- [ ] User can search/filter by document type or keyword.
- [ ] User can edit metadata fields.
- [ ] Deleting a document removes both the file and all extracted metadata.

---

### US-8: Correct an OCR Extraction Error

**As a** user,
**I want to** manually correct incorrectly extracted text or metadata,
**So that** the system's analysis is accurate.

**Acceptance Criteria:**

- [ ] User can edit any extracted field inline.
- [ ] Corrected values are immediately reflected in subsequent checklist generation.
- [ ] Original OCR output is retained for reference.

---

## 8. Business Rules & Edge Cases

### Business Rules

| ID | Rule | Implementation |
|----|------|---------------|
| BR-1 | Aadhaar cards do not expire. | Rule engine: `if documentType == "Aadhaar" then expiryDate = null; status = "valid"` |
| BR-2 | Passports are valid until their printed expiry date. | Rule engine: compare `expiryDate` with `currentDate` |
| BR-3 | Some forms require documents valid for N months *beyond* the application date. | Rule engine: check `expiryDate >= applicationDate + requiredValidityMonths` |
| BR-4 | Caste/income/domicile certificates may have state-specific validity periods. | Configurable rule: `validityMonths` per `documentType` per `state` |
| BR-5 | "Self-attested copy" and "original" are different format requirements. | Rule engine: check `requiredFormat` against vault document `availableFormats` |
| BR-6 | A single vault document may satisfy multiple requirements. | Semantic matcher returns all matching requirements per document |
| BR-7 | A single requirement may be satisfiable by multiple document types. | Semantic matcher returns alternative documents if primary is missing |
| BR-8 | If the LLM fails or produces low-confidence output, show rule-engine output without LLM explanation. | Fallback: display structured data without natural language explanation |
| BR-9 | Age is calculated as of the form's specified reference date (e.g., "as on 1st July 2026"), not today's date. | Rule engine: use `referenceDate` from form, default to `currentDate` |
| BR-10 | Financial documents (ITR, bank statements) must be from the correct assessment year / period. | Rule engine: check `assessmentYear` or `statementPeriod` against form requirements |

### Edge Cases

| ID | Scenario | Handling |
|----|----------|----------|
| EC-1 | Uploaded form is entirely in a regional language | Display warning: "Form language not supported in current version. Text extraction may be inaccurate." Attempt extraction anyway. |
| EC-2 | OCR produces unreadable text (very poor scan quality) | Display warning with confidence score. Prompt user to re-upload a clearer scan. |
| EC-3 | User's name differs across documents (maiden name, spelling variation) | Flag as "Needs Review" with explanation. Do not auto-reject. |
| EC-4 | Form requires a document type not recognized by the system | Mark as "Needs Review" and present the raw requirement text. |
| EC-5 | Document has no expiry date printed but the form requires validity check | Apply default validity rules from configurable database. Flag for user confirmation. |
| EC-6 | Multiple vault documents of the same type (e.g., two address proofs) | Present all options and let user select which to use. System recommends the most recent. |
| EC-7 | Form has conditional requirements (e.g., "if SC/ST, provide caste certificate") | Rule engine evaluates condition against user profile. If condition data is missing, flag as "Needs Review." |
| EC-8 | User has no documents in vault | Skip matching; show all requirements as "Missing" with instructions on how to obtain each. |

---

## 9. Non-Functional Requirements

### Performance

| Metric | Target |
|--------|--------|
| OCR processing time | ≤ 10 seconds per page |
| Form requirement extraction | ≤ 30 seconds for a 10-page form |
| Checklist generation | ≤ 60 seconds for 20 requirements |
| LLM explanation generation | ≤ 5 seconds per item |
| UI response time | ≤ 200ms for navigation, ≤ 500ms for data operations |

### Security & Privacy

| Requirement | Detail |
|-------------|--------|
| Data locality | All user data (documents, metadata, vault) stored locally on user's device/server |
| Encryption at rest | AES-256 encryption for all vault files and metadata |
| No external PII transmission | LLM runs locally; no document content sent to cloud APIs |
| Secure deletion | Overwrite file data on delete (not just pointer removal) |
| Session management | Local authentication with session timeout (configurable, default 30 min) |

### Scalability

| Requirement | Detail |
|-------------|--------|
| Vault capacity | Support ≥ 100 documents per user |
| Form complexity | Support forms with up to 50 requirements |
| Concurrent users | Single-user desktop app (MVP); multi-user server deployment (future) |

### Accessibility

| Requirement | Detail |
|-------------|--------|
| WCAG compliance | Target WCAG 2.1 AA |
| Screen reader support | All interactive elements have ARIA labels |
| Keyboard navigation | Full keyboard navigation support |
| Font scaling | Support browser-level font scaling |

### Reliability

| Requirement | Detail |
|-------------|--------|
| LLM fallback | If LLM fails, show rule-engine output without explanations |
| Data persistence | SQLite database with WAL mode for crash resilience |
| Error recovery | Graceful handling of corrupted uploads, incomplete OCR |

---

## 10. Authentication, Authorization & Permissions

### MVP (Single-User Local App)

| Aspect | Implementation |
|--------|---------------|
| Authentication | Local passphrase-based authentication. Passphrase used to derive encryption key (PBKDF2/Argon2). |
| Session | Session token stored in memory; expires after 30 minutes of inactivity |
| Authorization | Single "User" role with full access to own data |
| Vault access | All vault operations require active session |

### Future (Multi-User / Organizational)

| Aspect | Implementation |
|--------|---------------|
| Authentication | OAuth 2.0 / OpenID Connect |
| Roles | User, Admin |
| Admin permissions | Manage form templates, view anonymized usage analytics |
| User permissions | Full access to own vault and checklists only |
| Data isolation | Strict per-user data segregation |

---

## 11. Data Requirements

### Data Entities

#### Form

| Field | Type | Description |
|-------|------|-------------|
| `formId` | UUID | Unique identifier |
| `title` | string | Form title (extracted or user-provided) |
| `sourceFileName` | string | Original uploaded filename |
| `rawText` | text | Full extracted text |
| `uploadedAt` | datetime | Upload timestamp |
| `pageCount` | int | Number of pages |
| `status` | enum | `processing`, `ready`, `error` |

#### FormRequirement

| Field | Type | Description |
|-------|------|-------------|
| `requirementId` | UUID | Unique identifier |
| `formId` | UUID | FK to Form |
| `description` | string | Requirement description |
| `documentTypeNeeded` | string | e.g., "address proof", "income certificate" |
| `isMandatory` | boolean | Whether the requirement is mandatory |
| `eligibilityCondition` | JSON | Conditional logic (e.g., `{"category": ["SC", "ST"]}`) |
| `validityRequirement` | JSON | e.g., `{"validForMonths": 6}` |
| `formatRequirement` | string | e.g., "self-attested copy", "original" |
| `sourceClause` | string | Verbatim text from form |
| `category` | string | Grouping: identity, address, financial, educational, other |

#### VaultDocument

| Field | Type | Description |
|-------|------|-------------|
| `documentId` | UUID | Unique identifier |
| `documentType` | string | Standardized type (e.g., "Aadhaar", "PAN", "Domicile") |
| `holderName` | string | Name on document |
| `documentNumber` | string | Certificate/card number |
| `issueDate` | date | Date of issue |
| `expiryDate` | date (nullable) | Date of expiry (null if never expires) |
| `issuingAuthority` | string | Issuing body |
| `state` | string | Issuing state (for state-specific validity) |
| `extractedFields` | JSON | All extracted key-value pairs |
| `ocrConfidence` | float | Overall OCR confidence score |
| `filePath` | string | Encrypted file path |
| `uploadedAt` | datetime | Upload timestamp |
| `lastModifiedAt` | datetime | Last edit timestamp |

#### ChecklistItem

| Field | Type | Description |
|-------|------|-------------|
| `itemId` | UUID | Unique identifier |
| `formId` | UUID | FK to Form |
| `requirementId` | UUID | FK to FormRequirement |
| `matchedDocumentId` | UUID (nullable) | FK to VaultDocument |
| `status` | enum | `available`, `missing`, `expired`, `expiring_soon`, `needs_review` |
| `matchConfidence` | float (nullable) | Semantic match score |
| `ruleApplied` | JSON | Rule engine evaluation details |
| `explanation` | text | LLM-generated explanation |
| `sourceClause` | text | Referenced form clause |
| `nextSteps` | text | Actionable instructions |
| `generatedAt` | datetime | Generation timestamp |

#### AuditLog

| Field | Type | Description |
|-------|------|-------------|
| `logId` | UUID | Unique identifier |
| `itemId` | UUID | FK to ChecklistItem |
| `ruleId` | string | Rule identifier |
| `inputData` | JSON | Data fed into rule |
| `result` | string | Rule evaluation result |
| `timestamp` | datetime | Evaluation timestamp |

### Data Retention

- All data stored locally; no cloud sync in MVP.
- User can export/delete all data at any time.
- Vault documents retained until explicitly deleted by user.
- Checklists retained indefinitely; user can delete individually.

---

## 12. Integrations & External Services

### MVP: No External Service Dependencies

The MVP is intentionally designed to operate without any external API calls or cloud dependencies.

| Component | Solution | External Dependency |
|-----------|----------|-------------------|
| OCR | Tesseract OCR (local) | None |
| LLM | Ollama + Llama 3.1 8B or Mistral 7B (local) | None (model downloaded once) |
| Embedding model | Sentence-Transformers (local) | None (model downloaded once) |
| Database | SQLite | None |
| PDF generation | ReportLab / WeasyPrint (local) | None |
| PDF text extraction | PyMuPDF / pdfplumber (local) | None |

### Future Integrations (Post-MVP)

| Integration | Purpose | When |
|-------------|---------|------|
| DigiLocker API | Fetch verified government documents directly | v2.0+ |
| Google Translate API / Indic NLP | Hindi and regional language support | v2.0 |
| Cloud LLM (opt-in) | Higher-quality explanations for users who consent | v2.0+ |

---

## 13. MVP Scope, Priorities & Future Enhancements

### MVP (v1.0) — P0 Features

1. **Form Upload & OCR** — Upload PDF/image forms; extract text via OCR.
2. **Form Requirement Extraction** — Structured extraction of requirements with RAG.
3. **Document Vault** — Upload, store (encrypted), extract metadata from personal documents.
4. **Semantic Matching** — Match form requirements with vault documents.
5. **Deterministic Rule Engine** — Expiry checks, mandatory/optional evaluation, eligibility logic.
6. **Checklist Generation** — Personalized checklist with statuses.
7. **LLM Explanations** — Plain-English explanations citing form clauses.
8. **Explainability / Audit Trail** — Decision transparency for every item.
9. **Local-Only Architecture** — All processing on user's device.

### Supported Document Types (MVP)

Aadhaar, PAN Card, Passport, Voter ID, Driving License, Domicile Certificate, Birth Certificate, Caste Certificate, Income Certificate, 10th Marksheet, 12th Marksheet, Degree Certificate, Bank Statement, ITR Acknowledgment, Address Proof (utility bill).

### Supported Form Types (MVP)

- Passport application (new/renewal)
- University admission form (generic)
- Bank account opening form (generic)
- Government scheme application (generic)

### P1 Enhancements (v1.x)

- Confidence scores on all extractions
- Document preview in vault
- Checklist export as PDF
- Batch document upload
- Search and filter in vault
- Checklist grouped by category
- Configurable rule definitions (YAML)

### P2 / Future (v2.0+)

- Hindi language explanations
- DigiLocker integration
- Multi-user support with role-based access
- Form template library (pre-analyzed common forms)
- Mobile-responsive progressive web app
- Cloud LLM opt-in mode
- Voice-based interaction for low-literacy users
- Regional language support beyond Hindi

---

## 14. Assumptions, Constraints, Dependencies & Risks

### Assumptions

| # | Assumption |
|---|-----------|
| A1 | Users have a device capable of running a local LLM (≥ 8 GB RAM, modern CPU; GPU optional but recommended). |
| A2 | Forms are primarily in English (MVP). Regional language support is deferred. |
| A3 | Users are willing to set up a local application (Python + Ollama). |
| A4 | Scanned documents are of reasonable quality (≥ 200 DPI). |
| A5 | The deterministic rule engine's rule database covers the 4 MVP form types adequately. |
| A6 | Semantic matching with local embedding models provides sufficient accuracy for standard Indian documents. |

### Constraints

| # | Constraint |
|---|-----------|
| C1 | All processing must be local — no PII may leave the user's device. |
| C2 | LLM must run locally (Ollama-based). No cloud LLM APIs in MVP. |
| C3 | MVP targets desktop/laptop (not mobile-first). |
| C4 | Budget: open-source models and libraries only. |
| C5 | Single-user application in MVP (no multi-tenancy). |

### Dependencies

| # | Dependency | Risk Level |
|---|-----------|-----------|
| D1 | Tesseract OCR accuracy on Indian documents | Medium |
| D2 | Ollama stability and model availability | Low |
| D3 | Sentence-Transformer model quality for Indian document matching | Medium |
| D4 | Python ecosystem stability (FastAPI, SQLite, etc.) | Low |

### Risks & Mitigations

| # | Risk | Impact | Likelihood | Mitigation |
|---|------|--------|-----------|------------|
| R1 | OCR accuracy too low on poor-quality scans | High | Medium | Allow manual text correction; show confidence scores; recommend re-scan |
| R2 | Local LLM produces hallucinated explanations | High | Medium | LLM is explanation-only; deterministic engine makes decisions; show source clauses for verification |
| R3 | Semantic matching fails for unusual document types | Medium | Medium | Fallback to keyword matching; user override for matches; maintain synonym dictionary |
| R4 | User's hardware cannot run local LLM | High | Low | Provide minimum specs; offer "rule-engine only" mode without LLM explanations |
| R5 | Rule engine doesn't cover edge cases for specific forms | Medium | Medium | Configurable rules; "Needs Review" fallback status; user correction workflow |
| R6 | Users find setup too complex (Ollama + Python) | Medium | Medium | Provide one-click installer script; Docker option; detailed setup guide |

---

## Appendix: UNESCO AI Ethics Alignment

| Principle | Implementation |
|-----------|---------------|
| **Privacy & Data Governance** | All data local; AES-256 encryption; no external transmission |
| **Transparency** | Explainable decisions; audit trail; source clause citation |
| **Human Oversight** | User can review, correct, and override all AI outputs |
| **Non-Discrimination** | Rule engine is condition-based, not profile-based; no scoring that could discriminate |
| **Accountability** | Audit logs; deterministic rule engine for critical decisions |
| **Data Minimization** | Only metadata extracted; original documents encrypted; no data retained beyond user's control |

---

*End of PRD*
