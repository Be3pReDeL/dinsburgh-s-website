export type SiteCopy = {
  skipLink: string;
  brandMark: string;
  heroTitle: string;
  heroSubtitle: string;
  bioTitle: string;
  bioText: string;
  bioMeta: string[];
  bioImage: {
    src: string;
    alt: string;
  };
  portfolioBanner: string;
  emptyState: string;
};

export type PortfolioWork = {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  images: string[];
  order: number;
};

export type PortfolioCategory = {
  id: string;
  label: string;
  description: string;
  order: number;
  works: PortfolioWork[];
};

export type SiteContent = {
  copy: SiteCopy;
  portfolio: {
    categories: PortfolioCategory[];
  };
};
