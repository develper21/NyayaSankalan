# Data Flow Diagram - NyayaSankalan

> Level-0 and Level-1 Data Flow Diagrams (Textual Representation)

---

## Level-0 DFD (Context Diagram)

### Overview

The Level-0 DFD shows the system as a single process with external entities (actors) and data flows between them.

```
┌─────────────┐                                      ┌─────────────┐
│   POLICE    │                                      │    COURT    │
│   OFFICER   │                                      │    CLERK    │
└──────┬──────┘                                      └──────┬──────┘
       │                                                    │
       │  FIR Data, Evidence,                              │  Acknowledgment,
       │  Investigation Events,                            │  Defect Notes
       │  Documents                                        │
       │                                                    │
       ▼                                                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                       NYAYASANKALAN                              │
│                  Case Management System                          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
       ▲                                                    ▲
       │                                                    │
       │  Case Assignment,                                 │  Judgment,
       │  Document Requests                                │  Court Orders,
       │  Approval/Rejection                               │  Reopen Decisions
       │                                                    │
       │                                                    │
┌──────┴──────┐                                      ┌──────┴──────┐
│     SHO     │                                      │    JUDGE    │
│             │                                      │             │
└─────────────┘                                      └─────────────┘
```

---

## External Entities (Actors)

| Entity | Type | Description |
|--------|------|-------------|
| **Police Officer** | Human Actor | Investigating officer who registers FIRs, collects evidence, records investigation events, and prepares documents |
| **SHO (Station House Officer)** | Human Actor | Police station head who assigns cases, approves document requests, and submits cases to court |
| **Court Clerk** | Human Actor | Court administrative staff who receives submissions, reviews for completeness, and records acknowledgments |
| **Judge** | Human Actor | Judicial officer who accepts cases, conducts trials, delivers judgments, and approves case reopening |

---

## Data Flows - Incoming to System

| # | From Entity | Data Flow | Description |
|---|-------------|-----------|-------------|
| 1 | Police Officer | FIR Registration Data | FIR number, incident date, sections, FIR document |
| 2 | Police Officer | Investigation Events | Search, seizure, statement, transfer records |
| 3 | Police Officer | Evidence Files | Photos, reports, forensic data, statements |
| 4 | Police Officer | Witness Records | Name, contact, address, statement files |
| 5 | Police Officer | Accused Records | Name, status (arrested/bail/absconding) |
| 6 | Police Officer | Document Content | Charge sheet, evidence list, witness list |
| 7 | Police Officer | Document Requests | Warrant requests, remand applications |
| 8 | Police Officer | Case Reopen Requests | Request to reopen closed cases |
| 9 | SHO | Case Assignment | Officer assignment with reason |
| 10 | SHO | Court Submission | Case package submitted to court |
| 11 | SHO | Request Approvals | Approval/rejection of document requests |
| 12 | Court Clerk | Submission Review | Accept or return with defects |
| 13 | Court Clerk | Acknowledgment | Receipt confirmation for submissions |
| 14 | Judge | Court Actions | Cognizance, charges, hearings, judgment |
| 15 | Judge | Reopen Decisions | Approval/rejection of reopen requests |
| 16 | Judge | Final Judgment | Conviction, acquittal, sentence |

---

## Data Flows - Outgoing from System

| # | To Entity | Data Flow | Description |
|---|-----------|-----------|-------------|
| 1 | Police Officer | Case Details | Assigned cases with full history |
| 2 | Police Officer | Request Status | Status of document requests |
| 3 | Police Officer | Validation Errors | Missing documents or incomplete data |
| 4 | Police Officer | Notifications | Assignment notifications, deadlines |
| 5 | SHO | Station Cases | All cases in police station |
| 6 | SHO | Pending Requests | Document requests awaiting approval |
| 7 | SHO | Submission Status | Court acceptance/rejection |
| 8 | Court Clerk | Incoming Submissions | Cases submitted for review |
| 9 | Court Clerk | Case Documents | All documents in case package |
| 10 | Judge | Trial Cases | Cases in trial phase |
| 11 | Judge | Reopen Requests | Pending reopen requests for decision |
| 12 | Judge | Case History | Complete case timeline and evidence |
| 13 | All Users | PDF Documents | Generated charge sheets, reports |
| 14 | All Users | Audit Logs | Action history for accountability |

---

## Data Stores

| Store | Description | Key Data |
|-------|-------------|----------|
| **D1: Users** | All system users | ID, name, email, role, organization |
| **D2: Police Stations** | Police station registry | ID, name, district, state |
| **D3: Courts** | Court registry | ID, name, type, district, state |
| **D4: FIRs** | First Information Reports | FIR number, incident date, sections |
| **D5: Cases** | Case records | Case ID, FIR link, state, timestamps |
| **D6: Case States** | Current and historical states | State, timestamp, changed by |
| **D7: Evidence** | Evidence files | Category, file URL, uploader |
| **D8: Witnesses** | Witness records | Name, contact, statement |
| **D9: Accused** | Accused persons | Name, status, bail records |
| **D10: Documents** | Case documents | Type, version, content, status |
| **D11: Court Submissions** | Submission records | Status, court, documents |
| **D12: Court Actions** | Court proceedings | Action type, date, order |
| **D13: Audit Logs** | System audit trail | User, action, timestamp, IP |
| **D14: File Storage** | Binary files (Cloudinary) | Evidence, documents, FIR scans |

---

## Level-1 DFD - Process Decomposition

### Process 1: FIR & Case Management

```
┌─────────────┐        FIR Data         ┌───────────────────────┐
│   POLICE    │ ───────────────────────▶│  1.1 Register FIR     │
│   OFFICER   │                         └───────────┬───────────┘
└─────────────┘                                     │
                                                    │ FIR Record
                                                    ▼
                                         ┌───────────────────────┐
                                         │  1.2 Create Case      │
                                         └───────────┬───────────┘
                                                    │
                                                    │ Case Record
                                                    ▼
                                              ┌──────────┐
                                              │ D5:Cases │
                                              └──────────┘
```

**Data Flows:**
- Police Officer → 1.1: FIR number, incident date, sections, document file
- 1.1 → D4: Store FIR record
- 1.1 → 1.2: Trigger case creation
- 1.2 → D5: Store case record with initial state
- 1.2 → D6: Store initial case state (FIR_REGISTERED)

---

### Process 2: Case Assignment

```
┌─────────────┐      Assignment Data     ┌───────────────────────┐
│     SHO     │ ────────────────────────▶│  2.1 Assign Case      │
└─────────────┘                          └───────────┬───────────┘
                                                    │
      ┌──────────┐                                  │ Assignment Record
      │ D5:Cases │◀────────────────────────────────┘
      └──────────┘                                  │
                                                    ▼
                                         ┌───────────────────────┐
                                         │  2.2 Update State     │
                                         └───────────┬───────────┘
                                                    │
                                                    │ State Change
                                                    ▼
                                              ┌──────────┐
                                              │ D6:States│
                                              └──────────┘
```

**Data Flows:**
- SHO → 2.1: Officer ID, assignment reason
- D5 → 2.1: Current case data
- 2.1 → D5: Update case assignments
- 2.1 → 2.2: Trigger state transition
- 2.2 → D6: Record state change (FIR_REGISTERED → CASE_ASSIGNED)

---

### Process 3: Investigation Management

```
┌─────────────┐      Investigation Data  ┌───────────────────────┐
│   POLICE    │ ────────────────────────▶│  3.1 Record Events    │
│   OFFICER   │                          └───────────┬───────────┘
└──────┬──────┘                                     │
       │                                            │ Event Records
       │ Evidence Files                             ▼
       │                                     ┌─────────────┐
       ▼                                     │ D7:Evidence │
┌───────────────────────┐                   └─────────────┘
│  3.2 Upload Evidence  │
└───────────┬───────────┘
            │
            │ File URL
            ▼
     ┌─────────────┐
     │D14:Cloudinary│
     └─────────────┘
```

**Data Flows:**
- Police Officer → 3.1: Event type, description, date
- 3.1 → Investigation Events table
- Police Officer → 3.2: Binary file (photo, document, video)
- 3.2 → D14 (Cloudinary): Store file, get URL
- 3.2 → D7: Store evidence metadata with URL

---

### Process 4: Document Generation

```
┌─────────────┐      Document Content    ┌───────────────────────┐
│   POLICE    │ ────────────────────────▶│  4.1 Create Document  │
│   OFFICER   │                          └───────────┬───────────┘
└─────────────┘                                     │
                                                    │ Document Record
      ┌───────────┐                                 ▼
      │D10:Docs   │◀───────────────────────────────┘
      └───────────┘
            │
            │ Document Data
            ▼
┌───────────────────────┐        PDF File      ┌─────────────┐
│  4.2 Generate PDF     │ ────────────────────▶│D14:Cloudinary│
└───────────────────────┘                      └─────────────┘
```

**Data Flows:**
- Police Officer → 4.1: Document type, content JSON
- 4.1 → D10: Store document with version, status
- D10 → 4.2: Retrieve document content
- 4.2 → D14: Store generated PDF
- 4.2 → Police Officer: PDF URL for download

---

### Process 5: Court Submission

```
┌─────────────┐      Submission Request  ┌───────────────────────┐
│     SHO     │ ────────────────────────▶│  5.1 Validate Docs    │
└─────────────┘                          └───────────┬───────────┘
                                                    │
      ┌───────────┐                                 │ Validation Result
      │D10:Docs   │────────────────────────────────▶│
      └───────────┘                                 │
                                                    ▼
                                         ┌───────────────────────┐
                                         │  5.2 Create Submission│
                                         └───────────┬───────────┘
                                                    │
                                                    │ Submission Record
                                                    ▼
                                         ┌───────────────────────┐
                                         │ D11:Submissions       │
                                         └───────────────────────┘
```

**Data Flows:**
- SHO → 5.1: Submit request with court ID
- D10 → 5.1: All case documents
- 5.1: Validate mandatory documents present
- 5.1 → SHO (if invalid): Validation errors
- 5.1 → 5.2 (if valid): Proceed with submission
- 5.2 → D11: Create submission record
- 5.2 → D6: Update state (→ SUBMITTED_TO_COURT)

---

### Process 6: Court Processing

```
┌─────────────┐      Review Decision     ┌───────────────────────┐
│ COURT CLERK │ ────────────────────────▶│  6.1 Review Submission│
└─────────────┘                          └───────────┬───────────┘
                                                    │
      ┌───────────────┐                             │
      │D11:Submissions│◀────────────────────────────┤
      └───────────────┘                             │
                                         ┌──────────┴──────────┐
                                         ▼                     ▼
                              ┌─────────────────┐   ┌─────────────────┐
                              │ 6.2 Accept      │   │ 6.3 Return      │
                              └────────┬────────┘   └────────┬────────┘
                                       │                     │
                                       ▼                     ▼
                              ┌─────────────────┐   ┌─────────────────┐
                              │ D6: State =     │   │ D6: State =     │
                              │ COURT_ACCEPTED  │   │ RETURNED_FOR_   │
                              └─────────────────┘   │ DEFECTS         │
                                                   └─────────────────┘
```

**Data Flows:**
- D11 → Court Clerk: Pending submissions
- Court Clerk → 6.1: Review decision (accept/reject)
- 6.2 (if accept): Update submission status, generate acknowledgment
- 6.3 (if return): Add defect notes, notify SHO

---

### Process 7: Trial & Judgment

```
┌─────────────┐      Court Action        ┌───────────────────────┐
│    JUDGE    │ ────────────────────────▶│  7.1 Record Action    │
└─────────────┘                          └───────────┬───────────┘
                                                    │
                                                    │ Action Record
                                                    ▼
                                         ┌───────────────────────┐
                                         │ D12: Court Actions    │
                                         └───────────────────────┘
                                                    │
                                                    │ (if Judgment)
                                                    ▼
                                         ┌───────────────────────┐
                                         │  7.2 Dispose Case     │
                                         └───────────┬───────────┘
                                                    │
                                                    │ Final State
                                                    ▼
                                         ┌───────────────────────┐
                                         │ D6: State = DISPOSED  │
                                         └───────────────────────┘
```

**Data Flows:**
- Judge → 7.1: Action type, description, order document
- 7.1 → D12: Store court action
- 7.1 → D6: Update case state (TRIAL_ONGOING)
- 7.2 (on judgment): Finalize case, store judgment
- 7.2 → D6: Update state (DISPOSED)

---

## AI Module Data Flows

```
┌─────────────┐      Document Image      ┌───────────────────────┐
│    USER     │ ────────────────────────▶│  AI.1 OCR Extract     │
└─────────────┘                          └───────────┬───────────┘
                                                    │
                                                    │ Extracted Text
                                                    ▼
                                         ┌───────────────────────┐
                                         │  AI.2 NER Process     │
                                         └───────────┬───────────┘
                                                    │
                                                    │ Entities + Redacted Text
                                                    ▼
                                         ┌───────────────────────┐
                                         │  AI.3 Generate Draft  │
                                         └───────────┬───────────┘
                                                    │
                                                    │ Draft Document
                                                    ▼
                                         ┌───────────────────────┐
                                         │  Storage (JSON)       │
                                         └───────────────────────┘
```

**AI Data Flows:**
| Step | Input | Process | Output |
|------|-------|---------|--------|
| AI.1 | Image/PDF file | pytesseract OCR, pdfplumber | Extracted text string |
| AI.2 | Text string | spaCy NER, regex patterns | Entities (names, dates, sections, phones), Redacted text |
| AI.3 | Redacted text | HuggingFace API / FLAN-T5 | Charge sheet draft |
| AI.4 | Multiple texts | sentence-transformers | Vector embeddings |
| AI.5 | Query string | FAISS similarity search | Similar documents |

---

## Data Flow Summary Matrix

| Process | Inputs | Outputs | Data Stores Affected |
|---------|--------|---------|---------------------|
| FIR Registration | FIR data, document | Case record | D4, D5, D6 |
| Case Assignment | Officer ID, reason | Assignment record | D5, D6 |
| Investigation | Events, evidence, witnesses | Investigation records | D5, D7, D8, D9 |
| Document Prep | Content JSON | Document record, PDF | D10, D14 |
| Court Submission | Submission request | Submission record | D11, D6 |
| Court Review | Decision | Acknowledgment/defects | D11, D6 |
| Trial | Court actions | Action records | D12, D6 |
| Judgment | Final decision | Disposed state | D6, D5 |

---

## Conclusion

This Data Flow Diagram demonstrates:

1. **Clear Actor Separation** - Four distinct user roles with specific data flows
2. **Data Store Organization** - 14 logical data stores covering all entities
3. **Process Decomposition** - 7 major processes with clear inputs/outputs
4. **AI Integration** - Separate AI module with defined data transformations
5. **Audit Trail** - D13 captures all actions for accountability
6. **External Storage** - D14 (Cloudinary) for binary file management
