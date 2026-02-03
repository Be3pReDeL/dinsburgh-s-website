import type { PortfolioCategory, PortfolioWork, SiteContent } from '../types';
import { defaultContent } from './defaultContent';

const STORAGE_KEY = 'dinsburgh-content';
const STORAGE_VERSION = 1;

type StoredContent = {
  version: number;
  content: SiteContent;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const ensureString = (value: unknown, fallback: string) =>
  typeof value === 'string' ? value : fallback;

const ensureNumber = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const ensureStringArray = (value: unknown, fallback: string[]) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : fallback;

const sanitizeWork = (value: unknown, index: number): PortfolioWork => {
  if (!isRecord(value)) {
    return {
      id: `work-${index + 1}`,
      title: `Работа ${index + 1}`,
      description: '',
      coverImage: '',
      images: [],
      order: index + 1,
    };
  }

  const images = ensureStringArray(value.images, []);
  const coverImage = ensureString(value.coverImage, images[0] ?? '');

  return {
    id: ensureString(value.id, `work-${index + 1}`),
    title: ensureString(value.title, `Работа ${index + 1}`),
    description: ensureString(value.description, ''),
    coverImage,
    images,
    order: ensureNumber(value.order, index + 1),
  };
};

const sanitizeCategory = (
  value: unknown,
  index: number
): PortfolioCategory => {
  if (!isRecord(value)) {
    return {
      id: `category-${index + 1}`,
      label: `Раздел ${index + 1}`,
      description: '',
      order: index + 1,
      works: [],
    };
  }

  const worksInput = value.works;
  const works = Array.isArray(worksInput)
    ? worksInput.map((work, workIndex) => sanitizeWork(work, workIndex))
    : [];

  return {
    id: ensureString(value.id, `category-${index + 1}`),
    label: ensureString(value.label, `Раздел ${index + 1}`),
    description: ensureString(value.description, ''),
    order: ensureNumber(value.order, index + 1),
    works,
  };
};

const sanitizeContent = (value: unknown): SiteContent => {
  if (!isRecord(value)) return defaultContent;

  const copyInput = value.copy;
  const copyDefaults = defaultContent.copy;
  const copy = isRecord(copyInput)
    ? {
        skipLink: ensureString(copyInput.skipLink, copyDefaults.skipLink),
        brandMark: ensureString(copyInput.brandMark, copyDefaults.brandMark),
        heroTitle: ensureString(copyInput.heroTitle, copyDefaults.heroTitle),
        heroSubtitle: ensureString(
          copyInput.heroSubtitle,
          copyDefaults.heroSubtitle
        ),
        bioTitle: ensureString(copyInput.bioTitle, copyDefaults.bioTitle),
        bioText: ensureString(copyInput.bioText, copyDefaults.bioText),
        bioMeta: ensureStringArray(copyInput.bioMeta, copyDefaults.bioMeta),
        bioImage: isRecord(copyInput.bioImage)
          ? {
              src: ensureString(copyInput.bioImage.src, copyDefaults.bioImage.src),
              alt: ensureString(copyInput.bioImage.alt, copyDefaults.bioImage.alt),
            }
          : copyDefaults.bioImage,
        portfolioBanner: ensureString(
          copyInput.portfolioBanner,
          copyDefaults.portfolioBanner
        ),
        emptyState: ensureString(copyInput.emptyState, copyDefaults.emptyState),
      }
    : copyDefaults;

  const portfolioInput = value.portfolio;
  const portfolioDefaults = defaultContent.portfolio;
  const categoriesInput = isRecord(portfolioInput)
    ? portfolioInput.categories
    : null;
  const categories = Array.isArray(categoriesInput)
    ? categoriesInput.map((category, index) =>
        sanitizeCategory(category, index)
      )
    : portfolioDefaults.categories;

  return {
    copy,
    portfolio: {
      categories,
    },
  };
};

export const loadStoredContent = (): SiteContent | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredContent;
    if (!parsed || parsed.version !== STORAGE_VERSION) return null;
    return sanitizeContent(parsed.content);
  } catch {
    return null;
  }
};

export const saveStoredContent = (content: SiteContent) => {
  if (typeof window === 'undefined') return;
  const payload: StoredContent = {
    version: STORAGE_VERSION,
    content,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

export const clearStoredContent = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
};
