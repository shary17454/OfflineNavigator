import { heritageListPage, heritageListServerSideProps } from '../../components/HeritageArticle';

const CONFIG = {
  route: 'hunting',
  title: 'الصقارة والقنص',
  description: 'الصقارة والقنص في التراث العربي: الصقور وأنواعها، وأدوات القنص، وأعرافه وأخباره.',
  intro: 'القنص بالصقر فنّ له أعرافه ومصطلحاته وأدواته. المواد هنا توثيقية، ومستوى توثيق كل مادة معروض معها.',
  emptyText: 'لا توجد مواد منشورة في هذا القسم بعد.',
};

export default heritageListPage(CONFIG);

export const getServerSideProps = heritageListServerSideProps('hunting');
