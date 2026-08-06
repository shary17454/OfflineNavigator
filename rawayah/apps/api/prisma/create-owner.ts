import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import * as readline from 'readline/promises';
import { generateSecret, generateURI } from 'otplib';
import * as qrcodeTerminal from 'qrcode-terminal';

const prisma = new PrismaClient();

function randomPassword(length = 20) {
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

// عند تمرير الإدخال عبر أنبوب (pipe) بدل طرفية تفاعلية حقيقية، تُغلق واجهة
// readline نفسها تلقائيًا فور انتهاء الدفق — قبل أن يصل السؤال الثاني. نقرأ
// كل الأسطر مسبقًا في هذه الحالة ونسحب الإجابات منها بدل استدعاء rl.question()
// المتكرر. الاستخدام التفاعلي العادي (طرفية حقيقية) لا يتأثر ويستمر كما هو.
let pipedLines: string[] | null = null;
let rl: readline.Interface | null = null;

async function initInput() {
  if (!process.stdin.isTTY) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
    pipedLines = Buffer.concat(chunks).toString('utf8').split('\n');
  } else {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  }
}

async function prompt(question: string): Promise<string> {
  if (pipedLines) {
    const line = (pipedLines.shift() ?? '').trim();
    process.stdout.write(`${question}${line}\n`);
    return line;
  }
  return (await rl!.question(question)).trim();
}

async function main() {
  await initInput();

  const existingOwner = await prisma.userRole.findFirst({
    where: { role: { code: 'OWNER' } },
  });
  if (existingOwner) {
    console.error('يوجد حساب OWNER بالفعل. هذا الأمر يعمل مرة واحدة فقط لإنشاء أول حساب مالك.');
    process.exit(1);
  }

  const ownerRole = await prisma.role.findFirst({ where: { code: 'OWNER' } });
  if (!ownerRole) {
    console.error('دور OWNER غير موجود. شغّل "npm run seed" أولًا.');
    process.exit(1);
  }

  const email = await prompt('البريد الإلكتروني لحساب المالك: ');
  if (!email || !email.includes('@')) {
    console.error('بريد إلكتروني غير صالح.');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error('هذا البريد مستخدم بالفعل لحساب آخر.');
    process.exit(1);
  }

  const displayName = (await prompt('اسم العرض [مالك النظام]: ')) || 'مالك النظام';

  const tempPassword = randomPassword();
  const passwordHash = await argon2.hash(tempPassword);
  const twoFactorSecret = generateSecret();

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      status: 'ACTIVE',
      isEmailVerified: true,
      mustChangePassword: true,
      twoFactorSecret,
      twoFactorEnabled: false,
      profile: { create: { displayName } },
      userRoles: { create: { roleId: ownerRole.id } },
    },
  });

  const otpAuthUrl = generateURI({ issuer: 'Rawaya', label: email, secret: twoFactorSecret });

  console.log('\n=== تم إنشاء حساب OWNER بنجاح ===');
  console.log(`المعرّف: ${user.id}`);
  console.log(`البريد: ${email}`);
  console.log(`كلمة المرور المؤقتة (تُعرض مرة واحدة فقط): ${tempPassword}`);
  console.log('\nسيُطلب تغيير كلمة المرور عند أول دخول إلزاميًا.');
  console.log('\n=== إعداد المصادقة الثنائية (2FA) ===');
  console.log(`سر TOTP اليدوي: ${twoFactorSecret}`);
  console.log(`رابط الإعداد المباشر: ${otpAuthUrl}`);
  console.log('امسح رمز QR التالي داخل تطبيق مصادقة (Google Authenticator / Authy):\n');
  await new Promise<void>((resolve) => qrcodeTerminal.generate(otpAuthUrl, { small: true }, (qr) => {
    console.log(qr);
    resolve();
  }));
  console.log(
    'ملاحظة: 2FA لن يُفعَّل نهائيًا إلا بعد أول تحقق ناجح عبر POST /auth/2fa/verify عند تسجيل الدخول الأول.',
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    rl?.close();
    await prisma.$disconnect();
  });
