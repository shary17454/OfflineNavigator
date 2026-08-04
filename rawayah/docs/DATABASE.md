# قاعدة البيانات

تم إنشاء نموذج Prisma يشمل:
- users, profiles
- roles, permissions, user_roles, role_permissions
- poets, poems, stories, books, places, tribes, events, vocabulary, proverbs
- horses, camels, falcons, hunting_article, hunting_dog_breed, hunting_dog_article
- comments, content_reports, favorites, follows, ratings
- search_logs, content_views, content_revisions, payments, subscriptions, plans
- media_files, audio_tracks, videos, notifications

مطلوبات إضافية: Soft delete عبر `deletedAt`.

انظر ملف `apps/api/prisma/schema.prisma`.
