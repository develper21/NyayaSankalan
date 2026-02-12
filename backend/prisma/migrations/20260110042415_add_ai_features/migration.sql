/*
  Warnings:

  - You are about to drop the `deadlines` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "deadlines" DROP CONSTRAINT "deadlines_assignedTo_fkey";

-- DropForeignKey
ALTER TABLE "deadlines" DROP CONSTRAINT "deadlines_caseId_fkey";

-- DropTable
DROP TABLE "deadlines";

-- DropEnum
DROP TYPE "DeadlinePriority";

-- DropEnum
DROP TYPE "DeadlineStatus";

-- DropEnum
DROP TYPE "DeadlineType";

-- CreateTable
CREATE TABLE "case_readiness_checks" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "checkedBy" UUID NOT NULL,
    "caseType" TEXT NOT NULL,
    "readinessScore" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "documentsRequired" TEXT[],
    "documentsPresent" TEXT[],
    "documentsMissing" TEXT[],
    "documentCompleteness" DOUBLE PRECISION NOT NULL,
    "witnessesRequired" INTEGER NOT NULL,
    "witnessesPresent" INTEGER NOT NULL,
    "witnessStatus" TEXT NOT NULL,
    "evidenceCount" INTEGER NOT NULL,
    "evidenceStatus" TEXT NOT NULL,
    "daysElapsed" INTEGER NOT NULL,
    "expectedDays" INTEGER NOT NULL,
    "timelineStatus" TEXT NOT NULL,
    "blockers" TEXT[],
    "recommendations" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_readiness_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_validations" (
    "id" UUID NOT NULL,
    "caseId" UUID,
    "validatedBy" UUID NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "fileUrl" TEXT,
    "valid" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,
    "complianceScore" DOUBLE PRECISION NOT NULL,
    "fieldsRequired" TEXT[],
    "fieldsPresent" TEXT[],
    "fieldsMissing" TEXT[],
    "signaturesRequired" TEXT[],
    "signaturesPresent" TEXT[],
    "signaturesMissing" TEXT[],
    "pageCount" INTEGER NOT NULL,
    "pagesRequired" INTEGER NOT NULL,
    "missingContent" TEXT[],
    "errors" TEXT[],
    "warnings" TEXT[],
    "recommendations" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_validations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_briefs" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "generatedBy" UUID NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "caseType" TEXT NOT NULL,
    "caseOverview" JSONB NOT NULL,
    "parties" JSONB NOT NULL,
    "facts" JSONB NOT NULL,
    "charges" JSONB NOT NULL,
    "evidenceSummary" JSONB NOT NULL,
    "legalIssues" JSONB[],
    "precedents" JSONB[],
    "prosecutionArguments" JSONB NOT NULL,
    "defenseArguments" JSONB NOT NULL,
    "keyConsiderations" TEXT[],
    "timeline" JSONB[],
    "proceduralStatus" JSONB NOT NULL,
    "attentionAreas" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "case_briefs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "case_readiness_checks_caseId_idx" ON "case_readiness_checks"("caseId");

-- CreateIndex
CREATE INDEX "case_readiness_checks_checkedBy_idx" ON "case_readiness_checks"("checkedBy");

-- CreateIndex
CREATE INDEX "case_readiness_checks_status_idx" ON "case_readiness_checks"("status");

-- CreateIndex
CREATE INDEX "case_readiness_checks_createdAt_idx" ON "case_readiness_checks"("createdAt");

-- CreateIndex
CREATE INDEX "document_validations_caseId_idx" ON "document_validations"("caseId");

-- CreateIndex
CREATE INDEX "document_validations_validatedBy_idx" ON "document_validations"("validatedBy");

-- CreateIndex
CREATE INDEX "document_validations_status_idx" ON "document_validations"("status");

-- CreateIndex
CREATE INDEX "document_validations_createdAt_idx" ON "document_validations"("createdAt");

-- CreateIndex
CREATE INDEX "case_briefs_caseId_idx" ON "case_briefs"("caseId");

-- CreateIndex
CREATE INDEX "case_briefs_generatedBy_idx" ON "case_briefs"("generatedBy");

-- CreateIndex
CREATE INDEX "case_briefs_createdAt_idx" ON "case_briefs"("createdAt");

-- CreateIndex
CREATE INDEX "case_briefs_isArchived_idx" ON "case_briefs"("isArchived");

-- AddForeignKey
ALTER TABLE "case_readiness_checks" ADD CONSTRAINT "case_readiness_checks_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_readiness_checks" ADD CONSTRAINT "case_readiness_checks_checkedBy_fkey" FOREIGN KEY ("checkedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_validations" ADD CONSTRAINT "document_validations_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_validations" ADD CONSTRAINT "document_validations_validatedBy_fkey" FOREIGN KEY ("validatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_briefs" ADD CONSTRAINT "case_briefs_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_briefs" ADD CONSTRAINT "case_briefs_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
