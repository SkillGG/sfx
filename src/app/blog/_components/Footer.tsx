import type { Article } from '@/articles'
import { cn } from '@/utils/utils'
import { ArticleDate } from './ArticleDate'
import { AuthorLink } from './AuthorLink'
import Tag from './Tag'

export const ArticleFooter = ({ post }: { post: Article }) => {
	return (
		<footer className='flex w-full items-center'>
			<ArticleDate date={post.date} />
			<AuthorLink author={post.author} />
			{post.tags && post.tags.length > 0 && (
				<ul className={cn('flex flex-wrap gap-2')}>
					{post.tags.map(t => (
						<li
							key={t}
							className={cn('list-none')}
						>
							<Tag tag={t}>{t}</Tag>
						</li>
					))}
				</ul>
			)}
		</footer>
	)
}
