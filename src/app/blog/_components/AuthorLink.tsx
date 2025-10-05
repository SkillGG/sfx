import Link from 'next/link'

export function AuthorLink({ author }: { author: string }) {
	return (
		<Link
			href={`/blog/author/${author}`}
			className='group mr-5 ml-auto text-sm text-(--label-text) saturate-50'
		>
			by{' '}
			<span className='text-(--accent-500) group-hover:text-(--complement-500) group-hover:underline'>
				{author}
			</span>
		</Link>
	)
}
