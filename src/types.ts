export type PortfolioWork = {
  id: string;
  title: string;
  description: string;
  image: string;
  categorySlug: string;
  categoryLabel: string;
  categoryOrder: number;
  workOrder: number;
};

export type PortfolioCategory = {
  slug: string;
  label: string;
  order: number;
  works: PortfolioWork[];
};
