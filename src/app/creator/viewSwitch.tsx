import { cn } from '@/utils/utils'
import { useMediaQuery } from '@uidotdev/usehooks'
import type { ClassValue } from 'clsx'
import {
	useEffect,
	type Dispatch,
	type MouseEventHandler,
	type SetStateAction,
} from 'react'
import { EditIcon, SplitIcon } from '../_components/icons'

export type CreatorView = 'create' | 'edit' | null

export const ViewSwitch = ({
	view,
	setView,
	className,
}: {
	view: CreatorView
	setView: Dispatch<SetStateAction<CreatorView>>
	className?: ClassValue
}) => {
	// Show single view only when width >= 64rem
	const isLarge = useMediaQuery('(width >= 64rem)')
	useEffect(() => {
		if (!isLarge) {
			if (view === null) {
				setView('create')
			}
		}
	}, [isLarge, view, setView])

	const handleChangeView =
		(dir = 1): MouseEventHandler =>
		e => {
			e.preventDefault()
			const states = ['create', 'edit', null] as const
			const curState = states.indexOf(view)
			const nNumber = curState + Math.sign(dir)
			const cap = isLarge ? 3 : 2

			if (nNumber < 0)
				setView(states[cap - 1] ?? null) // loop when decrementing
			else if (nNumber >= cap)
				setView(states[0] ?? null) // loop when incrementing
			else setView(states[nNumber] ?? null) // change normally
		}

	const icon =
		view === null ? (
			'+'
		) : view === 'edit' ? (
			isLarge ? (
				<SplitIcon className={'fill-(--label-text)'} />
			) : (
				'+'
			)
		) : (
			<EditIcon className={'stroke-(--label-text)'} />
		)

	return (
		<button
			onClick={handleChangeView()}
			onContextMenu={handleChangeView(-1)}
			className={cn('w-[24px] text-center', className)}
		>
			{icon}
		</button>
	)
}
