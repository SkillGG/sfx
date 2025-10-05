import { cn } from '@/utils/utils'
import { getArticleBySlug, getArticles } from '@/articles'
import BlogHeader from '../_components/Header'
import Tag from '../_components/Tag'
import { notFound } from 'next/navigation'
import { BackLink } from './back'
import type { Metadata } from 'next'

export const dynamic = 'force-static'

import '@/styles/blog.css'
import Link from 'next/link'
import { AuthorLink } from '../_components/AuthorLink'
import { ArticleDate } from '../_components/ArticleDate'
import { ArticleFooter } from '../_components/Footer'

export async function generateStaticParams() {
	const posts = getArticles()
	return posts.map(p => ({ slug: p.slug }))
}

export const generateMetadata = async (
	props: PageProps<'/blog/[slug]'>,
): Promise<Metadata> => {
	const param = await props.params
	const post = getArticleBySlug(param.slug)

	if (!post) return {}

	return { title: `${post.title} - SFX Vault Blog` }
}

const ArticlePage = async (props: PageProps<'/blog/[slug]'>) => {
	const params = await props.params
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
							<BackLink
								className={cn(
									'text-sm underline-offset-4',
									'text-(--button-submit-nobg-text)',
									'hover:underline',
								)}
							>
								← Go back
							</BackLink>
						</nav>
					</header>
				}
			/>

			<article
				className={cn(
					'rounded-lg border border-(--regular-border)',
					'bg-(--main-bg)/60 px-6 py-2 shadow-sm',
					'has-[.no-border]:border-none has-[.no-border]:shadow-none',
				)}
				aria-labelledby={`post_${post.slug}_title`}
			>
				<section className={cn('max-w-none', 'text-(--blog-paragraph-text)')}>
					{post.content}
				</section>

				<ArticleFooter post={post} />
			</article>
		</main>
	)
}

export default ArticlePage
