import type { ReactNode } from "react";

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
  {
    author: "Skillu",
    slug: "devlog1",
    title: "[Devlog #1] Welcome to SFX Vault",
    description: "How it all started",
    date: new Date().toISOString(),
    tags: ["devlog", "site", "app"],
    content: (
      <>
        <h3 className="text-center text-lg">So. I made an app</h3>
        <p>Ehe</p>
      </>
    ),
  },
];

export const getArticles = () => articles;
export const getArticleBySlug = (slug: string) =>
  articles.find((a) => a.slug === slug) ?? null;
