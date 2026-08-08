# نشر موروث على VPS خاص (DigitalOcean / Linode) — دليل تنفيذي كامل

الأصعب إعدادًا لكن الأرخص طويل المدى والأكثر تحكمًا. يفترض إلمامًا أساسيًا بالطرفية (terminal).

## الخطوة 1 — إنشاء السيرفر (Droplet / Linode)
1. **DigitalOcean**: https://digitalocean.com → **Create → Droplet**
   - الصورة: **Ubuntu 22.04 LTS**
   - الحجم: **Basic, 2GB RAM / 1 vCPU** كحد أدنى ($12/شهر) — 4GB أفضل لو توقعت زيارات جيدة
   - المنطقة: أقرب لجمهورك (Frankfurt أو Bangalore للجمهور الخليجي)
   - Authentication: **SSH Key** (أضف مفتاحك، أأمن من كلمة سر)
2. بعد الإنشاء، انسخ عنوان IP الظاهر

## الخطوة 2 — الاتصال والتجهيز الأساسي
```bash
ssh root@<IP-address>

# تحديث النظام
apt update && apt upgrade -y

# تثبيت Docker وDocker Compose
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin

# جدار حماية أساسي
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

## الخطوة 3 — نسخ المشروع
```bash
git clone https://github.com/shary17454/OfflineNavigator.git
cd OfflineNavigator/rawayah
git checkout fix/rawaya-schema-and-knowledge-graph   # أو main بعد الدمج
```

## الخطوة 4 — ملف البيئة الإنتاجي
```bash
cp apps/api/.env.example .env
nano .env
```
املأ:
```
POSTGRES_USER=rawaya
POSTGRES_PASSWORD=<كلمة سر قوية عشوائية>
POSTGRES_DB=rawaya
DATABASE_URL=postgresql://rawaya:<نفس-كلمة-السر>@postgres:5432/rawaya?schema=public
REDIS_URL=redis://redis:6379
JWT_SECRET=<openssl rand -base64 32>
JWT_REFRESH_SECRET=<openssl rand -base64 32>
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=rawaya
S3_SECRET_KEY=<كلمة سر قوية>
S3_BUCKET=rawaya-media
S3_REGION=us-east-1
ALLOWED_ORIGINS=https://your-domain.com,https://admin.your-domain.com
```

يولّد كلمات سر عشوائية بأمر واحد:
```bash
openssl rand -base64 32
```

## الخطوة 5 — تشغيل الخدمات
استخدم `docker-compose.production.yml` الموجود في جذر المستودع (يشغّل postgres, redis, api, web, admin). أضف MinIO يدويًا إن لم يكن مضافًا:
```bash
docker compose -f docker-compose.production.yml --env-file .env up -d --build
```
راقب السجلات:
```bash
docker compose -f docker-compose.production.yml logs -f api
```

## الخطوة 6 — تهيئة قاعدة البيانات (مرة واحدة)
```bash
docker compose -f docker-compose.production.yml exec api npx prisma migrate deploy
docker compose -f docker-compose.production.yml exec api npm run seed
docker compose -f docker-compose.production.yml exec api npm run create-owner
```

## الخطوة 7 — Nginx كبوابة عكسية (reverse proxy) + HTTPS
```bash
apt install -y nginx certbot python3-certbot-nginx
```
أنشئ `/etc/nginx/sites-available/rawaya`:
```nginx
server {
    server_name your-domain.com;
    location / { proxy_pass http://localhost:3001; proxy_set_header Host $host; }
}
server {
    server_name api.your-domain.com;
    location / { proxy_pass http://localhost:4000; proxy_set_header Host $host; }
}
server {
    server_name admin.your-domain.com;
    location / { proxy_pass http://localhost:3002; proxy_set_header Host $host; }
}
```
```bash
ln -s /etc/nginx/sites-available/rawaya /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# شهادات HTTPS مجانية تلقائية لكل الدومينات الثلاثة دفعة واحدة
certbot --nginx -d your-domain.com -d api.your-domain.com -d admin.your-domain.com
```
Certbot يجدد الشهادات تلقائيًا كل 90 يومًا عبر مهمة مجدولة يضيفها بنفسه — لا تدخل يدوي لاحقًا.

## الخطوة 8 — النسخ الاحتياطي (لا تتجاهله)
```bash
# نسخة احتياطية يومية لقاعدة البيانات، cron في الساعة 3 فجرًا
echo '0 3 * * * docker compose -f /root/OfflineNavigator/rawayah/docker-compose.production.yml exec -T postgres pg_dump -U rawaya rawaya > /root/backups/rawaya-$(date +\%F).sql' | crontab -
mkdir -p /root/backups
```

## التكلفة المتوقعة
- Droplet 2GB: $12/شهر (4GB أفضل: $24/شهر)
- تخزين إضافي للنسخ الاحتياطي: ~$5/شهر
- **المجموع: $12-30/شهر** — أرخص من Railway/Render لكن أنت المسؤول عن الصيانة والتحديثات الأمنية
