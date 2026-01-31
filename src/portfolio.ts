import type { PortfolioCategory, PortfolioWork } from './types';

type MetaModule = {
  title?: string;
  description?: string;
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

const buildWorks = (): PortfolioWork[] => {
  return Object.entries(metaModules)
    .map(([path, module]) => {
      const meta = 'default' in module ? module.default : module;
      const match = path.match(
        /\/content\/portfolio\/([^/]+)\/([^/]+)\/meta\.json$/
      );
      if (!match) return null;
      const [, categoryFolder, workFolder] = match;
      const basePath = `/content/portfolio/${categoryFolder}/${workFolder}/`;
      const imageEntry = Object.entries(imageModules).find(([imagePath]) =>
        imagePath.startsWith(basePath)
      );
      const image = imageEntry?.[1] ?? '';
      return {
        id: `${categoryFolder}/${workFolder}`,
        title: meta.title ?? titleFromSlug(workFolder),
        description: meta.description ?? 'Описание пока не добавлено.',
        image,
        categorySlug: categoryFolder,
        categoryLabel: titleFromSlug(categoryFolder),
        categoryOrder: parseOrder(categoryFolder, 999),
        workOrder: parseOrder(workFolder, 999),
      };
    })
    .filter((item): item is PortfolioWork => Boolean(item));
};

const groupByCategory = (works: PortfolioWork[]): PortfolioCategory[] => {
  const map = new Map<string, PortfolioCategory>();

  works.forEach((work) => {
    const existing = map.get(work.categorySlug);
    if (existing) {
      existing.works.push(work);
      return;
    }

    map.set(work.categorySlug, {
      slug: work.categorySlug,
      label: work.categoryLabel,
      order: work.categoryOrder,
      works: [work],
    });
  });

  return Array.from(map.values())
    .map((category) => ({
      ...category,
      works: category.works.sort((a, b) => a.workOrder - b.workOrder),
    }))
    .sort((a, b) => a.order - b.order);
};

export const portfolioCategories = groupByCategory(buildWorks());
