-- CreateEnum
CREATE TYPE "SourceConflictType" AS ENUM ('ATTRIBUTION', 'TEXT_VARIANT', 'DATE', 'PLACE', 'LINEAGE', 'EVENT_DETAIL', 'NAME', 'OTHER');

-- CreateEnum
CREATE TYPE "ConflictConfidence" AS ENUM ('UNRESOLVED', 'LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ConflictResolution" AS ENUM ('PENDING', 'SOURCE_A_PREFERRED', 'SOURCE_B_PREFERRED', 'BOTH_PUBLISHED_AS_DISPUTED', 'INSUFFICIENT_EVIDENCE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PolicyDocumentCode" ADD VALUE 'CITATION_POLICY';
ALTER TYPE "PolicyDocumentCode" ADD VALUE 'RIGHTS_POLICY';
ALTER TYPE "PolicyDocumentCode" ADD VALUE 'REPORTING_POLICY';
ALTER TYPE "PolicyDocumentCode" ADD VALUE 'ACCOUNT_DELETION_POLICY';

-- CreateTable
CREATE TABLE "SourceConflict" (
    "id" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "contentId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "conflictType" "SourceConflictType" NOT NULL,
    "sourceAId" TEXT NOT NULL,
    "sourceAClaim" TEXT NOT NULL,
    "sourceBId" TEXT NOT NULL,
    "sourceBClaim" TEXT NOT NULL,
    "additionalNotes" TEXT,
    "reviewerNotes" TEXT,
    "confidence" "ConflictConfidence" NOT NULL DEFAULT 'UNRESOLVED',
    "resolution" "ConflictResolution" NOT NULL DEFAULT 'PENDING',
    "publicDisputeNote" TEXT,
    "trustAssessmentId" TEXT,
    "reviewedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceConflict_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SourceConflict_contentType_contentId_idx" ON "SourceConflict"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "SourceConflict_resolution_idx" ON "SourceConflict"("resolution");

-- AddForeignKey
ALTER TABLE "SourceConflict" ADD CONSTRAINT "SourceConflict_sourceAId_fkey" FOREIGN KEY ("sourceAId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceConflict" ADD CONSTRAINT "SourceConflict_sourceBId_fkey" FOREIGN KEY ("sourceBId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceConflict" ADD CONSTRAINT "SourceConflict_trustAssessmentId_fkey" FOREIGN KEY ("trustAssessmentId") REFERENCES "TrustAssessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceConflict" ADD CONSTRAINT "SourceConflict_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

