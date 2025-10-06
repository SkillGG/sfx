import type { CollapsedOnomatopoeia } from '@/utils/utils'

import { cn } from '@/utils/utils'
import { useMemo, useRef, type RefObject } from 'react'
import { parseInfo, type InfoField } from './parser'
import { LinkField, MultiIMGField, RichStringField } from '../fields'
import { InfoIcon } from '../../icons'

const DEFAULT_INFOBUTTONTITLE = 'See more'

const infoButtonTitle: Record<string, string | undefined> = {
	en: DEFAULT_INFOBUTTONTITLE,
	ja: 'もっと',
}

export const SFXInfoButton = ({ sfx }: { sfx: CollapsedOnomatopoeia }) => {
	const title = infoButtonTitle[sfx.language] ?? DEFAULT_INFOBUTTONTITLE

	const dialog = useRef<HTMLDialogElement>(null)

	if (!sfx.info) return null

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

const SFXInfoField = ({ field }: { field: InfoField }) => {
	switch (field.type) {
		case 'string':
			return (
				<RichStringField
					field={{ hidden: false, index: 0, ...field }}
					type='def'
				/>
			)
		case 'link':
			return (
				<LinkField
					field={{ hidden: false, index: 0, ...field }}
					type='def'
				/>
			)
		case 'img':
			return <MultiIMGField fields={[{ hidden: false, index: 0, ...field }]} />
	}
	return null
}

const parseSFXInfo = (info: string | null): React.ReactNode => {
	if (!info) return null

	const parsed = parseInfo(info)

	return (
		<>
			{parsed.map(q => (
				<SFXInfoField
					key={q.key}
					field={q}
				/>
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
	const dialog = useMemo(() => parseSFXInfo(sfx.info), [sfx])

	if (!dialog)
		return (
			<dialog
				className='hidden'
				popover='auto'
				ref={ref}
			>
				No data to show!
			</dialog>
		)

	return (
		<dialog
			popover={`auto`}
			ref={ref}
			className={cn(
				'm-auto min-w-[50%] rounded-xl border',
				'border-(--regular-border) bg-(--dialog-bg)/50 p-6 shadow-lg backdrop-blur-sm',
			)}
		>
			{dialog}
		</dialog>
	)
}
