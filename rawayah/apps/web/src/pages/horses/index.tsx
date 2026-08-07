import { heritageListPage, heritageListServerSideProps } from '../../components/HeritageArticle';

const CONFIG = {
  route: 'horses',
  title: 'الخيل',
  description: 'الخيل العربية في التراث: سلالاتها وأوصافها وأخبارها ومكانتها عند العرب، بمصادرها ومستوى توثيقها.',
  intro: 'الخيل عند العرب ليست دابّة فحسب، بل موضوع شعر وفخر ونسب. ما هنا موثّق بمصادره، ومستوى التوثيق معروض مع كل مادة.',
  emptyText: 'لا توجد مواد منشورة في هذا القسم بعد.',
};

export default heritageListPage(CONFIG);

export const getServerSideProps = heritageListServerSideProps('horses');
