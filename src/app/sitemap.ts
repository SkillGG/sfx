import { getArticles } from '@/articles'
import { api } from '@/trpc/server'
import type { MetadataRoute } from 'next'

const ORIGIN = 'https://www.sfxvault.org'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const sfxs = await api.sfx.listSFX('list')

	return [
		{
			url: `${ORIGIN}/`,
			lastModified: new Date(),
			changeFrequency: 'weekly',
			priority: 1,
		},
		{
			url: `${ORIGIN}/blog`,
			lastModified: new Date(),
			changeFrequency: 'weekly',
			priority: 0.1,
		},
		...getArticles().map<MetadataRoute.Sitemap[number]>(article => ({
			url: `${ORIGIN}/blog/${article.slug}`,
			lastModified: article.date,
			changeFrequency: 'never',
			priority: 0.3,
		})),
		...sfxs
			.map((sfx): MetadataRoute.Sitemap[number][] => {
				return [
					{
						url: `${ORIGIN}/?id=${sfx.id}`,
						changeFrequency: 'monthly',
						lastModified: sfx.updatedAt ?? new Date(),
						priority: 0.3,
					},
					{
						url: `${ORIGIN}/?q=${sfx.text}`,
						changeFrequency: 'monthly',
						lastModified: sfx.updatedAt ?? new Date(),
						priority: 0.1,
					},
				]
			})
			.flat(2),
	]
}
