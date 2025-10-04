import type { Article } from '..'
import { Update as Update1 } from './update1'

export const UpdateArticles: Article[] = [Update1].map(q => ({
	...q,
	tags: [...new Set([...(q.tags ?? []), 'update', 'devlog'])],
}))
