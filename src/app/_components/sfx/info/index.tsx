import type { CollapsedOnomatopoeia } from '@/utils/utils'

import { cn } from '@/utils/utils'
import { useRef, type RefObject } from 'react'

const DEFAULT_INFOBUTTONTITLE = 'See more'

const infoButtonTitle: Record<string, string | undefined> = {
	en: DEFAULT_INFOBUTTONTITLE,
	ja: 'Motto miru',
}

const InfoIcon = ({
	classNames,
}: {
	classNames?: { svg?: string; path?: string }
}) => {
	return (
		<svg
			id='regular-circle-question'
			viewBox='0 0 512 512'
			className={cn(
				'bg-(--main-bg)',
				'fill-(color:--accent-500)',
				classNames?.svg,
			)}
		>
			<path
				d='M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zM256 464c-114.7 0-208-93.31-208-208S141.3 48 256 48s208 93.31 208 208S370.7 464 256 464zM256 336c-18 0-32 14-32 32s13.1 32 32 32c17.1 0 32-14 32-32S273.1 336 256 336zM289.1 128h-51.1C199 128 168 159 168 198c0 13 11 24 24 24s24-11 24-24C216 186 225.1 176 237.1 176h51.1C301.1 176 312 186 312 198c0 8-4 14.1-11 18.1L244 251C236 256 232 264 232 272V288c0 13 11 24 24 24S280 301 280 288V286l45.1-28c21-13 34-36 34-60C360 159 329 128 289.1 128z'
				className={cn(classNames?.path)}
			></path>
		</svg>
	)
}

export const SFXInfoButton = ({ sfx }: { sfx: CollapsedOnomatopoeia }) => {
	const title = infoButtonTitle[sfx.language] ?? DEFAULT_INFOBUTTONTITLE

	const dialog = useRef<HTMLDialogElement>(null)

	if (!sfx.info) return null

	console.log('Got sfx info for sfx', sfx.id, sfx.info)

	return (
		<>
			<SFXInfoBox
				sfx={sfx}
				ref={dialog}
			/>
			<button
				title={title}
				className={cn('cursor-pointer')}
				onClick={() => {
					dialog.current?.showPopover()
				}}
			>
				<InfoIcon classNames={{ svg: 'w-3 h-3' }} />
			</button>
		</>
	)
}

const parseSFXInfo = (info: string | null): React.ReactNode => {
	if (!info) return null
	return (
		<>
			{info.split('\n').map((q, i) => (
				<div key={q + i}>{q}</div>
			))}
		</>
	)
}

export const SFXInfoBox = ({
	sfx,
	ref,
}: {
	sfx: CollapsedOnomatopoeia
	ref: RefObject<HTMLDialogElement | null>
}) => {
	return (
		<dialog
			popover={`auto`}
			ref={ref}
			className={cn(
				'm-auto min-w-[50%] rounded-xl border',
				'border-(--regular-border) bg-(--dialog-bg)/50 p-6 shadow-lg backdrop-blur-sm',
			)}
		>
			{parseSFXInfo(sfx.info) ?? ''}
		</dialog>
	)
}
