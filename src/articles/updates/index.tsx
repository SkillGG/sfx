import type { Article } from '..'
import { Update as Update1 } from './update1'
import { Update as Update2 } from './update2'
import { Update as Update3 } from './update3'

export const UpdateArticles: Article[] = [Update1, Update2, Update3].map(q => ({
	...q,
	tags: [...new Set([...(q.tags ?? []), 'update', 'devlog'])],
}))
