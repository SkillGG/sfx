import { cn } from '@/utils/utils'
import Link from 'next/link'

export const Tag = ({
	children,
	className,
	tag,
}: {
	tag: string
	children: string
	className?: string
}) => {
	return (
		<Link
			className={cn(
				'rounded-full border border-(--regular-border)',
				'bg-(--blog-tag-bg)/20 px-2 py-0.5',
				'text-xs text-(--blog-tag-text)',
				className,
			)}
			href={`/blog/tag/${tag}`}
		>
			{children}
		</Link>
	)
}

export default Tag
