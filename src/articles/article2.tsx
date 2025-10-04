import { PostLink } from '@/app/blog/_components/PostLink'
import type { Article } from '.'
import { UpdateArticles } from './updates'
import { cn } from '@/utils/utils'

export const Article2: Article = {
	author: 'Skillu',
	date: new Date(1759602221711),
	description:
		'A list of "daily" update posts about the page\'s development and data-insertions.',
	featured: true,
	slug: 'daily-list',
	title: 'Daily updates',
	tags: ['update', 'devlog'],
	content: (
		<>
			<section className='text-justify'>
				<ul className={cn('m-0 flex flex-row flex-wrap gap-2 p-0')}>
					{UpdateArticles.map(q => (
						<PostLink
							post={q}
							key={q.slug}
						/>
					))}
				</ul>
			</section>
		</>
	),
}
