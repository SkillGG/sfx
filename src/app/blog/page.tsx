import { cn } from '@/utils/utils'
import { getArticles } from '@/articles'
import BlogHeader from './_components/Header'
import { PostLink } from './_components/PostLink'

const BlogPage = () => {
	const posts = getArticles()

	return (
		<main className={cn('mx-auto w-full max-w-3xl px-4 py-8')}>
			<BlogHeader
				title={
					<>
						{' '}
						<div>
							<h1 className={cn('text-3xl font-bold text-(--header-text)')}>
								SFX Vault&apos;s Blog
							</h1>
							<p className={cn('text-(--regular-text)')}>
								News, tips, and updates.
							</p>
						</div>
					</>
				}
			/>

			<section aria-label='Articles list'>
				<ul className={cn('flex flex-col gap-4')}>
					{posts.map(post => (
						<PostLink
							key={post.slug}
							post={post}
						/>
					))}
				</ul>
			</section>
		</main>
	)
}

export default BlogPage
