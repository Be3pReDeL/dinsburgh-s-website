import type { SiteContent } from '../types';
import { defaultPortfolioCategories } from '../portfolio';

export const defaultContent: SiteContent = {
  copy: {
    skipLink: 'Перейти к работам',
    brandMark: 'DINSBURGH',
    heroTitle: 'DINSBURGH',
    heroSubtitle:
      'Цифровые сцены, экспериментальная живопись и fashion-коллаборации с акцентом на свет, фактуру и движение.',
    bioTitle: 'Bio',
    bioText:
      'DINSBURGH работает на стыке цифровых медиа и классической живописи. Внимание к контрасту и мягкому свечению формирует узнаваемый почерк, а каждая серия строится вокруг ощущения пространственного света.',
    bioMeta: ['Работает с 2016', 'Открыта для коллабораций'],
    bioImage: {
      src: '',
      alt: 'Портрет в блоке Bio',
    },
    portfolioBanner: 'ПОРТФОЛИО',
    emptyState:
      'В разделе пока нет работ. Добавьте папки с изображениями и метаданными в /content/portfolio.',
  },
  portfolio: {
    categories: defaultPortfolioCategories,
  },
};
