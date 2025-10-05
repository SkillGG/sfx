import { cn } from '@/utils/utils'
import Link from 'next/link'
import { getArticles } from '@/articles'
import BlogHeader from '@/app/blog/_components/Header'

import '@/styles/blog.css'
import { ArticleLink } from '../../_components/ArticleLink'

export async function generateStaticParams() {
	const posts = getArticles()

	const authors = new Set<string>()

	for (const post of posts) {
		authors.add(post.author)
	}

	return [...authors].map(author => ({ author }))
}

const TagSearch = async ({
	params,
}: {
	params: Promise<{ author: string }>
}) => {
	const posts = getArticles()

	const { author } = await params

	return (
		<main className={cn('mx-auto w-full max-w-3xl px-4 py-8')}>
			<BlogHeader
				title={
					<>
						<header>
							<h1 className={cn('text-3xl font-bold text-(--header-text)')}>
								Posts made by {author}
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
						.filter(p => (p.author = author))
						.toReversed()
						.map(post => (
							<ArticleLink
								key={post.slug}
								post={post}
							/>
						))}
				</ul>
			</section>
		</main>
	)
}

export default TagSearch
