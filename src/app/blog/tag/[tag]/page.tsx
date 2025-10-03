import { cn } from '@/utils/utils'
import Link from 'next/link'
import { getArticles } from '@/articles'
import BlogHeader from '@/app/blog/_components/Header'
import Tag from '@/app/blog/_components/Tag'

const TagSearch = async ({ params }: { params: Promise<{ tag: string }> }) => {
	const posts = getArticles()

	const { tag } = await params

	return (
		<main className={cn('mx-auto w-full max-w-3xl px-4 py-8')}>
			<BlogHeader
				title={
					<>
						<header>
							<h1 className={cn('text-3xl font-bold text-(--header-text)')}>
								Tag: {tag}
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
					</>
				}
			/>

			<section aria-label='Articles list'>
				<ul className={cn('flex flex-col gap-4')}>
					{posts
						.filter(p => p.tags?.includes(tag))
						.map(post => (
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
											className={cn(
												'text-xl font-semibold text-(--header-text)',
											)}
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
									<p className={cn('mt-2 text-(--regular-text)')}>
										{post.description}
									</p>
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
						))}
				</ul>
			</section>
		</main>
	)
}

export default TagSearch
