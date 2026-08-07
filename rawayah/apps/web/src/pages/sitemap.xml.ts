import type { GetServerSideProps } from 'next';
import { ssrGet } from '../lib/ssr';

/**
 * خريطة الموقع — تُولَّد عند الطلب من المحتوى المنشور فعليًا.
 *
 * ملف ثابت مكتوب يدويًا كان سيتقادم مع أول مادة تُنشر، ويدلّ الزاحف على
 * صفحات محذوفة ويخفي عنه الجديدة. أما التوليد من الـAPI فيبقى مطابقًا
 * للواقع بلا صيانة.
 *
 * الصفحات التي تتطلب حسابًا (الحساب، المفضلة، الإشعارات) مستبعدة عمدًا:
 * لا فائدة من فهرستها ولا يصح دعوة الزاحف إليها.
 */

/**
 * عنوان الموقع المطلق.
 *
 * خريطة الموقع لا تقبل روابط نسبية — الزاحف يتجاهل الملف كله عند وجودها.
 * لذلك عند غياب `NEXT_PUBLIC_SITE_URL` يُشتقّ العنوان من ترويسة الطلب بدل
 * إخراج `<loc>/horses</loc>` وهو رابط لاغٍ يُفشل الملف بأكمله بصمت.
 */
function resolveSiteUrl(headers: { host?: string; 'x-forwarded-proto'?: string | string[] }) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, '');

  const host = headers.host;
  if (!host) return '';

  const forwarded = headers['x-forwarded-proto'];
  const proto =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded) ||
    (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');

  return `${proto}://${host}`;
}

const STATIC_PATHS = [
  '/',
  '/poetry',
  '/poets',
  '/poems',
  '/stories',
  '/books',
  '/proverbs',
  '/vocabulary',
  '/places',
  '/horses',
  '/camels',
  '/hunting',
  '/hunting-dogs',
  '/topics',
  '/questions',
  '/about',
  '/contact',
  '/policies',
  '/terms',
  '/privacy',
];

// أقسام المحتوى التي لكل عنصر فيها صفحة تفصيل مستقلة تستحق الفهرسة.
const COLLECTIONS = [
  'poets',
  'poems',
  'stories',
  'books',
  'proverbs',
  'vocabulary',
  'places',
  'horses',
  'camels',
  'hunting',
  'hunting-dogs',
  'topics',
];

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const siteUrl = resolveSiteUrl(req.headers as never);
  const paths = [...STATIC_PATHS];

  // تعطُّل قسم واحد لا يُفرغ الخريطة كلها: كل قسم يُجلب على حدة، وما
  // يفشل يُتخطّى وتبقى بقية الروابط.
  await Promise.all(
    COLLECTIONS.map(async (collection) => {
      const { data } = await ssrGet<Array<{ id: string }>>(`/${collection}`);
      if (!Array.isArray(data)) return;
      for (const item of data) {
        if (item?.id) paths.push(`/${collection}/${item.id}`);
      }
    }),
  );

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${escapeXml(`${siteUrl}${p === '/' ? '' : p}`)}</loc></url>`).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.write(body);
  res.end();

  return { props: {} };
};

export default function Sitemap() {
  return null;
}
