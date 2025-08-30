import type { ReactNode } from "react";
import { Article1 } from "./article1";

export type Article = {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO string
  tags?: string[];
  content: ReactNode;
  author: string;
};

// Temporary in-memory articles. Replace with CMS or MDX later.
export const articles: Article[] = [
  Article1,
];

export const getArticles = () => articles;
export const getArticleBySlug = (slug: string) =>
  articles.find((a) => a.slug === slug) ?? null;
