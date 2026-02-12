# System Flow - NyayaSankalan

> Complete step-by-step workflow from FIR registration to case closure

---

## Overview

NyayaSankalan implements a **16-state case lifecycle** that mirrors the actual Criminal Procedure Code (CrPC) workflow in the Indian judicial system. Each state transition is controlled, logged, and role-restricted.

---

## Case State Machine

```
FIR_REGISTERED
       ↓
CASE_ASSIGNED
       ↓
UNDER_INVESTIGATION ←──┐
       ↓               │
INVESTIGATION_PAUSED ──┘
       ↓
INVESTIGATION_COMPLETED
       ↓
┌──────┴──────┐
↓             ↓
CHARGE_SHEET  CLOSURE_REPORT
_PREPARED     _PREPARED
└──────┬──────┘
       ↓
SUBMITTED_TO_COURT
       ↓
┌──────┴──────┐
↓             ↓
COURT_ACCEPTED  RETURNED_FOR_DEFECTS
       ↓             ↓
       ↓        RESUBMITTED_TO_COURT
       ↓             ↓
       └──────┬──────┘
              ↓
       TRIAL_ONGOING
              ↓
       JUDGMENT_RESERVED
              ↓
          DISPOSED
              ↓
┌─────────────┴─────────────┐
↓                           ↓
ARCHIVED                APPEALED
```

---

## Phase 1: FIR Registration

### Step 1.1: FIR Entry

| Attribute | Value |
|-----------|-------|
| **Actor** | Police Officer or SHO |
| **Action** | Register First Information Report |
| **System Response** | Create FIR record + Auto-create Case record |
| **State Change** | `NULL → FIR_REGISTERED` |

**Data Captured:**
- FIR Number (unique identifier)
- FIR Source (POLICE or COURT_ORDER)
- Incident Date
- IPC Sections Applied
- FIR Document URL (uploaded scan/PDF)
- Police Station ID
- Registering Officer ID

**Validation Rules:**
- FIR number must be unique per police station
- Incident date cannot be in future
- At least one IPC section required
- FIR document upload mandatory

### Step 1.2: Auto Case Creation

| Attribute | Value |
|-----------|-------|
| **Actor** | System (Automatic) |
| **Trigger** | FIR creation successful |
| **System Response** | Create Case with 1:1 FIR link |
| **State** | `FIR_REGISTERED` |

**Automated Actions:**
1. Generate unique Case ID
2. Create `CurrentCaseState` record
3. Create first `CaseStateHistory` entry
4. Initialize empty `DocumentChecklist`

---

## Phase 2: Case Assignment

### Step 2.1: SHO Assigns Investigating Officer

| Attribute | Value |
|-----------|-------|
| **Actor** | SHO (Station House Officer) |
| **Action** | Assign case to Police officer |
| **Precondition** | Case in `FIR_REGISTERED` state |
| **State Change** | `FIR_REGISTERED → CASE_ASSIGNED` |

**Data Captured:**
- Assigned Officer ID
- Assignment Reason
- Assignment Timestamp

**Business Rules:**
- Only SHO can assign cases
- Officer must belong to same police station
- Officer must have active status
- Previous assignments auto-closed (unassignedAt set)

### Step 2.2: Assignment Notification

| Attribute | Value |
|-----------|-------|
| **Actor** | System (Automatic) |
| **Action** | Notify assigned officer |
| **Audit** | Log assignment in CaseStateHistory |

---

## Phase 3: Investigation

### Step 3.1: Begin Investigation

| Attribute | Value |
|-----------|-------|
| **Actor** | Assigned Police Officer |
| **Action** | Start investigation activities |
| **State Change** | `CASE_ASSIGNED → UNDER_INVESTIGATION` |

### Step 3.2: Investigation Events

The investigating officer records multiple event types:

| Event Type | Description | Example |
|------------|-------------|---------|
| `SEARCH` | Premises searched | "Searched accused residence at 14 MG Road" |
| `SEIZURE` | Items seized | "Seized weapon (knife) from crime scene" |
| `STATEMENT` | Witness/accused statement | "Recorded statement of eyewitness Ramesh" |
| `TRANSFER` | Case transferred | "Transferred to Cyber Cell for analysis" |
| `OTHER` | Miscellaneous events | "Visited crime scene for reconstruction" |

**Data Captured per Event:**
- Event Type
- Description
- Performing Officer ID
- Event Date
- Supporting Documents (optional)

### Step 3.3: Evidence Collection

| Attribute | Value |
|-----------|-------|
| **Actor** | Police Officer |
| **Action** | Upload evidence files |
| **Storage** | Cloudinary (secure CDN) |

**Evidence Categories:**
| Category | Examples |
|----------|----------|
| `PHOTO` | Crime scene photos, injury photos |
| `REPORT` | Forensic reports, medical reports |
| `FORENSIC` | DNA analysis, fingerprint reports |
| `STATEMENT` | Written statements, confessions |

### Step 3.4: Witness Management

| Attribute | Value |
|-----------|-------|
| **Actor** | Police Officer |
| **Action** | Add witness records |

**Data Captured:**
- Witness Name
- Contact Number (optional)
- Address (optional)
- Statement File URL (optional)

### Step 3.5: Accused Management

| Attribute | Value |
|-----------|-------|
| **Actor** | Police Officer |
| **Action** | Add accused persons |

**Accused Statuses:**
| Status | Description |
|--------|-------------|
| `ARRESTED` | In police/judicial custody |
| `ON_BAIL` | Released on bail |
| `ABSCONDING` | Whereabouts unknown |

### Step 3.6: Investigation Pause/Resume

| Attribute | Value |
|-----------|-------|
| **Actor** | Police Officer or SHO |
| **Action** | Pause investigation (e.g., awaiting forensics) |
| **State Change** | `UNDER_INVESTIGATION ↔ INVESTIGATION_PAUSED` |

### Step 3.7: Complete Investigation

| Attribute | Value |
|-----------|-------|
| **Actor** | Police Officer |
| **Action** | Mark investigation complete |
| **Precondition** | Minimum evidence and events recorded |
| **State Change** | `UNDER_INVESTIGATION → INVESTIGATION_COMPLETED` |

---

## Phase 4: Document Preparation

### Step 4.1: Charge Sheet Preparation (If Evidence Found)

| Attribute | Value |
|-----------|-------|
| **Actor** | Police Officer |
| **Action** | Create charge sheet document |
| **State Change** | `INVESTIGATION_COMPLETED → CHARGE_SHEET_PREPARED` |

**Charge Sheet Contains:**
- Case summary
- List of accused with status
- IPC sections with evidence mapping
- Witness list
- Evidence list
- Investigating officer conclusions

**Document Versioning:**
- Each edit creates new version
- Version history maintained
- Status: `DRAFT → FINAL → LOCKED`

### Step 4.2: Closure Report Preparation (If No Evidence)

| Attribute | Value |
|-----------|-------|
| **Actor** | Police Officer |
| **Action** | Create closure report |
| **State Change** | `INVESTIGATION_COMPLETED → CLOSURE_REPORT_PREPARED` |

**Closure Report Contains:**
- Investigation summary
- Reason for closure
- Evidence reviewed (and why insufficient)
- Recommendation

### Step 4.3: Supporting Documents

Additional documents generated:
| Document Type | Purpose |
|---------------|---------|
| `EVIDENCE_LIST` | Itemized evidence inventory |
| `WITNESS_LIST` | All witnesses with details |
| `REMAND_APPLICATION` | Request for accused custody extension |

### Step 4.4: Document Validation

| Attribute | Value |
|-----------|-------|
| **Actor** | System (Automatic) |
| **Action** | Validate document checklist |
| **Validation Rules** | All mandatory documents present and FINAL |

**Mandatory Checklist:**
- [ ] Charge Sheet OR Closure Report (FINAL status)
- [ ] Evidence List (FINAL status)
- [ ] Witness List (FINAL status)
- [ ] At least 1 accused record
- [ ] At least 1 evidence record

---

## Phase 5: Court Submission

### Step 5.1: SHO Reviews and Submits

| Attribute | Value |
|-----------|-------|
| **Actor** | SHO |
| **Action** | Submit case to court |
| **Precondition** | All mandatory documents validated |
| **State Change** | `CHARGE_SHEET_PREPARED → SUBMITTED_TO_COURT` |

**Submission Data:**
- Target Court ID
- Submission Notes
- Document Package (all case documents)
- Submitting Officer ID
- Submission Timestamp

### Step 5.2: Court Submission Record Created

| Attribute | Value |
|-----------|-------|
| **Actor** | System (Automatic) |
| **Status** | `SUBMITTED` |

---

## Phase 6: Court Processing

### Step 6.1: Court Clerk Review

| Attribute | Value |
|-----------|-------|
| **Actor** | Court Clerk |
| **Action** | Review submission for completeness |
| **Possible Outcomes** | Accept OR Return for Defects |

### Step 6.2a: Accept Submission

| Attribute | Value |
|-----------|-------|
| **Actor** | Court Clerk or Judge |
| **Action** | Accept case for trial |
| **State Change** | `SUBMITTED_TO_COURT → COURT_ACCEPTED` |

**Acknowledgment Generated:**
- Acknowledgment Number
- Acknowledgment Date
- Receiving Officer Name
- Next Hearing Date (optional)

### Step 6.2b: Return for Defects

| Attribute | Value |
|-----------|-------|
| **Actor** | Court Clerk |
| **Action** | Return case with defect notes |
| **State Change** | `SUBMITTED_TO_COURT → RETURNED_FOR_DEFECTS` |

**Return Data:**
- Defect Description
- Required Corrections
- Return Date

### Step 6.3: Resubmission (After Corrections)

| Attribute | Value |
|-----------|-------|
| **Actor** | SHO |
| **Action** | Correct defects and resubmit |
| **State Change** | `RETURNED_FOR_DEFECTS → RESUBMITTED_TO_COURT` |

---

## Phase 7: Trial

### Step 7.1: Trial Begins

| Attribute | Value |
|-----------|-------|
| **Actor** | Judge |
| **Action** | Record first court action |
| **State Change** | `COURT_ACCEPTED → TRIAL_ONGOING` |

### Step 7.2: Court Actions

| Action Type | Description | Actor |
|-------------|-------------|-------|
| `COGNIZANCE` | Court takes cognizance of offense | Judge |
| `CHARGES_FRAMED` | Formal charges read to accused | Judge |
| `HEARING` | Hearing conducted | Judge |
| `JUDGMENT` | Final judgment delivered | Judge |
| `SENTENCE` | Sentence pronounced | Judge |
| `ACQUITTAL` | Accused acquitted | Judge |
| `CONVICTION` | Accused convicted | Judge |

**Court Action Data:**
- Action Type
- Action Date
- Description/Order Text
- Next Hearing Date (if applicable)
- Order Document URL (optional)

### Step 7.3: Judgment Reserved

| Attribute | Value |
|-----------|-------|
| **Actor** | Judge |
| **Action** | Reserve judgment for pronouncement |
| **State Change** | `TRIAL_ONGOING → JUDGMENT_RESERVED` |

---

## Phase 8: Disposal

### Step 8.1: Final Judgment

| Attribute | Value |
|-----------|-------|
| **Actor** | Judge |
| **Action** | Deliver final judgment |
| **State Change** | `JUDGMENT_RESERVED → DISPOSED` |

**Judgment Types:**
| Outcome | Description |
|---------|-------------|
| Conviction | Accused found guilty |
| Acquittal | Accused found not guilty |
| Discharge | Case dismissed before trial |

### Step 8.2: Archive Case

| Attribute | Value |
|-----------|-------|
| **Actor** | Court Clerk |
| **Action** | Archive disposed case |
| **State Change** | `DISPOSED → ARCHIVED` |

**Archive Actions:**
- Set `isArchived = true`
- Generate final case PDF
- Store closure report URL

---

## Phase 9: Special Flows

### Step 9.1: Case Reopen Request

| Attribute | Value |
|-----------|-------|
| **Actor** | Police Officer or SHO |
| **Action** | Request to reopen closed/archived case |
| **Approver** | Judge ONLY |

**Reopen Flow:**
1. Police submits reopen request with reason
2. Request status: `REQUESTED`
3. Judge reviews request
4. Judge approves → Status: `APPROVED`, Case reopened
5. Judge rejects → Status: `REJECTED`, Case remains closed

### Step 9.2: Document Requests

| Attribute | Value |
|-----------|-------|
| **Actor** | Police Officer |
| **Action** | Request court documents |

**Request Types:**
| Type | Description | Approval Chain |
|------|-------------|----------------|
| `ARREST_WARRANT` | Warrant for arrest | Police → SHO → Court |
| `SEARCH_WARRANT` | Warrant for search | Police → SHO → Court |
| `REMAND_ORDER` | Custody extension | Police → SHO → Court |
| `CHARGE_SHEET_COPY` | Copy of charge sheet | Police → SHO |
| `OTHER` | Miscellaneous | Police → SHO |

**Request Status Flow:**
```
REQUESTED → SHO_APPROVED → ISSUED
     ↓
  REJECTED
```

### Step 9.3: Bail Processing

| Attribute | Value |
|-----------|-------|
| **Actor** | Police Officer (record) / Court (decide) |
| **Action** | Record bail application and status |

**Bail Types:**
| Type | Authority |
|------|-----------|
| `POLICE` | Station bail by SHO |
| `ANTICIPATORY` | Pre-arrest bail by court |
| `COURT` | Regular bail by court |

**Bail Status Flow:**
```
APPLIED → GRANTED
    ↓
 REJECTED
```

---

## Audit Trail

Every state transition creates an audit record:

| Field | Description |
|-------|-------------|
| `caseId` | Affected case |
| `fromState` | Previous state |
| `toState` | New state |
| `changedBy` | User who triggered change |
| `changeReason` | Reason for state change |
| `changedAt` | Timestamp |

---

## Role Summary by Phase

| Phase | POLICE | SHO | COURT_CLERK | JUDGE |
|-------|--------|-----|-------------|-------|
| FIR Registration | ✅ | ✅ | ❌ | ❌ |
| Case Assignment | ❌ | ✅ | ❌ | ❌ |
| Investigation | ✅ | ✅ | ❌ | ❌ |
| Document Prep | ✅ | ✅ | ❌ | ❌ |
| Court Submission | ❌ | ✅ | ❌ | ❌ |
| Court Review | ❌ | ❌ | ✅ | ✅ |
| Trial | ❌ | ❌ | ✅ | ✅ |
| Judgment | ❌ | ❌ | ❌ | ✅ |
| Case Reopen Approval | ❌ | ❌ | ❌ | ✅ |

---

## State Transition Rules

| Current State | Allowed Next States | Allowed Roles |
|---------------|---------------------|---------------|
| `FIR_REGISTERED` | `CASE_ASSIGNED` | SHO |
| `CASE_ASSIGNED` | `UNDER_INVESTIGATION` | POLICE |
| `UNDER_INVESTIGATION` | `INVESTIGATION_PAUSED`, `INVESTIGATION_COMPLETED` | POLICE |
| `INVESTIGATION_PAUSED` | `UNDER_INVESTIGATION` | POLICE |
| `INVESTIGATION_COMPLETED` | `CHARGE_SHEET_PREPARED`, `CLOSURE_REPORT_PREPARED` | POLICE |
| `CHARGE_SHEET_PREPARED` | `SUBMITTED_TO_COURT` | SHO |
| `CLOSURE_REPORT_PREPARED` | `SUBMITTED_TO_COURT` | SHO |
| `SUBMITTED_TO_COURT` | `COURT_ACCEPTED`, `RETURNED_FOR_DEFECTS` | COURT_CLERK, JUDGE |
| `RETURNED_FOR_DEFECTS` | `RESUBMITTED_TO_COURT` | SHO |
| `RESUBMITTED_TO_COURT` | `COURT_ACCEPTED`, `RETURNED_FOR_DEFECTS` | COURT_CLERK, JUDGE |
| `COURT_ACCEPTED` | `TRIAL_ONGOING` | JUDGE |
| `TRIAL_ONGOING` | `JUDGMENT_RESERVED`, `DISPOSED` | JUDGE |
| `JUDGMENT_RESERVED` | `DISPOSED` | JUDGE |
| `DISPOSED` | `ARCHIVED`, `APPEALED` | COURT_CLERK, JUDGE |
| `ARCHIVED` | `UNDER_INVESTIGATION` (via reopen) | JUDGE |

---

## Conclusion

This system flow ensures:
1. **Accountability** - Every action traced to a user
2. **Compliance** - State transitions follow CrPC procedures
3. **Validation** - No shortcuts in document preparation
4. **Transparency** - Complete case history available
5. **Security** - Role-based access at every step
