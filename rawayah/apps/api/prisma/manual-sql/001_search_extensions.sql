-- تحسينات بحث اختيارية على مستوى قاعدة البيانات — تُشغَّل مرة واحدة يدويًا
-- بعد توفر قاعدة بيانات PostgreSQL حية (لم تُشغَّل بعد في بيئة التطوير هذه
-- لعدم توفر اتصال حي وقت الكتابة). التطبيق يعمل بدونها عبر مطابقة نصية
-- عادية (contains) وتشابه Trigram محسوب في التطبيق نفسه — هذا الملف يرفع
-- الأداء والدقة عند الحاجة لاحقًا دون تغيير أي سلوك حالي.
--
-- التشغيل: psql "$DATABASE_URL" -f prisma/manual-sql/001_search_extensions.sql

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_poem_title_trgm ON "Poem" USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_story_title_trgm ON "Story" USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_poet_fullname_trgm ON "Poet" USING GIN ("fullName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_book_title_trgm ON "Book" USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_place_name_trgm ON "Place" USING GIN (name gin_trgm_ops);

-- مثال استعلام تشابه بعد تفعيل الامتداد (لاستخدام مستقبلي اختياري في
-- DuplicateDetectionService بدل/إضافة إلى المقارنة داخل التطبيق):
--   SELECT id, title, similarity(title, 'نص البحث') AS score
--   FROM "Poem"
--   WHERE title % 'نص البحث'
--   ORDER BY score DESC LIMIT 20;
