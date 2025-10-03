import { cn } from '@/utils/utils'
import { getArticleBySlug, getArticles } from '@/articles'
import BlogHeader from '../_components/Header'
import Tag from '../_components/Tag'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-static'

export async function generateStaticParams() {
	const posts = getArticles()
	return posts.map(p => ({ slug: p.slug }))
}

const ArticlePage = async ({
	params: asyncParams,
}: {
	params: Promise<{ slug: string }>
}) => {
	const params = await asyncParams
	const post = getArticleBySlug(params.slug)
	if (!post) return notFound()

	return (
		<main className={cn('mx-auto w-full max-w-3xl px-4 py-8')}>
			<BlogHeader
				title={
					<header className={cn('space-y-1')}>
						<h1
							id={`post_${post.slug}_title`}
							className={cn('text-3xl font-bold text-(--header-text)')}
						>
							{post.title}
						</h1>
						<nav aria-label='Breadcrumb'>
							<Link
								href='/blog'
								className={cn(
									'text-sm underline-offset-4',
									'text-(--button-submit-nobg-text)',
									'hover:underline',
								)}
							>
								← Go back
							</Link>
						</nav>
					</header>
				}
			/>

			<article
				className={cn(
					'rounded-lg border border-(--regular-border)',
					'bg-(--main-bg)/60 px-6 py-2 shadow-sm',
				)}
				aria-labelledby={`post_${post.slug}_title`}
			>
				<section
					className={cn(
						'prose prose-invert max-w-none',
						'text-(--blog-paragraph-text)',
					)}
				>
					{post.content}
				</section>
				<footer className='w-full'>
					<div
						className={cn(
							'flex flex-row flex-wrap items-center justify-end gap-6',
						)}
					>
						<span className={cn('text-sm text-(--label-text)')}>
							{post.author}
						</span>
						<span className={cn('text-sm text-(--label-text)')}>•</span>
						<span className={cn('text-sm text-(--label-text)')}>
							{new Date(post.date).toLocaleDateString()}
						</span>
						{post.tags && post.tags.length > 0 && (
							<>
								<span className={cn('text-sm text-(--label-text)')}>•</span>
								<ul className={cn('m-0 flex flex-row flex-wrap gap-2 p-0')}>
									{post.tags.map(t => (
										<li
											key={t}
											className={cn('list-none')}
										>
											<Tag tag={t}>{t}</Tag>
										</li>
									))}
								</ul>
							</>
						)}
					</div>
				</footer>
			</article>
		</main>
	)
}

export default ArticlePage
