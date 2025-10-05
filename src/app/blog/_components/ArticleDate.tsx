import { cn } from '@/utils/utils'

export const ArticleDate = ({ date }: { date: Date }) => {
	return (
		<p className={cn('text-sm text-(--accent-500) saturate-0')}>
			{new Date(date).toLocaleDateString()}
		</p>
	)
}
