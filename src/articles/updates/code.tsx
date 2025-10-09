'use client'

import { ClipboardIcon } from '@/app/_components/icons'
import { cn } from '@/utils/utils'
import type React from 'react'
import { useEffect, useState } from 'react'

export const QuoteCode = ({
	children,
	value,
	fadeout,
}: React.PropsWithChildren<{ value: string; fadeout?: number }>) => {
	const [copied, setCopied] = useState<boolean>(false)

	useEffect(() => {
		const timeout = setTimeout(() => {
			setCopied(false)
		}, fadeout ?? 1000)
		return () => {
			clearTimeout(timeout)
		}
	}, [copied, fadeout])

	return (
		<code className='relative my-2 block w-full p-2 backdrop-brightness-(--quote-brightness)'>
			{children}
			<button
				title={copied ? 'Copied!' : 'Copy to clipboard'}
				aria-label={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
				className={cn(
					'absolute top-1 right-1 hover:cursor-pointer hover:brightness-150',
					copied && 'text-green-400',
				)}
				onClick={async e => {
					await navigator.clipboard.writeText(value)
					setCopied(true)
				}}
			>
				{copied ? (
					<ClipboardIcon
						key={`copyicon${value}`}
						classNames={{ svg: 'w-4 h-4', content: 'stroke-green-500' }}
					/>
				) : (
					<ClipboardIcon
						key={`copyicon${value}`}
						classNames={{ svg: 'w-4 h-4', content: 'stroke-(--accent-500)' }}
					/>
				)}
			</button>
		</code>
	)
}
