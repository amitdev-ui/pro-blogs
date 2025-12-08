export interface ScraperConfig {
  name: string;
  url: string;
  selectors: {
    articleContainer: string;
    title: string;
    description?: string;
    content?: string;
    author: string;
    authorImage?: string;
    date: string;
    image?: string;
    link?: string;
    category?: string;
    tags?: string;
  };
  pagination?: {
    type: "infinite-scroll" | "next-page" | "page-number";
    selector?: string;
    maxPages?: number;
  };
}

export interface ScrapedPost {
  title: string;
  slug: string;
  description: string;
  content?: string;
  author: string;
  authorImage?: string;
  date: Date;
  readingTime?: string;
  category?: string;
  tags: string[];
  thumbnail?: string;
  coverImage?: string;
  sourceUrl: string;
}

