# Public Service Form Copilot - Technical Documentation

## 1. Project Overview
**Public Service Form Copilot** is a privacy-first, local-only application designed to assist users in managing physical documents and navigating complex public service applications (such as Passports, VISAs, and University Admissions). 

The system solves the problem of manual requirement mapping by allowing users to securely deposit their documents into an encrypted vault, upload official PDF forms for analysis, and automatically generate a readiness checklist that deterministically matches required documents against the user's vault, all without relying on cloud storage or external internet APIs.

---

## 2. Technology Stack
*   **Frontend**: React 19, TypeScript, Tailwind CSS 3.4, Vite 6, React Router DOM, Axios.
*   **Backend**: Java 21, Spring Boot 3.4.1 (WebMVC, Data JPA, Security).
*   **Database**: SQLite (via `sqlite-jdbc` and `hibernate-community-dialects`).
*   **Encryption**: BouncyCastle (`bcprov-jdk18on`) for AES-256-GCM encryption of vaulted files.
*   **PDF Processing**: Apache PDFBox 3.0 for PDF text extraction and checklist generation.
*   **AI/LLM**: Local Ollama instance (`llama3.2` model) via REST for plain-English rule simplification.
*   **Authentication**: None. The system relies entirely on being local-first. Spring Security is explicitly configured to permit all requests.
*   **Build System**: Maven (`pom.xml` orchestrates both backend and frontend builds using `exec-maven-plugin`).

---

## 3. System Architecture
The application uses a **Modular Monolith** architecture:
*   **Frontend Integration**: The React application is built via Vite and copied into the Spring Boot backend's `src/main/resources/static` directory during the Maven build phase. The backend serves the frontend as static assets, utilizing a `ForwardController` to handle React SPA routing.
*   **Data Storage**: Application metadata and structured data are stored in a local SQLite file (`copilot_local.db`).
*   **Secure Storage**: Uploaded files are immediately encrypted using a static AES key via `CryptoService` and stored directly on the host file system in the `vault_storage/` directory.
*   **AI Services**: Rather than calling an external OpenAI API, the backend makes HTTP POST requests to `http://localhost:11434` (Ollama) to perform rule-simplification transformations locally, guaranteeing complete privacy.

---

## 4. Project Structure
```
form-copilot/
├── frontend/                   # React + Vite application
│   ├── src/
│   │   ├── App.tsx             # Main layout, Routing, and Landing Page
│   │   ├── Vault.tsx           # Document vault CRUD & upload interface
│   │   ├── Forms.tsx           # Form listing and PDF upload page
│   │   ├── FormDetail.tsx      # Extracted requirements list
│   │   └── Checklist.tsx       # Final generated readiness checklist
│   └── package.json            
├── backend/                    # Spring Boot backend
│   ├── src/main/java/com/copilot/form_copilot/
│   │   ├── config/             # Spring Security, Async, GlobalException handlers
│   │   ├── controllers/        # REST APIs (Vault, Form, Checklist, Ollama)
│   │   ├── models/             # JPA Entities (VaultDocument, Form, etc.)
│   │   ├── repositories/       # Spring Data JPA Interfaces
│   │   └── services/           # Business logic (Crypto, OCR, SemanticMatcher, Checklist)
│   ├── src/main/resources/
│   │   └── application.yml     # Database & server configuration
│   └── pom.xml                 # Master build file coordinating frontend & backend
├── vault_storage/              # Runtime directory hosting .enc AES-encrypted files
└── copilot_local.db            # Runtime SQLite database
```

---

## 5. Key Features & Workflows

1. **Secure Document Vaulting**: 
   - User uploads a document (PDF or Image). 
   - `VaultController` buffers the file, passes it to `CryptoService` to AES-256-GCM encrypt it, and saves an `.enc` file locally.
   - `OcrService` is triggered asynchronously to extract text. If it is a PDF, Apache PDFBox extracts the raw text. Image OCR is currently simulated.
2. **Form Requirement Analysis**: 
   - User uploads a government form (PDF).
   - `FormController` isolates raw text via PDFBox.
   - A mock rule extraction engine parses the extracted string to determine specific form triggers (e.g., detecting "Passport" or "Bank") and populates `FormRequirement` entries in the DB.
3. **Smart Checklist Generation**: 
   - The user requests a checklist for a specific form.
   - `ChecklistService` iterates through form requirements. It utilizes the `SemanticMatcherService` (a curated canonical synonym dictionary) to accurately match the required document type against the user's available vault documents.
   - Deterministic rule checks (like Expiry Date logic) are executed, and `AuditLog` records are persisted to the database.
   - A summary status (`available`, `missing`, `expiring_soon`, `expired`) and next steps are generated.
4. **Local LLM Simplification**:
   - In the Checklist UI, the user clicks "Simplify with AI".
   - The React app prompts the Spring backend, which constructs a context-aware system prompt and proxies it to the local Ollama daemon for a 2-sentence breakdown of the legal jargon.
5. **PDF Export**:
   - Users can download the generated checklist as a locally composed PDF (via `ChecklistController` + PDFBox).

---

## 6. API / Backend Overview
*   **`VaultController`**: `GET /api/v1/vault`, `POST /api/v1/vault/upload`, `DELETE /api/v1/vault/{id}`, `GET /api/v1/vault/{id}/preview`. Handles encryption boundaries and file I/O.
*   **`FormController`**: `POST /api/v1/forms/analyze`, `GET /api/v1/forms`, `DELETE /api/v1/forms/{id}`. Handles PDF text extraction and mock requirement generation.
*   **`ChecklistController`**: `POST /api/v1/checklists/generate`, `GET /api/v1/checklists/{formId}`, `GET /api/v1/checklists/{formId}/export`. Invokes rule engine and PDF exports.
*   **`OllamaController`**: `POST /api/v1/llm/explain`. Handles JSON construction to interface with local `llama3.2`.
*   **`SemanticMatcherService`**: Curated Java logic containing hardcoded aliases (e.g., mapping "identity proof" -> "Aadhaar", "driving license", "pan card").
*   **`ChecklistService`**: The core rules engine evaluating semantic matches and business rules (e.g., BR-1: Aadhaar cards never expire, 90-day expiry-soon warnings).

---

## 7. Frontend Overview
*   **Premium Component Design**: Tailored using custom blob animations, glassmorphism (`backdrop-blur`), and tailored SVG icons throughout.
*   **`App.tsx`**: Main SPA shell utilizing `react-router-dom`. Contains the global navigation bar and a rich aesthetic Landing Page confirming system status.
*   **`Vault.tsx`**: Features client-side search filtering, live-polling for asynchronous OCR completion, document metadata readouts, and decryption-on-the-fly previewing.
*   **`FormDetail.tsx`**: Displays extracted requirements in a tabular format, segregating mandatory vs optional clauses and showcasing specific "source clause" rule derivations.
*   **`Checklist.tsx`**: The terminal workflow page. Renders dynamic progress bars and conditional status badges. Manages local state for async requests to the LLM explanation API.

---

## 8. Database / Data Model
The schema is generated dynamically by Hibernate against SQLite:
*   **`VaultDocument`**: `document_id` (PK, UUID), `document_type`, `holder_name`, `expiry_date`, `extracted_fields`, `ocr_confidence`, `file_path`.
*   **`Form`**: `form_id` (PK, UUID), `title`, `page_count`, `raw_text`, `status`.
*   **`FormRequirement`**: `requirement_id` (PK, UUID), `form_id` (FK), `document_type_needed`, `description`, `is_mandatory`, `category`, `source_clause`.
*   **`ChecklistItem`**: `item_id` (PK, UUID), `form_id` (FK), `requirement_id`, `matched_document_id`, `status` (Enum string), `match_confidence`, `rule_applied`, `next_steps`.
*   **`AuditLog`**: `log_id` (PK), `item_id`, `rule_id`, `result`, `input_data`, `timestamp`.

---

## 9. Setup & Running

**Prerequisites:** 
Java 21, Node 20+, Maven (via wrapper), and Ollama (optional, on port 11434).

**Build & Run:**
```bash
cd backend
# Compiles React app, moves artifacts to resources, and builds Spring JAR
./mvnw clean install -DskipTests

# Run the unified Monolith (starts server on port 8080)
java -jar target/form-copilot-0.0.1-SNAPSHOT.jar
```
Navigate to `http://localhost:8080` in your browser.

---

## 10. Current Status
The project is a **fully functioning Minimum Viable Product (MVP)**. It successfully demonstrates the complete local, privacy-first ingestion, extraction, rule evaluation, and UI display lifecycle.

**Unfinished / Mocked Implementations:**
*   **Image File OCR**: Standard PDFs work excellently via Apache PDFBox. However, image-based text extraction (e.g., JPG uploads to the Vault) has been mocked out to simulate logic without forcing heavy C++ Tesseract / ONNX library dependencies.
*   **Semantic Engine**: The `SemanticMatcherService` leverages an exact string and synonym dictionary mapped to Indian documents. True vector embedding search via `LangChain4j` has not been implemented to favor deterministic reliability.
*   **Requirement Extraction**: The extraction of Form Requirements in `FormController` is explicitly hardcoded based on identifying major buzzwords (like 'Bank' or 'Passport') rather than dynamically passing the massive PDF text chunk out to an LLM.
*   **Encryption Key Management**: `CryptoService` uses a static hardcoded memory key (`DEMO_KEY`) instead of deriving it dynamically from a user password via PBKDF2 due to the omission of authentication mechanics.
