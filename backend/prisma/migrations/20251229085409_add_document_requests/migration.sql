-- CreateEnum
CREATE TYPE "DocumentRequestType" AS ENUM ('ARREST_WARRANT', 'SEARCH_WARRANT', 'REMAND_ORDER', 'CHARGE_SHEET_COPY', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentRequestStatus" AS ENUM ('REQUESTED', 'SHO_APPROVED', 'ISSUED', 'REJECTED');

-- CreateTable
CREATE TABLE "document_requests" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "requestedBy" UUID NOT NULL,
    "approvedBy" UUID,
    "issuedBy" UUID,
    "documentType" "DocumentRequestType" NOT NULL,
    "status" "DocumentRequestStatus" NOT NULL,
    "requestReason" TEXT NOT NULL,
    "issuedFileUrl" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_requests_caseId_idx" ON "document_requests"("caseId");

-- CreateIndex
CREATE INDEX "document_requests_requestedBy_idx" ON "document_requests"("requestedBy");

-- CreateIndex
CREATE INDEX "document_requests_approvedBy_idx" ON "document_requests"("approvedBy");

-- CreateIndex
CREATE INDEX "document_requests_issuedBy_idx" ON "document_requests"("issuedBy");

-- AddForeignKey
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_issuedBy_fkey" FOREIGN KEY ("issuedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
