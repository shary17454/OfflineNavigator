import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { POLICY_DOCUMENTS, POLICY_VERSION } from './policies';

const prisma = new PrismaClient();

async function upsertRole(code: string, nameAr: string, isSystem = true) {
  return prisma.role.upsert({
    where: { code },
    update: { nameAr },
    create: { code, nameAr, isSystem },
  });
}

async function upsertPermission(code: string, nameAr: string) {
  return prisma.permission.upsert({
    where: { code },
    update: { nameAr },
    create: { code, nameAr, scope: 'content' },
  });
}

async function main() {
  const [userRole, contributor, reviewer, editor, admin, superAdmin, owner, narratorRole, historianRole] =
    await Promise.all([
      upsertRole('USER', 'مستخدم'),
      upsertRole('CONTRIBUTOR', 'مساهم'),
      upsertRole('REVIEWER', 'مراجع'),
      upsertRole('EDITOR', 'محرر'),
      upsertRole('ADMIN', 'مدير'),
      upsertRole('SUPER_ADMIN', 'مشرف أعلى'),
      upsertRole('OWNER', 'مالك النظام'),
      upsertRole('NARRATOR', 'راوٍ معتمد'),
      upsertRole('HISTORIAN', 'مؤرخ معتمد'),
    ]);

  const perms = await Promise.all([
    upsertPermission('content:submit', 'إرسال المحتوى'),
    upsertPermission('content:review', 'مراجعة المحتوى'),
    upsertPermission('content:publish', 'نشر المحتوى'),
    upsertPermission('admin:read', 'الوصول للإدارة'),
    // صلاحيات دقيقة محصورة على OWNER فقط — لا تُمنح لأي دور آخر ضمن هذا الملف.
    upsertPermission('content:create', 'إنشاء محتوى جديد'),
    upsertPermission('content:edit', 'تعديل المحتوى'),
    upsertPermission('content:delete', 'حذف المحتوى'),
    upsertPermission('content:import', 'استيراد البيانات'),
    upsertPermission('content:merge', 'دمج السجلات المكررة'),
    upsertPermission('rights:manage', 'إدارة الحقوق'),
    upsertPermission('sources:manage', 'إدارة المصادر'),
    upsertPermission('categories:manage', 'إدارة التصنيفات'),
    upsertPermission('users:manage', 'إدارة المستخدمين والأدوار'),
    upsertPermission('settings:manage', 'إدارة إعدادات النظام'),
    upsertPermission('questions:answer_official', 'تمييز إجابة كإجابة رسمية من المالك'),
    upsertPermission('analytics:view', 'عرض التحليلات الأساسية'),
    upsertPermission('poetry:taxonomy_manage', 'إدارة تصنيفات الشعر'),
    upsertPermission('poet_file:manage', 'إدارة مكتبات الشعراء ونشرها'),
    // الصلاحية الوحيدة التي تُمنح للرواة والمؤرخين المعتمدين: الإضافة فقط.
    // المادة المضافة تبقى قيد المراجعة ولا تظهر للعامة حتى ينشرها المالك.
    upsertPermission('poet_file:contribute', 'إضافة مادة إلى مكتبة شاعر (تبقى قيد المراجعة)'),
    upsertPermission('contributors:review', 'مراجعة طلبات العضوية المهنية'),
    upsertPermission('policies:manage', 'تحرير وثائق الشروط والسياسات'),
  ]);

  const findPerm = (code: string) => perms.find((p) => p.code === code)!;

  for (const p of [findPerm('content:submit')]) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: contributor.id, permissionId: p.id } },
      update: {},
      create: { roleId: contributor.id, permissionId: p.id },
    });
  }
  for (const p of [findPerm('content:review')]) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: reviewer.id, permissionId: p.id } },
      update: {},
      create: { roleId: reviewer.id, permissionId: p.id },
    });
  }
  for (const p of [findPerm('content:publish')]) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: editor.id, permissionId: p.id } },
      update: {},
      create: { roleId: editor.id, permissionId: p.id },
    });
  }
  for (const p of [findPerm('content:submit'), findPerm('content:review'), findPerm('content:publish'), findPerm('admin:read')]) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: admin.id, permissionId: p.id } },
      update: {},
      create: { roleId: admin.id, permissionId: p.id },
    });
  }
  // الراوي والمؤرخ المعتمدان: إضافة فقط، بلا أي صلاحية نشر أو تعديل أو حذف.
  // ما يضيفانه يدخل بحالة SUBMITTED وينتظر نشر المالك — هذا حاجز قانوني ومحتوائي
  // مقصود، لا مجرد إخفاء زر في الواجهة.
  for (const role of [narratorRole, historianRole]) {
    for (const p of [findPerm('poet_file:contribute'), findPerm('content:submit')]) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: p.id } },
        update: {},
        create: { roleId: role.id, permissionId: p.id },
      });
    }
  }

  // OWNER يحصل على كل الصلاحيات دون استثناء — هو المصدر الوحيد للإضافة/التعديل/الحذف/الاستيراد/النشر.
  for (const p of perms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: owner.id, permissionId: p.id } },
      update: {},
      create: { roleId: owner.id, permissionId: p.id },
    });
  }

  const [adminUser, editorUser, normalUser] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@rawaya.test' },
      update: {},
      create: {
        email: 'admin@rawaya.test',
        status: 'ACTIVE',
        passwordHash: await argon2.hash('admin123'),
        profile: { create: { displayName: 'مدير النظام' } },
        userRoles: { create: { roleId: admin.id } },
      },
    }),
    prisma.user.upsert({
      where: { email: 'editor@rawaya.test' },
      update: {},
      create: {
        email: 'editor@rawaya.test',
        status: 'ACTIVE',
        passwordHash: await argon2.hash('editor123'),
        profile: { create: { displayName: 'محرر النظام' } },
        userRoles: { create: { roleId: editor.id } },
      },
    }),
    prisma.user.upsert({
      where: { email: 'user@rawaya.test' },
      update: {},
      create: {
        email: 'user@rawaya.test',
        status: 'ACTIVE',
        // ثمانية أحرف على الأقل — الحد الأدنى الذي يفرضه LoginDto. كانت
        // 'user123' بسبعة أحرف، فكان الحساب المزروع يُنشأ سليمًا في القاعدة
        // ويُرفض عند الدخول بخطأ تحقق، لا بخطأ بيانات اعتماد.
        passwordHash: await argon2.hash('user1234'),
        profile: { create: { displayName: 'مستخدم تجريبي' } },
        userRoles: { create: { roleId: userRole.id } },
      },
    }),
  ]);

  // ---- تصنيفات الشعر ----
  // موزّعة على أبعادها الصحيحة: القصيدة الواحدة قد تكون نبطية (TRADITION)
  // وفي الغزل (THEME) ومن عصر معيّن (ERA) ومن منطقة (REGION) في آنٍ واحد،
  // لذلك هذه ليست قائمة خيارات متعارضة.
  const taxonomyTerms: Array<{ slug: string; nameAr: string; dimension: any; sortOrder: number }> = [
    { slug: 'fasih', nameAr: 'الشعر العربي الفصيح', dimension: 'TRADITION', sortOrder: 1 },
    { slug: 'nabati', nameAr: 'الشعر النبطي', dimension: 'TRADITION', sortOrder: 2 },
    { slug: 'muhawarah', nameAr: 'شعر المحاورة', dimension: 'TRADITION', sortOrder: 3 },

    { slug: 'jahili', nameAr: 'الشعر الجاهلي', dimension: 'ERA', sortOrder: 1 },
    { slug: 'islami', nameAr: 'الشعر الإسلامي', dimension: 'ERA', sortOrder: 2 },
    { slug: 'umawi', nameAr: 'الشعر الأموي', dimension: 'ERA', sortOrder: 3 },
    { slug: 'abbasi', nameAr: 'الشعر العباسي', dimension: 'ERA', sortOrder: 4 },
    { slug: 'andalusi', nameAr: 'الشعر الأندلسي', dimension: 'ERA', sortOrder: 5 },
    { slug: 'hadith', nameAr: 'الشعر الحديث', dimension: 'ERA', sortOrder: 6 },

    { slug: 'muallaqat', nameAr: 'المعلقات', dimension: 'COLLECTION', sortOrder: 1 },

    { slug: 'hikmah', nameAr: 'شعر الحكمة', dimension: 'THEME', sortOrder: 1 },
    { slug: 'ghazal', nameAr: 'شعر الغزل', dimension: 'THEME', sortOrder: 2 },
    { slug: 'ritha', nameAr: 'شعر الرثاء', dimension: 'THEME', sortOrder: 3 },
    { slug: 'madh', nameAr: 'شعر المدح', dimension: 'THEME', sortOrder: 4 },
    { slug: 'hija', nameAr: 'شعر الهجاء', dimension: 'THEME', sortOrder: 5 },
    // الفخر والحماسة غرضان متجاوران لا مترادفان: الفخر بالنفس والقبيلة،
    // والحماسة في الحرب والبأس. فُصلا كما وردا في المواصفة، والدمج متاح
    // من لوحة المالك لمن رأى غير ذلك.
    { slug: 'fakhr', nameAr: 'شعر الفخر', dimension: 'THEME', sortOrder: 6 },
    { slug: 'hamasah', nameAr: 'شعر الحماسة', dimension: 'THEME', sortOrder: 7 },
    { slug: 'furusiyyah', nameAr: 'شعر الفروسية', dimension: 'THEME', sortOrder: 8 },
    { slug: 'karam', nameAr: 'شعر الكرم', dimension: 'THEME', sortOrder: 9 },
    { slug: 'wasf', nameAr: 'شعر الوصف', dimension: 'THEME', sortOrder: 10 },
    { slug: 'munasabat', nameAr: 'شعر المناسبات', dimension: 'THEME', sortOrder: 11 },
    { slug: 'khayl', nameAr: 'شعر الخيل', dimension: 'THEME', sortOrder: 12 },
    { slug: 'ibil', nameAr: 'شعر الإبل', dimension: 'THEME', sortOrder: 13 },
    { slug: 'saqarah-qans', nameAr: 'شعر الصقارة والقنص', dimension: 'THEME', sortOrder: 14 },

    { slug: 'ardah', nameAr: 'العرضة والشعر المرتبط بالفنون الشعبية', dimension: 'PERFORMANCE', sortOrder: 1 },
    { slug: 'mughannat-munshadah', nameAr: 'القصائد المغناة أو المنشدة', dimension: 'PERFORMANCE', sortOrder: 2 },
  ];

  for (const t of taxonomyTerms) {
    await prisma.poetryTaxonomyTerm.upsert({
      where: { slug: t.slug },
      update: { nameAr: t.nameAr, dimension: t.dimension, sortOrder: t.sortOrder },
      create: { slug: t.slug, nameAr: t.nameAr, dimension: t.dimension, sortOrder: t.sortOrder },
    });
  }

  // ---- وثائق الشروط والسياسات ----
  // تُزرع كإصدار 1.0 نافذ. أي تعديل لاحق من لوحة المالك يُنشئ إصدارًا جديدًا
  // بتاريخ سريان مستقل بدل الكتابة فوق النص السابق.
  for (const doc of POLICY_DOCUMENTS) {
    await prisma.policyDocument.upsert({
      where: { code_version: { code: doc.code, version: POLICY_VERSION } },
      update: {
        titleAr: doc.titleAr,
        bodyAr: doc.bodyAr,
        isCurrent: true,
        requiresReacceptance: doc.requiresReacceptance ?? false,
      },
      create: {
        code: doc.code,
        version: POLICY_VERSION,
        titleAr: doc.titleAr,
        bodyAr: doc.bodyAr,
        isCurrent: true,
        requiresReacceptance: doc.requiresReacceptance ?? false,
      },
    });
  }

  const source = await prisma.source.upsert({
    where: { id: 'seed-source-1' },
    update: {},
    create: {
      id: 'seed-source-1',
      title: 'مكتبة الملكية العامة المفتوحة',
      sourceType: 'مرجع عام',
      isActive: true,
    },
  });

  const poet = await prisma.poet.upsert({
    where: { slug: 'poet-1' },
    update: {},
    create: {
      slug: 'poet-1',
      fullName: 'أبو الفضل',
      knownAs: 'أبو الفضل',
      region: 'الجزيرة العربية',
    },
  });

  for (let i = 1; i <= 10; i++) {
    await prisma.poem.upsert({
      where: { slug: `poem-${i}` },
      update: {},
      create: {
        slug: `poem-${i}`,
        title: `قصيدة مختارة ${i}`,
        body: 'نص افتراضي تراثي.',
        poetId: poet.id,
        status: 'PUBLISHED',
      },
    });
  }

  for (let i = 1; i <= 10; i++) {
    await prisma.story.upsert({
      where: { slug: `story-${i}` },
      update: {},
      create: {
        slug: `story-${i}`,
        title: `قصة واحة ${i}`,
        body: 'سرد تراثي',
        status: 'PUBLISHED',
      },
    });
  }

  for (let i = 1; i <= 5; i++) {
    await prisma.book.upsert({
      where: { slug: `book-${i}` },
      update: {},
      create: {
        slug: `book-${i}`,
        title: `كتاب تراث ${i}`,
        summary: 'نسخة معلوماتية مرجعية',
        status: 'PUBLISHED',
      },
    });
  }

  for (let i = 1; i <= 5; i++) {
    await prisma.proverb.upsert({
      where: { slug: `proverb-${i}` },
      update: {},
      create: {
        slug: `proverb-${i}`,
        phrase: `مثل عربي ${i}`,
        explanation: 'شرح المثل',
        status: 'PUBLISHED',
      },
    });
  }

  for (let i = 1; i <= 10; i++) {
    await prisma.vocabularyTerm.upsert({
      where: { slug: `term-${i}` },
      update: {},
      create: {
        slug: `term-${i}`,
        term: `مصطلح ${i}`,
        meaning: 'معنى مصطلح تراثي',
        status: 'PUBLISHED',
      },
    });
  }

  for (let i = 1; i <= 5; i++) {
    await prisma.horse.upsert({
      where: { slug: `horse-${i}` },
      update: {},
      create: { slug: `horse-${i}`, name: `حصة الخيل ${i}`, status: 'PUBLISHED' },
    });
  }

  for (let i = 1; i <= 5; i++) {
    await prisma.camel.upsert({
      where: { slug: `camel-${i}` },
      update: {},
      create: { slug: `camel-${i}`, name: `إبل ${i}`, status: 'PUBLISHED' },
    });
  }

  for (let i = 1; i <= 5; i++) {
    await prisma.falcon.upsert({
      where: { slug: `falcon-${i}` },
      update: {},
      create: { slug: `falcon-${i}`, name: `صقر ${i}`, status: 'PUBLISHED' },
    });
  }

  for (let i = 1; i <= 3; i++) {
    await prisma.huntingDogBreed.upsert({
      where: { id: `breed-${i}` },
      update: {},
      create: { id: `breed-${i}`, name: `سلالة صيد ${i}` },
    });
  }

  for (let i = 1; i <= 5; i++) {
    await prisma.place.upsert({
      where: { slug: `place-${i}` },
      update: {},
      create: { slug: `place-${i}`, name: `مكان ${i}`, status: 'PUBLISHED', description: 'مكان تراثي مرجعي' },
    });
  }

  await Promise.all(
    Array.from({ length: 10 }, (_, idx) =>
      prisma.source.upsert({
        where: { id: `source-${idx + 1}` },
        update: {},
        create: { id: `source-${idx + 1}`, title: `مصدر ${idx + 1}`, sourceType: 'مرجع', isActive: true },
      }),
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
