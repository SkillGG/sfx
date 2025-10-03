'use client'

import { cn, type CollapsedOnomatopoeia, type Promisable } from '@/utils/utils'
import React, { useEffect, useState } from 'react'
import { type Validation } from '../../hooks/validation'
import type { ClassValue } from 'clsx'
import {
	type SaveState,
	type SFXCardClasses,
	type SFXTLDiscriminator,
} from './utils'
import { SFXEdit, type SFXEditClassNames } from './edit'
import { SFXCard } from './card'

export const REVERSE_MARK = '⏉'

export const DEFAULT_SFX_INPUT_STYLES = (
	validation?: Validation,
	field?: string,
) =>
	cn(
		'rounded border px-2 py-1 text-(--sfx-input-text)',
		'bg-(--sfx-input-bg) placeholder-(--sfx-input-placeholder-text)/50 focus:ring-1 focus:outline-none',
		'border-(--sfx-input-border) focus:border-(--input-focus-border)',
		'focus:ring-(--input-focus-border)',
		validation &&
			validation.hasFieldError(field ?? '') &&
			'border-2 border-(--sfx-input-error-border)' +
				' ' +
				'placeholder-(--sfx-input-error-text)/50' +
				' ' +
				'focus:border-(--sfx-input-error-border)' +
				' ' +
				'focus:ring-(--sfx-input-error-border)',
	)

export const DEFAULT_SFX_LABEL_STYLES = cn(
	'mt-1 flex-1 font-medium whitespace-nowrap',
	'text-(color:--sfx-label-text)',
)

export type SFXClasses = {
	default?: SFXCardClasses
	edit?: SFXEditClassNames
	editable?: {
		main?: ClassValue
		sfx?: SFXClasses
		edit?: {
			main?: ClassValue
			buttonEdit?: ClassValue
			buttonRemove?: ClassValue
		}
	}
}

export type SFXLabels = {
	edit?: string
	removeDefault?: string
	removeSure?: string
	removing?: string
	separate?: string
}

export const SFX = ({
	sfx,
	editable,

	classNames,

	separate,

	onSave,
	onRemove,
	tlExtra,
	labels,

	allowDeeperTLs,
	dev,
}: SFXTLDiscriminator & {
	classNames?: SFXClasses

	onSave?: (
		prev: CollapsedOnomatopoeia,
	) => Promisable<CollapsedOnomatopoeia | void>
	onRemove?: () => Promisable<void>

	separate?: (sfx: CollapsedOnomatopoeia) => void
	editable?: boolean | undefined
	tlExtra?: string
	labels?: SFXLabels

	allowDeeperTLs?: boolean
	dev?: boolean
}) => {
	const [sfxCopy, setSFXCopy] = useState<CollapsedOnomatopoeia>({ ...sfx })

	useEffect(() => {
		// console.log("Rendering new SFX", sfx.id);
		setSFXCopy(sfx)
	}, [sfx])

	const [mode, setMode] = useState<'edit' | 'view'>('view')

	const [removing, setRemoving] = useState(false)
	const [removeSure, setRemoveSure] = useState(false)

	const [saveState, setSaveState] = useState<SaveState>('default')

	const removeLabel = removing
		? (labels?.removing ?? 'Removing...')
		: removeSure
			? (labels?.removeSure ?? 'Are you sure?')
			: (labels?.removeDefault ?? 'Remove')

	if (
		editable &&
		!(
			tlExtra?.startsWith(REVERSE_MARK) ||
			sfx.tls.some(q => q.additionalInfo?.startsWith(REVERSE_MARK))
		) // prevent edit buttons from showing on reverse searches
	) {
		if (mode === 'view')
			return (
				<div
					className={cn(
						'relative mb-2 flex flex-col gap-2',
						classNames?.editable?.main,
					)}
				>
					<SFX
						sfx={sfxCopy}
						classNames={
							classNames?.editable?.sfx ?? { default: classNames?.default }
						}
						dev={dev}
					/>
					<div
						className={cn(
							'mx-auto flex w-full max-w-[50%] gap-2',
							classNames?.editable?.edit?.main,
						)}
					>
						<button
							className={cn(
								'flex-1 cursor-pointer rounded bg-(--button-submit-bg) px-4 py-2 text-(--button-submit-text)',
								'transition-colors',
								'hover:bg-(--button-submit-hover-bg)',
								'focus:ring-2 focus:ring-(--input-focus-border) focus:ring-offset-2',
								'focus:ring-offset-(color:--main-bg) focus:outline-none',
								'disabled:bg-(--button-submit-disabled-bg) disabled:text-(--button-submit-disabled-text)',
								classNames?.editable?.edit?.buttonEdit,
							)}
							onClick={() => (setMode('edit'), setSaveState('default'))}
							type='button'
						>
							{labels?.edit ?? 'Edit'}
						</button>
						<button
							className={cn(
								'flex-1 cursor-pointer rounded bg-(--sfx-button-remove-bg) px-4 py-2 text-(--sfx-button-remove-text)',
								'transition-colors',
								'hover:bg-(--sfx-button-remove-hover-bg)',
								'focus:ring-2 focus:ring-(--input-focus-border) focus:ring-offset-2',
								'focus:ring-offset-(color:--main-bg) focus:outline-none',
								'disabled:bg-(--sfx-button-remove-disabled-bg) disabled:text-(--sfx-button-remove-disabled-text)',
								classNames?.editable?.edit?.buttonRemove,
							)}
							onClick={async () => {
								if (!removeSure) {
									setRemoveSure(true)
									return
								}
								setRemoving(true)
								await onRemove?.()
								setRemoving(false)
								setRemoveSure(false)
							}}
							onBlur={() => {
								setRemoveSure(false)
							}}
						>
							{removeLabel}
						</button>
					</div>
				</div>
			)

		return (
			<SFXEdit
				sfx={sfxCopy}
				allowDeeperTLs={allowDeeperTLs}
				classNames={classNames?.edit}
				onCancel={() => {
					setSFXCopy(sfx)
					setMode('view')
				}}
				separate={
					separate
						? sfx => {
								separate(sfx)
								setMode('view')
							}
						: undefined
				}
				separateLabel={labels?.separate}
				onSaveClicked={async () => {
					setSaveState('waiting')
					await onSave?.(sfxCopy)
					setSaveState('done')
					setMode('view')
				}}
				saveBtnState={saveState}
				onChange={action => {
					setSFXCopy(action(sfxCopy))
				}}
				tlAddInfoElem={<>{tlExtra ?? ''}</>}
				dev={dev}
			/>
		)
	}

	return (
		<SFXCard
			sfx={sfxCopy}
			classNames={classNames?.default}
			tlExtra={tlExtra}
			dev={dev}
		/>
	)
}
