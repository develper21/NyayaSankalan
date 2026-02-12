// ====================================================================
// NYAYASANKALAN FRONTEND TYPES
// Matches backend Prisma schema and API responses exactly
// ====================================================================

// ====================================================================
// ENUMS (matching backend)
// ====================================================================

export enum UserRole {
  POLICE = 'POLICE',
  SHO = 'SHO',
  COURT_CLERK = 'COURT_CLERK',
  JUDGE = 'JUDGE',
}

export enum OrganizationType {
  POLICE_STATION = 'POLICE_STATION',
  COURT = 'COURT',
}

export enum CourtType {
  MAGISTRATE = 'MAGISTRATE',
  SESSIONS = 'SESSIONS',
  HIGH_COURT = 'HIGH_COURT',
}

export enum FirSource {
  POLICE = 'POLICE',
  COURT_ORDER = 'COURT_ORDER',
}

export enum CaseState {
  FIR_REGISTERED = 'FIR_REGISTERED',
  CASE_ASSIGNED = 'CASE_ASSIGNED',
  UNDER_INVESTIGATION = 'UNDER_INVESTIGATION',
  INVESTIGATION_PAUSED = 'INVESTIGATION_PAUSED',
  INVESTIGATION_COMPLETED = 'INVESTIGATION_COMPLETED',
  CHARGE_SHEET_PREPARED = 'CHARGE_SHEET_PREPARED',
  CLOSURE_REPORT_PREPARED = 'CLOSURE_REPORT_PREPARED',
  SUBMITTED_TO_COURT = 'SUBMITTED_TO_COURT',
  RETURNED_FOR_DEFECTS = 'RETURNED_FOR_DEFECTS',
  RESUBMITTED_TO_COURT = 'RESUBMITTED_TO_COURT',
  COURT_ACCEPTED = 'COURT_ACCEPTED',
  TRIAL_ONGOING = 'TRIAL_ONGOING',
  JUDGMENT_RESERVED = 'JUDGMENT_RESERVED',
  DISPOSED = 'DISPOSED',
  APPEALED = 'APPEALED',
  ARCHIVED = 'ARCHIVED',
}

export enum AccusedStatus {
  ARRESTED = 'ARRESTED',
  ON_BAIL = 'ON_BAIL',
  ABSCONDING = 'ABSCONDING',
}

export enum EvidenceCategory {
  PHOTO = 'PHOTO',
  REPORT = 'REPORT',
  FORENSIC = 'FORENSIC',
  STATEMENT = 'STATEMENT',
}

export enum DocumentType {
  CHARGE_SHEET = 'CHARGE_SHEET',
  EVIDENCE_LIST = 'EVIDENCE_LIST',
  WITNESS_LIST = 'WITNESS_LIST',
  CLOSURE_REPORT = 'CLOSURE_REPORT',
  REMAND_APPLICATION = 'REMAND_APPLICATION',
}

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  FINAL = 'FINAL',
  LOCKED = 'LOCKED',
}

export enum DocumentRequestType {
  ARREST_WARRANT = 'ARREST_WARRANT',
  SEARCH_WARRANT = 'SEARCH_WARRANT',
  REMAND_ORDER = 'REMAND_ORDER',
  CHARGE_SHEET_COPY = 'CHARGE_SHEET_COPY',
  OTHER = 'OTHER',
}

export enum DocumentRequestStatus {
  REQUESTED = 'REQUESTED',
  SHO_APPROVED = 'SHO_APPROVED',
  ISSUED = 'ISSUED',
  REJECTED = 'REJECTED',
}

export enum InvestigationEventType {
  SEARCH = 'SEARCH',
  SEIZURE = 'SEIZURE',
  STATEMENT = 'STATEMENT',
  TRANSFER = 'TRANSFER',
  OTHER = 'OTHER',
}

export enum BailType {
  POLICE = 'POLICE',
  ANTICIPATORY = 'ANTICIPATORY',
  COURT = 'COURT',
}

export enum BailStatus {
  APPLIED = 'APPLIED',
  GRANTED = 'GRANTED',
  REJECTED = 'REJECTED',
}

export enum CourtSubmissionStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ACCEPTED = 'ACCEPTED',
  RETURNED = 'RETURNED',
}

export enum CourtActionType {
  COGNIZANCE = 'COGNIZANCE',
  CHARGES_FRAMED = 'CHARGES_FRAMED',
  HEARING = 'HEARING',
  JUDGMENT = 'JUDGMENT',
  SENTENCE = 'SENTENCE',
  ACQUITTAL = 'ACQUITTAL',
  CONVICTION = 'CONVICTION',
}

// ====================================================================
// USER & ORGANIZATION TYPES
// ====================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationType: OrganizationType;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
}

export interface PoliceStation {
  id: string;
  name: string;
  code: string;
  district: string;
  state: string;
  address: string | null;
  contactNumber: string | null;
}

export interface Court {
  id: string;
  name: string;
  courtType: CourtType;
  district: string;
  state: string;
  address: string | null;
  contactNumber: string | null;
}

// ====================================================================
// FIR & CASE TYPES
// ====================================================================

export interface FIR {
  id: string;
  firNumber: string;
  firSource: FirSource;
  policeStationId: string;
  policeStation?: PoliceStation;
  registeredBy: string;
  user?: User;
  incidentDate: string;
  sectionsApplied: string;
  firDocumentUrl: string;
  createdAt: string;
  case?: Case;
}

export interface Case {
  id: string;
  firId: string;
  fir?: FIR;
  createdAt: string;
  isArchived: boolean;
  state?: CurrentCaseState;
  stateHistory?: CaseStateHistory[];
  assignments?: CaseAssignment[];
  investigationEvents?: InvestigationEvent[];
  evidence?: Evidence[];
  witnesses?: Witness[];
  accused?: Accused[];
  documents?: Document[];
  courtSubmissions?: CourtSubmission[];
  courtActions?: CourtAction[];
}

export interface CurrentCaseState {
  caseId: string;
  currentState: CaseState;
  updatedAt: string;
  case?: Case;
}

export interface CaseStateHistory {
  id: string;
  caseId: string;
  fromState: CaseState;
  toState: CaseState;
  changedBy: string;
  user?: User;
  changeReason: string;
  changedAt: string;
}

export interface CaseAssignment {
  id: string;
  caseId: string;
  assignedTo: string;
  assignedUser?: User;
  assignedBy: string;
  assignerUser?: User;
  assignmentReason: string;
  assignedAt: string;
  unassignedAt: string | null;
}

// ====================================================================
// INVESTIGATION TYPES
// ====================================================================

export interface InvestigationEvent {
  id: string;
  caseId: string;
  eventType: InvestigationEventType;
  description: string;
  performedBy: string;
  user?: User;
  eventDate: string;
}

export interface Evidence {
  id: string;
  caseId: string;
  category: EvidenceCategory;
  fileUrl: string;
  uploadedBy: string;
  user?: User;
  uploadedAt: string;
}

export interface Witness {
  id: string;
  caseId: string;
  name: string;
  contact: string | null;
  address: string | null;
  statementFileUrl: string | null;
}

export interface Accused {
  id: string;
  caseId: string;
  name: string;
  fatherName: string | null;
  address: string | null;
  status: AccusedStatus;
  arrestDate: string | null;
  bailDetails: string | null;
  addedBy: string;
  addedByUser?: User;
  addedAt: string;
}

// ====================================================================
// DOCUMENT TYPES
// ====================================================================

export interface Document {
  id: string;
  caseId: string;
  documentType: DocumentType;
  version: number;
  status: DocumentStatus;
  contentJson: any;
  filePath: string | null;
  createdBy: string;
  createdByUser?: User;
  createdAt: string;
  finalizedBy: string | null;
  finalizedByUser?: User;
  finalizedAt: string | null;
}

export interface DocumentRequest {
  id: string;
  caseId: string;
  requestedBy: string;
  approvedBy?: string | null;
  issuedBy?: string | null;
  documentType: DocumentRequestType;
  status: DocumentRequestStatus;
  requestReason: string;
  issuedFileUrl?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
  requester?: User;
  approver?: User | null;
  issuer?: User | null;
}

export enum CaseReopenStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface CaseReopenRequest {
  id: string;
  caseId: string;
  requestedBy: string;
  reviewedBy?: string | null;
  status: CaseReopenStatus;
  policeReason: string;
  judgeNote?: string | null;
  createdAt: string;
  decidedAt?: string | null;
  requester?: User | null;
  reviewer?: User | null;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  relatedCaseId: string;
  type: 'INFO' | 'ACTION' | 'WARNING';
  isRead: boolean;
  createdAt: string;
}

// ====================================================================
// COURT TYPES
// ====================================================================

export interface CourtSubmission {
  id: string;
  caseId: string;
  submissionVersion: number;
  submittedBy: string;
  submittedByUser?: User;
  submittedAt: string;
  courtId: string;
  court?: Court;
  status: CourtSubmissionStatus;
  acknowledgement?: Acknowledgement;
}

export interface Acknowledgement {
  id: string;
  courtSubmissionId: string;
  acknowledgedBy: string;
  acknowledgedByUser?: User;
  acknowledgedAt: string;
  remarks: string | null;
}

export interface CourtAction {
  id: string;
  caseId: string;
  actionType: CourtActionType;
  actionDate: string;
  orderFileUrl: string | null;
  createdBy: string;
  createdByUser?: User;
  createdAt: string;
}

export interface BailRecord {
  id: string;
  caseId: string;
  accusedName: string;
  bailType: BailType;
  status: BailStatus;
  applicationDate: string;
  decisionDate: string | null;
  remarks: string | null;
  createdBy: string;
  createdByUser?: User;
  createdAt: string;
}

// ====================================================================
// AUDIT & TIMELINE TYPES
// ====================================================================

export interface AuditLog {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  performedBy: string;
  performedByUser?: User;
  performedAt: string;
  timestamp: string;
  changes: any;
}

export interface TimelineEvent {
  type: string;
  timestamp: string;
  title: string;
  description?: string;
  actor?: string;
}

// ====================================================================
// API REQUEST/RESPONSE TYPES
// ====================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ====================================================================
// FORM DATA TYPES
// ====================================================================

export interface CreateFIRFormData {
  firNumber: string;
  firDate: string;
  firSource: FirSource;
  sectionsApplied: string[];
  complainantName: string;
  complainantContact?: string;
  incidentDate?: string;
  incidentTime?: string;
  incidentLocation: string;
  descriptionOfIncident: string;
  firDocument?: File;
}

export interface CreateEvidenceFormData {
  category: EvidenceCategory;
  description: string;
  collectedDate?: string;
  collectedFrom?: string;
  file?: File;
}

export interface CreateWitnessFormData {
  name: string;
  contact?: string;
  address?: string;
  statement: string;
  statementFile?: File;
}

export interface CreateAccusedFormData {
  name: string;
  fatherName?: string;
  address?: string;
  status: AccusedStatus;
  arrestDate?: string;
  bailDetails?: string;
}

export interface CreateDocumentFormData {
  documentType: DocumentType;
  contentJson: any;
  file?: File;
}

export interface SubmitToCourtFormData {
  courtId: string;
}

export interface AssignCaseFormData {
  officerId: string;
  assignmentReason?: string;
}

export interface CreateCourtActionFormData {
  actionType: CourtActionType;
  actionDate: string;
  orderFileUrl?: string;
}

export interface CreateBailRecordFormData {
  accusedName: string;
  bailType: BailType;
  applicationDate: string;
  remarks?: string;
}
