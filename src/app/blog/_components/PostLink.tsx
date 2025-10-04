import type { Article } from '@/articles'
import { cn } from '@/utils/utils'
import Tag from './Tag'
import Link from 'next/link'

export const PostLink = ({ post }: { post: Article }) => {
	return (
		<li
			key={post.slug}
			className={cn('list-none')}
		>
			<article
				className={cn(
					'rounded-lg border border-(--regular-border)',
					'bg-(--main-bg)/60 p-4 shadow-sm',
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
					<p className={cn('text-sm text-(--label-text)')}>
						{new Date(post.date).toLocaleDateString()}
					</p>
				</header>
				<p className={cn('mt-2 text-(--regular-text)')}>{post.description}</p>
				{post.tags && post.tags.length > 0 && (
					<ul className={cn('mt-3 flex flex-wrap gap-2')}>
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
			</article>
		</li>
	)
}
