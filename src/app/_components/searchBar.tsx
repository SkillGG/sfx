import { cn } from '@/utils/utils'
import type { ClassValue } from 'clsx'
import { useEffect, useState } from 'react'

const PLACEHOLDERS = [
	'waku waku',
	'lang:en,ja',
	'id:123',
	'id:12',
	'id:56',
	'わくわく lang:en',
	'woof lang:ja',
	'bang',
	'もぐもぐ lang:en,ja',
	'splash lang:fr',
	'trzask',
	'flowing water',
	'zgrzt lang:en,de',
] as const

const SearchBar = ({
	setSearch,
	value,
	classNames,
}: {
	value?: string
	setSearch: React.Dispatch<React.SetStateAction<string>>
	classNames?: {
		container?: ClassValue
		input?: ClassValue
		label?: ClassValue
	}
}) => {
	const [placeholder, setPlaceholder] = useState<string>(PLACEHOLDERS[0])

	useEffect(() => {
		const randomInt = Math.floor(Math.random() * PLACEHOLDERS.length)
		const pholder = PLACEHOLDERS[randomInt]
		setPlaceholder(pholder ?? PLACEHOLDERS[0])
	}, [])

	return (
		<form
			role='search'
			onSubmit={e => e.preventDefault()}
			className={cn('flex w-fit flex-row gap-2', classNames?.container)}
			aria-label='Search SFX'
		>
			<label className={cn('sr-only', classNames?.label)}>Search SFX</label>
			<input
				type='search'
				onChange={e => setSearch(e.currentTarget.value)}
				placeholder={placeholder}
				value={value}
				className={cn(
					'rounded border bg-(color:--input-bg) px-2 py-2 text-(color:--input-text)',
					'border-(color:--input-border) placeholder-(--input-placeholder-text)',
					'focus:border-(color:input-focus-border)',
					'focus:ring-1 focus:outline-none',
					'focus:ring-(color:--input-focus-border)',
					classNames?.input,
				)}
				aria-label='Search SFX'
				autoComplete='off'
				name='q'
			/>
		</form>
	)
}

export default SearchBar
