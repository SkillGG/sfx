import type { ReactNode } from 'react'
import { Article1 } from './article1'
import { Article2 } from './article2'
import { UpdateArticles } from './updates'

export type Article = {
	slug: string
	title: string
	description: string
	date: Date
	tags?: string[]
	content: ReactNode
	author: string
	featured: boolean
}

// Temporary in-memory articles. Replace with CMS or MDX later.
export const articles: Article[] = [Article1, Article2, ...UpdateArticles]

export const getArticles = () => articles
export const getArticleBySlug = (slug: string) =>
	articles.find(a => a.slug === slug) ?? null
