import { heritageListPage, heritageListServerSideProps } from '../../components/HeritageArticle';

const CONFIG = {
  route: 'camels',
  title: 'الإبل',
  description: 'الإبل في التراث العربي: سلالاتها وأسماؤها وأوصافها وما قيل فيها، بمصادرها ومستوى توثيقها.',
  intro: 'للإبل في لسان العرب أسماء وأوصاف لا تُحصى بحسب السنّ واللون والغرض. ما هنا موثّق بمصادره.',
  emptyText: 'لا توجد مواد منشورة في هذا القسم بعد.',
};

export default heritageListPage(CONFIG);

export const getServerSideProps = heritageListServerSideProps('camels');
