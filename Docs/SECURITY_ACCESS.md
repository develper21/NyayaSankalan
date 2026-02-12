# Security & Access Control - NyayaSankalan

> Role-based access control matrix with justifications for restricted actions

---

## Overview

NyayaSankalan implements a **Role-Based Access Control (RBAC)** model with four distinct user roles mapped to the Indian criminal justice system hierarchy.

---

## User Roles

| Role | Full Name | Organization Type | Description |
|------|-----------|-------------------|-------------|
| `POLICE` | Police Officer | POLICE_STATION | Investigating officer who handles day-to-day case work |
| `SHO` | Station House Officer | POLICE_STATION | Police station head with supervisory authority |
| `COURT_CLERK` | Court Clerk | COURT | Court administrative staff handling paperwork |
| `JUDGE` | Judge | COURT | Judicial officer with final authority on cases |

---

## Access Control Matrix

### Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Full Access |
| 📖 | Read Only |
| ❌ | No Access |
| ⚠️ | Conditional Access |

---

### FIR Management

| Action | POLICE | SHO | COURT_CLERK | JUDGE |
|--------|--------|-----|-------------|-------|
| Register new FIR | ✅ | ✅ | ❌ | ❌ |
| View own station FIRs | ✅ | ✅ | ❌ | ❌ |
| View all FIRs | ❌ | ✅ | 📖 | 📖 |
| Edit FIR (before assignment) | ✅ | ✅ | ❌ | ❌ |
| Edit FIR (after assignment) | ❌ | ⚠️ | ❌ | ❌ |
| Delete FIR | ❌ | ❌ | ❌ | ❌ |
| Upload FIR document | ✅ | ✅ | ❌ | ❌ |

**Justifications:**
- FIR registration is a police function per CrPC Section 154
- FIRs cannot be deleted once registered (legal document)
- Edit restrictions prevent tampering after case assignment

---

### Case Management

| Action | POLICE | SHO | COURT_CLERK | JUDGE |
|--------|--------|-----|-------------|-------|
| View assigned cases | ✅ | ✅ | ❌ | ❌ |
| View station cases | 📖 | ✅ | ❌ | ❌ |
| View court cases | ❌ | ❌ | ✅ | ✅ |
| View all cases | ❌ | ❌ | ❌ | ✅ |
| Assign case to officer | ❌ | ✅ | ❌ | ❌ |
| Reassign case | ❌ | ✅ | ❌ | ❌ |
| Update case state | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| Archive case | ❌ | ❌ | ✅ | ✅ |

**State Transition Permissions:**

| From State | To State | POLICE | SHO | COURT_CLERK | JUDGE |
|------------|----------|--------|-----|-------------|-------|
| FIR_REGISTERED | CASE_ASSIGNED | ❌ | ✅ | ❌ | ❌ |
| CASE_ASSIGNED | UNDER_INVESTIGATION | ✅ | ✅ | ❌ | ❌ |
| UNDER_INVESTIGATION | INVESTIGATION_PAUSED | ✅ | ✅ | ❌ | ❌ |
| UNDER_INVESTIGATION | INVESTIGATION_COMPLETED | ✅ | ✅ | ❌ | ❌ |
| INVESTIGATION_COMPLETED | CHARGE_SHEET_PREPARED | ✅ | ✅ | ❌ | ❌ |
| INVESTIGATION_COMPLETED | CLOSURE_REPORT_PREPARED | ✅ | ✅ | ❌ | ❌ |
| CHARGE_SHEET_PREPARED | SUBMITTED_TO_COURT | ❌ | ✅ | ❌ | ❌ |
| SUBMITTED_TO_COURT | COURT_ACCEPTED | ❌ | ❌ | ✅ | ✅ |
| SUBMITTED_TO_COURT | RETURNED_FOR_DEFECTS | ❌ | ❌ | ✅ | ✅ |
| RETURNED_FOR_DEFECTS | RESUBMITTED_TO_COURT | ❌ | ✅ | ❌ | ❌ |
| COURT_ACCEPTED | TRIAL_ONGOING | ❌ | ❌ | ❌ | ✅ |
| TRIAL_ONGOING | JUDGMENT_RESERVED | ❌ | ❌ | ❌ | ✅ |
| JUDGMENT_RESERVED | DISPOSED | ❌ | ❌ | ❌ | ✅ |
| DISPOSED | ARCHIVED | ❌ | ❌ | ✅ | ✅ |

**Justifications:**
- SHO is responsible for station operations and case assignments
- Court submission requires SHO authority (accountable officer)
- Trial and judgment are exclusive judicial functions
- State transitions follow CrPC procedures

---

### Investigation Management

| Action | POLICE | SHO | COURT_CLERK | JUDGE |
|--------|--------|-----|-------------|-------|
| Add investigation event | ✅ | ✅ | ❌ | ❌ |
| View investigation events | ✅ | ✅ | 📖 | 📖 |
| Edit investigation event | ✅ | ✅ | ❌ | ❌ |
| Delete investigation event | ❌ | ⚠️ | ❌ | ❌ |
| Upload evidence | ✅ | ✅ | ❌ | ❌ |
| View evidence | ✅ | ✅ | 📖 | 📖 |
| Delete evidence | ❌ | ❌ | ❌ | ❌ |
| Add witness | ✅ | ✅ | ❌ | ❌ |
| Edit witness | ✅ | ✅ | ❌ | ❌ |
| Add accused | ✅ | ✅ | ❌ | ❌ |
| Update accused status | ✅ | ✅ | ❌ | ❌ |

**Justifications:**
- Investigation is exclusively a police function
- Evidence cannot be deleted (chain of custody)
- Court has read-only access for trial purposes
- SHO can delete events only with documented reason (audit logged)

---

### Document Management

| Action | POLICE | SHO | COURT_CLERK | JUDGE |
|--------|--------|-----|-------------|-------|
| Create charge sheet | ✅ | ✅ | ❌ | ❌ |
| Create closure report | ✅ | ✅ | ❌ | ❌ |
| Create evidence list | ✅ | ✅ | ❌ | ❌ |
| Create witness list | ✅ | ✅ | ❌ | ❌ |
| Edit document (DRAFT) | ✅ | ✅ | ❌ | ❌ |
| Finalize document | ✅ | ✅ | ❌ | ❌ |
| Edit document (FINAL) | ❌ | ⚠️ | ❌ | ❌ |
| Lock document | ❌ | ✅ | ❌ | ❌ |
| Edit document (LOCKED) | ❌ | ❌ | ❌ | ❌ |
| View documents | ✅ | ✅ | ✅ | ✅ |
| Generate PDF | ✅ | ✅ | ✅ | ✅ |

**Document Status Flow:**
```
DRAFT → FINAL → LOCKED
  ↑       │        │
  └───────┘        │
    (SHO only)     │
                   │
         (Immutable after lock)
```

**Justifications:**
- Documents are legal evidence; tampering must be prevented
- SHO can unlock FINAL documents with audit trail (correction scenario)
- LOCKED documents are completely immutable
- PDF generation available to all for transparency

---

### Document Requests

| Action | POLICE | SHO | COURT_CLERK | JUDGE |
|--------|--------|-----|-------------|-------|
| Create request (warrant, remand) | ✅ | ❌ | ❌ | ❌ |
| View own requests | ✅ | ✅ | ❌ | ❌ |
| View all station requests | ❌ | ✅ | ❌ | ❌ |
| Approve request (SHO level) | ❌ | ✅ | ❌ | ❌ |
| Reject request | ❌ | ✅ | ✅ | ✅ |
| Issue document | ❌ | ✅ | ✅ | ✅ |

**Request Status Flow:**
```
REQUESTED → SHO_APPROVED → ISSUED
     ↓           ↓
  REJECTED   REJECTED
```

**Justifications:**
- Police officers initiate requests as they identify needs during investigation
- SHO approval ensures proper oversight before court involvement
- Court can directly issue for urgent matters

---

### Court Submissions

| Action | POLICE | SHO | COURT_CLERK | JUDGE |
|--------|--------|-----|-------------|-------|
| Submit case to court | ❌ | ✅ | ❌ | ❌ |
| View submission status | 📖 | ✅ | ✅ | ✅ |
| Accept submission | ❌ | ❌ | ✅ | ✅ |
| Return for defects | ❌ | ❌ | ✅ | ✅ |
| Resubmit case | ❌ | ✅ | ❌ | ❌ |
| Generate acknowledgment | ❌ | ❌ | ✅ | ✅ |

**Justifications:**
- SHO is the accountable officer for court submissions
- Court clerk handles administrative intake
- Judge has override authority for all court functions
- Police officers have visibility but no submission authority

---

### Court Actions (Trial Phase)

| Action | POLICE | SHO | COURT_CLERK | JUDGE |
|--------|--------|-----|-------------|-------|
| Record cognizance | ❌ | ❌ | ✅ | ✅ |
| Frame charges | ❌ | ❌ | ❌ | ✅ |
| Record hearing | ❌ | ❌ | ✅ | ✅ |
| Deliver judgment | ❌ | ❌ | ❌ | ✅ |
| Pronounce sentence | ❌ | ❌ | ❌ | ✅ |
| Record acquittal | ❌ | ❌ | ❌ | ✅ |
| Record conviction | ❌ | ❌ | ❌ | ✅ |
| View court actions | 📖 | 📖 | ✅ | ✅ |

**Justifications:**
- Judicial functions are exclusive to judges per Constitution of India
- Court clerk can record procedural matters (cognizance, hearing dates)
- Substantive orders (charges, judgment, sentence) are judge-only
- Police have read access for case tracking

---

### Case Reopen Requests

| Action | POLICE | SHO | COURT_CLERK | JUDGE |
|--------|--------|-----|-------------|-------|
| Request case reopen | ✅ | ✅ | ❌ | ❌ |
| View reopen requests | ✅ | ✅ | 📖 | ✅ |
| Approve reopen | ❌ | ❌ | ❌ | ✅ |
| Reject reopen | ❌ | ❌ | ❌ | ✅ |

**Justifications:**
- Reopening a closed case has significant legal implications
- Only judicial authority can authorize case reopening
- Police can request with documented reasons
- This prevents misuse of closure and reopening

---

### Bail Management

| Action | POLICE | SHO | COURT_CLERK | JUDGE |
|--------|--------|-----|-------------|-------|
| Record bail application | ✅ | ✅ | ✅ | ✅ |
| Grant police bail | ❌ | ✅ | ❌ | ❌ |
| Grant court bail | ❌ | ❌ | ❌ | ✅ |
| Grant anticipatory bail | ❌ | ❌ | ❌ | ✅ |
| Reject bail | ❌ | ✅ | ❌ | ✅ |
| View bail records | ✅ | ✅ | ✅ | ✅ |

**Justifications:**
- SHO can grant station bail per CrPC Section 436
- Court bail requires judicial order
- Anticipatory bail is exclusively judicial (CrPC Section 438)
- All parties need visibility for case management

---

### Audit & Logging

| Action | POLICE | SHO | COURT_CLERK | JUDGE |
|--------|--------|-----|-------------|-------|
| View own audit logs | ✅ | ✅ | ✅ | ✅ |
| View station audit logs | ❌ | ✅ | ❌ | ❌ |
| View court audit logs | ❌ | ❌ | ✅ | ✅ |
| View all audit logs | ❌ | ❌ | ❌ | ✅ |
| Export audit logs | ❌ | ✅ | ✅ | ✅ |
| Delete audit logs | ❌ | ❌ | ❌ | ❌ |

**Justifications:**
- Audit logs are tamper-proof; no deletion allowed
- Each role can view their own actions
- Supervisors (SHO, Judge) can view subordinate logs
- Judge has complete visibility for oversight

---

### AI Module Access

| Action | POLICE | SHO | COURT_CLERK | JUDGE |
|--------|--------|-----|-------------|-------|
| Upload document for OCR | ✅ | ✅ | ❌ | ❌ |
| View extracted entities | ✅ | ✅ | 📖 | 📖 |
| Generate draft document | ✅ | ✅ | ❌ | ❌ |
| Edit AI-generated draft | ✅ | ✅ | ❌ | ❌ |
| Semantic search | ✅ | ✅ | ✅ | ✅ |
| Rebuild search index | ❌ | ✅ | ❌ | ❌ |

**Justifications:**
- AI tools assist investigation, primarily a police function
- Search is available to all for case research
- Index management requires supervisory authority

---

## Judge-Only Actions (Critical)

The following actions are restricted to JUDGE role only:

| Action | Justification |
|--------|---------------|
| **Frame Charges** | Judicial act per CrPC Section 228 |
| **Deliver Judgment** | Constitutional function of judiciary |
| **Pronounce Sentence** | Only judge can determine punishment |
| **Record Conviction** | Legal finding requiring judicial authority |
| **Record Acquittal** | Legal finding requiring judicial authority |
| **Approve Case Reopen** | Significant legal implications |
| **Grant Court/Anticipatory Bail** | Judicial discretion per CrPC |
| **Start Trial** | Transition to TRIAL_ONGOING state |
| **Reserve Judgment** | Transition to JUDGMENT_RESERVED state |
| **Dispose Case** | Transition to DISPOSED state |

**Legal Basis:**
- Article 50 of the Constitution of India mandates separation of judiciary from executive
- Judicial functions cannot be delegated to administrative staff
- These restrictions ensure rule of law and due process

---

## SHO-Only Actions

| Action | Justification |
|--------|---------------|
| **Assign Cases** | Station-level management responsibility |
| **Submit to Court** | Accountable officer per police manual |
| **Approve Document Requests** | Supervisory oversight |
| **Grant Station Bail** | CrPC Section 436 authority |
| **Lock Documents** | Finalization authority |
| **Resubmit to Court** | Post-defect correction authority |

---

## Organization-Based Access

Beyond role-based access, users are restricted by organization:

| User Role | Sees Cases From |
|-----------|-----------------|
| POLICE | Own assigned cases only |
| SHO | All cases in their police station |
| COURT_CLERK | All cases submitted to their court |
| JUDGE | All cases in their court + cross-court visibility |

**Implementation:**
```typescript
// Query filter based on organization
if (user.role === 'POLICE') {
  where.assignments = { some: { assignedTo: user.id } };
} else if (user.role === 'SHO') {
  where.fir = { policeStationId: user.organizationId };
} else if (user.role === 'COURT_CLERK') {
  where.courtSubmissions = { some: { courtId: user.organizationId } };
} else if (user.role === 'JUDGE') {
  // Full access to court cases
}
```

---

## Audit Trail

Every action is logged:

| Field | Description |
|-------|-------------|
| `userId` | User who performed action |
| `action` | Action type (CREATE, UPDATE, DELETE, VIEW) |
| `entityType` | Affected entity (CASE, DOCUMENT, etc.) |
| `entityId` | Specific entity ID |
| `oldValue` | Previous state (for updates) |
| `newValue` | New state (for updates) |
| `ipAddress` | User's IP address |
| `timestamp` | Action timestamp |

**Sample Audit Entry:**
```json
{
  "userId": "uuid-of-judge",
  "action": "UPDATE",
  "entityType": "CASE_STATE",
  "entityId": "case-uuid",
  "oldValue": { "state": "TRIAL_ONGOING" },
  "newValue": { "state": "DISPOSED" },
  "ipAddress": "192.168.1.100",
  "timestamp": "2025-12-31T10:30:00Z"
}
```

---

## Security Implementation

### Middleware Stack

```typescript
// Route protection pattern
router.post(
  '/cases/:id/judgment',
  authenticate,                    // JWT verification
  authorize('JUDGE'),              // Role check
  validateOrganization,            // Court ownership check
  validateCaseState('TRIAL_ONGOING', 'JUDGMENT_RESERVED'), // State check
  validate(judgmentSchema),        // Input validation
  auditLog('JUDGMENT'),            // Audit logging
  caseController.recordJudgment    // Controller
);
```

### Error Responses

| Scenario | HTTP Status | Error Code |
|----------|-------------|------------|
| No token provided | 401 | AUTH_TOKEN_MISSING |
| Invalid token | 401 | AUTH_TOKEN_INVALID |
| Token expired | 401 | AUTH_TOKEN_EXPIRED |
| Insufficient role | 403 | FORBIDDEN_ROLE |
| Wrong organization | 403 | FORBIDDEN_ORGANIZATION |
| Invalid state transition | 400 | INVALID_STATE_TRANSITION |

---

## Conclusion

This RBAC model ensures:

1. **Separation of Powers** - Police and judicial functions are distinct
2. **Accountability** - Every action is logged and traceable
3. **Least Privilege** - Users have minimum necessary access
4. **Legal Compliance** - Follows CrPC and constitutional mandates
5. **Data Integrity** - Critical documents and decisions are protected
