-- ملاحظة: تم استبعاد فهارس pg_trgm يدويًا من هذه الملف لأنها أُنشئت خارج
-- سجل هجرات Prisma عبر prisma/manual-sql/001_search_extensions.sql عمدًا
-- (Phase 9)؛ prisma migrate diff يقترح حذفها فقط لأنها غير موصوفة في
-- schema.prisma، لكنها ضرورية للبحث العربي ولا يجب حذفها.

-- DropForeignKey
ALTER TABLE "PoemVerse" DROP CONSTRAINT "PoemVerse_poemId_fkey";

-- DropIndex
DROP INDEX "PoemVerse_poemId_idx";

-- AlterTable
-- لا مخاطرة على البيانات: جدول PoemVerse فارغ (0 صف) وقت هذه الهجرة.
ALTER TABLE "PoemVerse" DROP COLUMN "poemId",
ADD COLUMN     "versionId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "PoemVersion" (
    "id" TEXT NOT NULL,
    "poemId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sourceNotes" TEXT,
    "verificationLevel" "VerificationLevel" NOT NULL DEFAULT 'UNDER_REVIEW',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "reviewedBy" TEXT,

    CONSTRAINT "PoemVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoemVerseVariant" (
    "id" TEXT NOT NULL,
    "verseId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sourceNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "PoemVerseVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoemAttribution" (
    "id" TEXT NOT NULL,
    "poemId" TEXT NOT NULL,
    "poetId" TEXT,
    "claimedName" TEXT,
    "consensus" "ConsensusStatus" NOT NULL DEFAULT 'AGREED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "PoemAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PoemVersion_poemId_idx" ON "PoemVersion"("poemId");

-- CreateIndex
CREATE INDEX "PoemVerseVariant_verseId_idx" ON "PoemVerseVariant"("verseId");

-- CreateIndex
CREATE INDEX "PoemAttribution_poemId_idx" ON "PoemAttribution"("poemId");

-- CreateIndex
CREATE INDEX "PoemVerse_versionId_idx" ON "PoemVerse"("versionId");

-- AddForeignKey
ALTER TABLE "PoemVersion" ADD CONSTRAINT "PoemVersion_poemId_fkey" FOREIGN KEY ("poemId") REFERENCES "Poem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoemVerse" ADD CONSTRAINT "PoemVerse_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "PoemVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoemVerseVariant" ADD CONSTRAINT "PoemVerseVariant_verseId_fkey" FOREIGN KEY ("verseId") REFERENCES "PoemVerse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoemAttribution" ADD CONSTRAINT "PoemAttribution_poemId_fkey" FOREIGN KEY ("poemId") REFERENCES "Poem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoemAttribution" ADD CONSTRAINT "PoemAttribution_poetId_fkey" FOREIGN KEY ("poetId") REFERENCES "Poet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
