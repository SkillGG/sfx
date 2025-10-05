import type { Article } from '.'
import { UpdateArticles } from './updates'
import { cn } from '@/utils/utils'
import Link from 'next/link'

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
			<section className='no-border mb-2 text-justify'>
				<h2>
					A list of &quot;daily&quot; updates about the developement of the
					site.
				</h2>
				<ol className={cn('mx-auto flex w-[50%] rounded-xl border-1 py-2')}>
					{UpdateArticles.map((q, i) => (
						<li
							key={q.slug}
							className={cn(
								'flex w-full list-none px-2 even:backdrop-brightness-[125%] hover:backdrop-brightness-200',
							)}
						>
							<div className='font-mono'>{i + 1}.</div>
							<Link
								href={`/blog/${q.slug}/?back=daily-list`}
								className='w-full flex-1 justify-center text-center underline'
							>
								{q.title}
							</Link>
						</li>
					))}
				</ol>
			</section>
		</>
	),
}
