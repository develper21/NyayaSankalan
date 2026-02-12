-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('POLICE', 'SHO', 'COURT_CLERK', 'JUDGE');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('POLICE_STATION', 'COURT');

-- CreateEnum
CREATE TYPE "CourtType" AS ENUM ('MAGISTRATE', 'SESSIONS', 'HIGH_COURT');

-- CreateEnum
CREATE TYPE "FirSource" AS ENUM ('POLICE', 'COURT_ORDER');

-- CreateEnum
CREATE TYPE "CaseState" AS ENUM ('FIR_REGISTERED', 'CASE_ASSIGNED', 'UNDER_INVESTIGATION', 'INVESTIGATION_PAUSED', 'INVESTIGATION_COMPLETED', 'CHARGE_SHEET_PREPARED', 'CLOSURE_REPORT_PREPARED', 'SUBMITTED_TO_COURT', 'RETURNED_FOR_DEFECTS', 'RESUBMITTED_TO_COURT', 'COURT_ACCEPTED', 'TRIAL_ONGOING', 'JUDGMENT_RESERVED', 'DISPOSED', 'APPEALED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AccusedStatus" AS ENUM ('ARRESTED', 'ON_BAIL', 'ABSCONDING');

-- CreateEnum
CREATE TYPE "EvidenceCategory" AS ENUM ('PHOTO', 'REPORT', 'FORENSIC', 'STATEMENT');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CHARGE_SHEET', 'EVIDENCE_LIST', 'WITNESS_LIST', 'CLOSURE_REPORT', 'REMAND_APPLICATION');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'FINAL', 'LOCKED');

-- CreateEnum
CREATE TYPE "BailType" AS ENUM ('POLICE', 'ANTICIPATORY', 'COURT');

-- CreateEnum
CREATE TYPE "BailStatus" AS ENUM ('APPLIED', 'GRANTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CourtSubmissionStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'RETURNED');

-- CreateEnum
CREATE TYPE "CourtActionType" AS ENUM ('COGNIZANCE', 'CHARGES_FRAMED', 'JUDGMENT');

-- CreateEnum
CREATE TYPE "InvestigationEventType" AS ENUM ('SEARCH', 'SEIZURE', 'STATEMENT', 'TRANSFER', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "organizationType" "OrganizationType" NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "police_stations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,

    CONSTRAINT "police_stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courts" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "courtType" "CourtType" NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,

    CONSTRAINT "courts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "firs" (
    "id" UUID NOT NULL,
    "firNumber" TEXT NOT NULL,
    "firSource" "FirSource" NOT NULL,
    "registeredBy" UUID NOT NULL,
    "policeStationId" UUID NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "sectionsApplied" TEXT NOT NULL,
    "firDocumentUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "firs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" UUID NOT NULL,
    "firId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_states" (
    "caseId" UUID NOT NULL,
    "currentState" "CaseState" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_states_pkey" PRIMARY KEY ("caseId")
);

-- CreateTable
CREATE TABLE "case_state_history" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "fromState" "CaseState" NOT NULL,
    "toState" "CaseState" NOT NULL,
    "changedBy" UUID NOT NULL,
    "changeReason" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_state_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_assignments" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "assignedTo" UUID NOT NULL,
    "assignedBy" UUID NOT NULL,
    "assignmentReason" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassignedAt" TIMESTAMP(3),

    CONSTRAINT "case_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accused" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AccusedStatus" NOT NULL,

    CONSTRAINT "accused_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investigation_events" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "eventType" "InvestigationEventType" NOT NULL,
    "description" TEXT NOT NULL,
    "performedBy" UUID NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investigation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "category" "EvidenceCategory" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedBy" UUID NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "witnesses" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "statementFileUrl" TEXT NOT NULL,

    CONSTRAINT "witnesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "DocumentStatus" NOT NULL,
    "contentJson" JSONB NOT NULL,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_checklists" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "requiredDocument" TEXT NOT NULL,
    "isUploaded" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "document_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bail_records" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "accusedId" UUID NOT NULL,
    "bailType" "BailType" NOT NULL,
    "status" "BailStatus" NOT NULL,
    "orderDocumentUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bail_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "court_submissions" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "submissionVersion" INTEGER NOT NULL,
    "submittedBy" UUID NOT NULL,
    "courtId" UUID NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "CourtSubmissionStatus" NOT NULL,

    CONSTRAINT "court_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acknowledgements" (
    "id" UUID NOT NULL,
    "submissionId" UUID NOT NULL,
    "ackNumber" TEXT NOT NULL,
    "ackTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acknowledgements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "court_actions" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "actionType" "CourtActionType" NOT NULL,
    "orderFileUrl" TEXT NOT NULL,
    "actionDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "court_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_logs" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "resourceAccessed" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "firs_registeredBy_idx" ON "firs"("registeredBy");

-- CreateIndex
CREATE INDEX "firs_policeStationId_idx" ON "firs"("policeStationId");

-- CreateIndex
CREATE UNIQUE INDEX "cases_firId_key" ON "cases"("firId");

-- CreateIndex
CREATE INDEX "cases_firId_idx" ON "cases"("firId");

-- CreateIndex
CREATE INDEX "case_state_history_caseId_idx" ON "case_state_history"("caseId");

-- CreateIndex
CREATE INDEX "case_state_history_changedBy_idx" ON "case_state_history"("changedBy");

-- CreateIndex
CREATE INDEX "case_assignments_caseId_idx" ON "case_assignments"("caseId");

-- CreateIndex
CREATE INDEX "case_assignments_assignedTo_idx" ON "case_assignments"("assignedTo");

-- CreateIndex
CREATE INDEX "case_assignments_assignedBy_idx" ON "case_assignments"("assignedBy");

-- CreateIndex
CREATE INDEX "accused_caseId_idx" ON "accused"("caseId");

-- CreateIndex
CREATE INDEX "investigation_events_caseId_idx" ON "investigation_events"("caseId");

-- CreateIndex
CREATE INDEX "investigation_events_performedBy_idx" ON "investigation_events"("performedBy");

-- CreateIndex
CREATE INDEX "evidence_caseId_idx" ON "evidence"("caseId");

-- CreateIndex
CREATE INDEX "evidence_uploadedBy_idx" ON "evidence"("uploadedBy");

-- CreateIndex
CREATE INDEX "witnesses_caseId_idx" ON "witnesses"("caseId");

-- CreateIndex
CREATE INDEX "documents_caseId_idx" ON "documents"("caseId");

-- CreateIndex
CREATE INDEX "documents_createdBy_idx" ON "documents"("createdBy");

-- CreateIndex
CREATE INDEX "document_checklists_caseId_idx" ON "document_checklists"("caseId");

-- CreateIndex
CREATE INDEX "bail_records_caseId_idx" ON "bail_records"("caseId");

-- CreateIndex
CREATE INDEX "bail_records_accusedId_idx" ON "bail_records"("accusedId");

-- CreateIndex
CREATE INDEX "court_submissions_caseId_idx" ON "court_submissions"("caseId");

-- CreateIndex
CREATE INDEX "court_submissions_submittedBy_idx" ON "court_submissions"("submittedBy");

-- CreateIndex
CREATE INDEX "court_submissions_courtId_idx" ON "court_submissions"("courtId");

-- CreateIndex
CREATE UNIQUE INDEX "acknowledgements_submissionId_key" ON "acknowledgements"("submissionId");

-- CreateIndex
CREATE INDEX "acknowledgements_submissionId_idx" ON "acknowledgements"("submissionId");

-- CreateIndex
CREATE INDEX "court_actions_caseId_idx" ON "court_actions"("caseId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "access_logs_userId_idx" ON "access_logs"("userId");

-- CreateIndex
CREATE INDEX "access_logs_timestamp_idx" ON "access_logs"("timestamp");

-- AddForeignKey
ALTER TABLE "firs" ADD CONSTRAINT "firs_registeredBy_fkey" FOREIGN KEY ("registeredBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firs" ADD CONSTRAINT "firs_policeStationId_fkey" FOREIGN KEY ("policeStationId") REFERENCES "police_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_firId_fkey" FOREIGN KEY ("firId") REFERENCES "firs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_states" ADD CONSTRAINT "case_states_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_state_history" ADD CONSTRAINT "case_state_history_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_state_history" ADD CONSTRAINT "case_state_history_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_assignments" ADD CONSTRAINT "case_assignments_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_assignments" ADD CONSTRAINT "case_assignments_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_assignments" ADD CONSTRAINT "case_assignments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accused" ADD CONSTRAINT "accused_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigation_events" ADD CONSTRAINT "investigation_events_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigation_events" ADD CONSTRAINT "investigation_events_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "witnesses" ADD CONSTRAINT "witnesses_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_checklists" ADD CONSTRAINT "document_checklists_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bail_records" ADD CONSTRAINT "bail_records_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bail_records" ADD CONSTRAINT "bail_records_accusedId_fkey" FOREIGN KEY ("accusedId") REFERENCES "accused"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "court_submissions" ADD CONSTRAINT "court_submissions_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "court_submissions" ADD CONSTRAINT "court_submissions_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "court_submissions" ADD CONSTRAINT "court_submissions_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "courts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acknowledgements" ADD CONSTRAINT "acknowledgements_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "court_submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "court_actions" ADD CONSTRAINT "court_actions_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
