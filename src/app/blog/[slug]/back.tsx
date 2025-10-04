'use client'

import { cn } from '@/utils/utils'
import type { ClassValue } from 'clsx'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export const BackLink = ({
	children,
	className,
}: React.PropsWithChildren<{ className?: ClassValue }>) => {
	const router = useRouter()

	return (
		<Link
			href={''}
			className={cn(className)}
			onNavigate={e => {
				e.preventDefault()
				router.back()
			}}
		>
			{children}
		</Link>
	)
}
