import type { Article } from '..'
import { Update as Update1 } from './update1'
import { Update as Update2 } from './update2'
import { Update as Update3 } from './update3'
import { Update as Update4 } from './update4'
import { Update as Update5 } from './update5'
// +import

const us = [
	Update1,
	Update2,
	Update3,
	Update4,
	Update5,
	// +array
]

export const UpdateArticles: Article[] = us.map((q, i) => ({
	...q,
	tags: [...new Set([...(q.tags ?? []), 'update', 'devlog'])],
	id: i,
}))
