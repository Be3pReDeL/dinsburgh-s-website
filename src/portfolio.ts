import type { PortfolioCategory, PortfolioWork } from './types';

type MetaModule = {
  title?: string;
  description?: string;
};

type WorkWithCategory = PortfolioWork & {
  categoryId: string;
  categoryLabel: string;
  categoryOrder: number;
};

export const defaultCategoryDescriptions: Record<string, string> = {
  '01-digital':
    'Цифровые серии о свете и движении. Слоистые фактуры, мягкие градиенты и контроль над источниками освещения.',
  '02-painting':
    'Живописные работы с акцентом на глубину, ритм мазка и тишину цвета. Тонкая работа с контрастом.',
  '03-fashion':
    'Fashion-проекты и коллаборации: текстуры ткани, графичные силуэты и сценический свет.',
};

const metaModules = import.meta.glob('/content/portfolio/**/meta.json', {
  eager: true,
}) as Record<string, MetaModule | { default: MetaModule }>;

const imageModules = import.meta.glob(
  '/content/portfolio/**/*.{png,jpg,jpeg,webp}',
  {
    eager: true,
    query: '?url',
    import: 'default',
  }
) as Record<string, string>;

const titleFromSlug = (value: string) =>
  value
    .replace(/^\d+-/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const parseOrder = (value: string, fallback: number) => {
  const match = value.match(/^(\d+)[-_]/);
  return match ? Number(match[1]) : fallback;
};

const getImagesForWork = (basePath: string) =>
  Object.entries(imageModules)
    .filter(([imagePath]) => imagePath.startsWith(basePath))
    .sort(([pathA], [pathB]) => pathA.localeCompare(pathB))
    .map(([, url]) => url);

const buildWorks = (): WorkWithCategory[] => {
  return Object.entries(metaModules)
    .map(([path, module]) => {
      const meta = 'default' in module ? module.default : module;
      const match = path.match(
        /\/content\/portfolio\/([^/]+)\/([^/]+)\/meta\.json$/
      );
      if (!match) return null;
      const [, categoryFolder, workFolder] = match;
      const basePath = `/content/portfolio/${categoryFolder}/${workFolder}/`;
      const images = getImagesForWork(basePath);
      const coverImage = images[0] ?? '';
      return {
        id: `${categoryFolder}/${workFolder}`,
        title: meta.title ?? titleFromSlug(workFolder),
        description: meta.description ?? 'Описание пока не добавлено.',
        coverImage,
        images,
        order: parseOrder(workFolder, 999),
        categoryId: categoryFolder,
        categoryLabel: titleFromSlug(categoryFolder),
        categoryOrder: parseOrder(categoryFolder, 999),
      };
    })
    .filter((item): item is WorkWithCategory => Boolean(item));
};

const toPortfolioWork = (work: WorkWithCategory): PortfolioWork => ({
  id: work.id,
  title: work.title,
  description: work.description,
  coverImage: work.coverImage,
  images: work.images,
  order: work.order,
});

const groupByCategory = (works: WorkWithCategory[]): PortfolioCategory[] => {
  const map = new Map<string, PortfolioCategory>();

  works.forEach((work) => {
    const existing = map.get(work.categoryId);
    if (existing) {
      existing.works.push(toPortfolioWork(work));
      return;
    }

    map.set(work.categoryId, {
      id: work.categoryId,
      label: work.categoryLabel,
      description: '',
      order: work.categoryOrder,
      works: [toPortfolioWork(work)],
    });
  });

  return Array.from(map.values())
    .map((category) => ({
      ...category,
      works: category.works.sort((a, b) => a.order - b.order),
    }))
    .sort((a, b) => a.order - b.order);
};

const applyDescriptions = (
  categories: PortfolioCategory[],
  descriptions: Record<string, string>
) =>
  categories.map((category) => ({
    ...category,
    description:
      descriptions[category.id] ??
      'Описание направления будет добавлено позже.',
  }));

export const buildDefaultPortfolioCategories = (
  descriptions: Record<string, string> = defaultCategoryDescriptions
) => applyDescriptions(groupByCategory(buildWorks()), descriptions);

export const defaultPortfolioCategories = buildDefaultPortfolioCategories();
