-- CreateEnum
CREATE TYPE "ContributorType" AS ENUM ('NARRATOR', 'HISTORIAN');

-- CreateEnum
CREATE TYPE "ContributorApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'NEEDS_INFORMATION', 'APPROVED', 'REJECTED', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "PoetFileItemKind" AS ENUM ('TEXT', 'AUDIO', 'VIDEO', 'IMAGE', 'DOCUMENT', 'EXTERNAL_LINK');

-- CreateEnum
CREATE TYPE "PoetryTaxonomyDimension" AS ENUM ('TRADITION', 'ERA', 'THEME', 'REGION', 'PERFORMANCE', 'COLLECTION');

-- CreateEnum
CREATE TYPE "ContributionReviewState" AS ENUM ('DRAFT', 'SUBMITTED', 'OWNER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PolicyDocumentCode" AS ENUM ('TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'CONTENT_POLICY', 'CONTRIBUTOR_AGREEMENT', 'COPYRIGHT_POLICY', 'TAKEDOWN_POLICY', 'SOURCE_POLICY', 'ORAL_HISTORY_POLICY', 'COMMUNITY_GUIDELINES');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('NARRATOR_PUBLIC_PROFILE', 'HISTORIAN_PUBLIC_PROFILE', 'CONTRIBUTOR_AGREEMENT', 'POLICY_ACCEPTANCE');

-- CreateEnum
CREATE TYPE "DatePrecision" AS ENUM ('EXACT', 'YEAR', 'DECADE', 'CENTURY', 'APPROXIMATE', 'DISPUTED', 'UNKNOWN');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ContentType" ADD VALUE IF NOT EXISTS 'POET_FILE';
ALTER TYPE "ContentType" ADD VALUE IF NOT EXISTS 'POET_FILE_ITEM';

-- AlterTable
ALTER TABLE "Poet" ADD COLUMN     "birthDatePrecision" "DatePrecision" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "deathDatePrecision" "DatePrecision" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "disputeNote" TEXT,
ADD COLUMN     "kunya" TEXT,
ADD COLUMN     "laqab" TEXT,
ADD COLUMN     "lastReviewedAt" TIMESTAMP(3),
ADD COLUMN     "lastReviewedBy" TEXT;

-- CreateTable
CREATE TABLE "PoetryTaxonomyTerm" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "description" TEXT,
    "dimension" "PoetryTaxonomyDimension" NOT NULL,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mergedIntoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoetryTaxonomyTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoemTaxonomy" (
    "id" TEXT NOT NULL,
    "poemId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PoemTaxonomy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoetFile" (
    "id" TEXT NOT NULL,
    "poetId" TEXT NOT NULL,
    "overview" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "publishedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoetFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoetFileItem" (
    "id" TEXT NOT NULL,
    "poetFileId" TEXT NOT NULL,
    "kind" "PoetFileItemKind" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "bodyText" TEXT,
    "mediaUrl" TEXT,
    "externalUrl" TEXT,
    "mediaFileId" TEXT,
    "poemId" TEXT,
    "durationMs" INTEGER,
    "occasion" TEXT,
    "materialDate" TEXT,
    "materialDatePrecision" "DatePrecision" NOT NULL DEFAULT 'UNKNOWN',
    "reciterName" TEXT,
    "capturedByName" TEXT,
    "sourceId" TEXT,
    "sourceNotes" TEXT,
    "rightsHolder" TEXT,
    "rightsStatus" "RightsStatus" NOT NULL DEFAULT 'UNKNOWN',
    "licenseName" TEXT,
    "allowDisplay" BOOLEAN NOT NULL DEFAULT false,
    "allowDownload" BOOLEAN NOT NULL DEFAULT false,
    "allowCommercial" BOOLEAN NOT NULL DEFAULT false,
    "documentationLevel" "VerificationLevel" NOT NULL DEFAULT 'UNDER_REVIEW',
    "internalNotes" TEXT,
    "reviewState" "ContributionReviewState" NOT NULL DEFAULT 'DRAFT',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "contributedById" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "publishedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoetFileItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContributorApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ContributorType" NOT NULL,
    "publicDisplayName" TEXT NOT NULL,
    "publicBio" TEXT NOT NULL,
    "publicSpecialties" TEXT NOT NULL,
    "publicAvatarUrl" TEXT,
    "publicCountry" TEXT,
    "publicRegion" TEXT,
    "privateFullName" TEXT NOT NULL,
    "privateEmail" TEXT NOT NULL,
    "privatePhoneNumber" TEXT,
    "privatePreferredContact" TEXT,
    "privateExperience" TEXT NOT NULL,
    "privateKnowledgeSources" TEXT,
    "privateReliesOnOralTradition" BOOLEAN NOT NULL DEFAULT false,
    "privateHasRecordings" BOOLEAN NOT NULL DEFAULT false,
    "privateHasDocuments" BOOLEAN NOT NULL DEFAULT false,
    "privateCredentials" TEXT,
    "privatePublications" TEXT,
    "privateProfessionalLinks" TEXT,
    "privateVerificationNotes" TEXT,
    "privateSampleWorkUrl" TEXT,
    "status" "ContributorApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "infoRequestedNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContributorApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentType" "ConsentType" NOT NULL,
    "documentVersion" TEXT NOT NULL,
    "consentText" TEXT NOT NULL,
    "grantedScopes" JSONB,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawnAt" TIMESTAMP(3),
    "withdrawnNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyDocument" (
    "id" TEXT NOT NULL,
    "code" "PolicyDocumentCode" NOT NULL,
    "version" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "bodyAr" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "requiresReacceptance" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyAcceptance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PoetryTaxonomyTerm_slug_key" ON "PoetryTaxonomyTerm"("slug");

-- CreateIndex
CREATE INDEX "PoetryTaxonomyTerm_dimension_isActive_idx" ON "PoetryTaxonomyTerm"("dimension", "isActive");

-- CreateIndex
CREATE INDEX "PoetryTaxonomyTerm_parentId_idx" ON "PoetryTaxonomyTerm"("parentId");

-- CreateIndex
CREATE INDEX "PoemTaxonomy_termId_idx" ON "PoemTaxonomy"("termId");

-- CreateIndex
CREATE UNIQUE INDEX "PoemTaxonomy_poemId_termId_key" ON "PoemTaxonomy"("poemId", "termId");

-- CreateIndex
CREATE UNIQUE INDEX "PoetFile_poetId_key" ON "PoetFile"("poetId");

-- CreateIndex
CREATE INDEX "PoetFileItem_poetFileId_status_idx" ON "PoetFileItem"("poetFileId", "status");

-- CreateIndex
CREATE INDEX "PoetFileItem_kind_idx" ON "PoetFileItem"("kind");

-- CreateIndex
CREATE INDEX "PoetFileItem_reviewState_idx" ON "PoetFileItem"("reviewState");

-- CreateIndex
CREATE INDEX "ContributorApplication_status_idx" ON "ContributorApplication"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ContributorApplication_userId_type_key" ON "ContributorApplication"("userId", "type");

-- CreateIndex
CREATE INDEX "ConsentRecord_userId_consentType_idx" ON "ConsentRecord"("userId", "consentType");

-- CreateIndex
CREATE INDEX "PolicyDocument_code_isCurrent_idx" ON "PolicyDocument"("code", "isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyDocument_code_version_key" ON "PolicyDocument"("code", "version");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyAcceptance_userId_documentId_key" ON "PolicyAcceptance"("userId", "documentId");

-- AddForeignKey
ALTER TABLE "PoetryTaxonomyTerm" ADD CONSTRAINT "PoetryTaxonomyTerm_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PoetryTaxonomyTerm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoetryTaxonomyTerm" ADD CONSTRAINT "PoetryTaxonomyTerm_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "PoetryTaxonomyTerm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoemTaxonomy" ADD CONSTRAINT "PoemTaxonomy_poemId_fkey" FOREIGN KEY ("poemId") REFERENCES "Poem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoemTaxonomy" ADD CONSTRAINT "PoemTaxonomy_termId_fkey" FOREIGN KEY ("termId") REFERENCES "PoetryTaxonomyTerm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoetFile" ADD CONSTRAINT "PoetFile_poetId_fkey" FOREIGN KEY ("poetId") REFERENCES "Poet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoetFileItem" ADD CONSTRAINT "PoetFileItem_poetFileId_fkey" FOREIGN KEY ("poetFileId") REFERENCES "PoetFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoetFileItem" ADD CONSTRAINT "PoetFileItem_poemId_fkey" FOREIGN KEY ("poemId") REFERENCES "Poem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoetFileItem" ADD CONSTRAINT "PoetFileItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoetFileItem" ADD CONSTRAINT "PoetFileItem_contributedById_fkey" FOREIGN KEY ("contributedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoetFileItem" ADD CONSTRAINT "PoetFileItem_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoetFileItem" ADD CONSTRAINT "PoetFileItem_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributorApplication" ADD CONSTRAINT "ContributorApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributorApplication" ADD CONSTRAINT "ContributorApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyAcceptance" ADD CONSTRAINT "PolicyAcceptance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyAcceptance" ADD CONSTRAINT "PolicyAcceptance_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "PolicyDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

