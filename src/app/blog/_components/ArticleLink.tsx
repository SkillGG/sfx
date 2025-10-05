import type { Article } from '@/articles'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { ArticleFooter } from './Footer'

export const ArticleLink = ({ post }: { post: Article }) => {
	return (
		<li className={cn('list-none')}>
			<article
				className={cn(
					'rounded-lg border border-(--regular-border)',
					'bg-(--main-bg)/60 p-4 shadow-sm brightness-125',
				)}
				aria-labelledby={`post_${post.slug}_title`}
			>
				<header className={cn('space-y-1')}>
					<h2
						id={`post_${post.slug}_title`}
						className={cn('text-xl font-semibold text-(--header-text)')}
					>
						<Link
							href={`/blog/${post.slug}`}
							className={cn('underline-offset-4 hover:underline')}
						>
							{post.title}
						</Link>
					</h2>
				</header>
				<p className={cn('mt-2 text-(--regular-text)')}>{post.description}</p>
				<ArticleFooter post={post} />
			</article>
		</li>
	)
}
