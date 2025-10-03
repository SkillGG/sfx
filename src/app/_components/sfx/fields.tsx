import { cn } from '@/utils/utils'
import { Suspense } from 'react'
import { Spinner } from '../spinner'
import type {
	FieldBase,
	ImageField,
	LinkField as LinkFieldType,
	SFXField,
	SFXFieldsData,
	SFXLinkField as SFXLinkFieldType,
	StringField as StringFieldType,
} from '@/utils/parse/sfxParse'
import type { ClassValue } from 'clsx'
import { LocalImg } from './localImg'
import SfxLink from './sfxLink'
import Link from 'next/link'

export const FieldTypeClasses: Record<
	keyof SFXFieldsData | `${keyof SFXFieldsData}_j`,
	string
> = {
	read: 'text-sm ml-2 text-(--sfx-read-text)',
	read_j: 'text-sm text-(--sfx-read-text) ml-[2.3em]',
	extra: 'text-sm whitespace-pre-wrap text-(--sfx-extra-text)',
	extra_j: 'text-sm whitespace-pre-wrap text-(--sfx-extra-text) ml-[2.3em]',
	tlExtra: 'text-base text-(--sfx-tlextra-text)',
	tlExtra_j: 'text-sm text-(--sfx-extra-text) ml-[2.3em]',
	def: 'text-(--sfx-def-text)',
	def_j: 'text-(--sfx-def-text) ml-[2.3em]',
}

type FieldProps<T> = {
	field: T & FieldBase
	jumped?: boolean
	type: keyof SFXFieldsData
	className?: ClassValue
}

export const StringField = ({
	field,
	type,
	className,
	jumped,
}: FieldProps<StringFieldType>) => {
	const fieldType: keyof typeof FieldTypeClasses = `${type}${jumped ? '_j' : ''}`

	return (
		<div className={cn(FieldTypeClasses[fieldType], className)}>
			<span className='font-mono'>
				{field.counter ? `${field.counter}. ` : ''}
			</span>
			{field.value}
		</div>
	)
}

export const SFXLinkField = ({
	field,
	type,
	className,
	jumped,
}: FieldProps<SFXLinkFieldType>) => {
	const fieldType: keyof typeof FieldTypeClasses = `${type}${jumped ? '_j' : ''}`

	const labels = {
		pre: field.preLabel ?? (field.postLabel ? '' : 'See also'),
		post: field.postLabel ?? '',
		sep: field.labelSeparator ?? ', ',
		inx: { pre: field.inLabel?.pre ?? '', post: field.inLabel?.post ?? '' },
	}

	return (
		<span className={cn(FieldTypeClasses[fieldType], className)}>
			{labels.pre}
			<SfxLink
				ids={field.ids}
				separator={labels.sep}
				surround={labels.inx}
			/>
			{labels.post}
		</span>
	)
}

export const LinkField = ({
	field,
	type,
	className,
	jumped,
}: FieldProps<LinkFieldType>) => {
	const fieldType: keyof typeof FieldTypeClasses = `${type}${jumped ? '_j' : ''}`
	return (
		<Link
			className={cn('underline', FieldTypeClasses[fieldType], className)}
			href={field.url}
		>
			{field.label}
		</Link>
	)
}

export const MultiIMGField = ({
	fields,
	className,
}: {
	fields: (FieldBase & ImageField)[]
	className?: ClassValue
}) => {
	return (
		<div className={cn('mt-1 flex justify-around gap-2')}>
			{fields.map(field => {
				const alt = `Example ${field.index}`
				return (
					<Suspense
						key={`${field.index}_img_${field.url}`}
						fallback={<Spinner className={cn('h-[75px] w-[75px]')} />}
					>
						{field.local ? (
							<LocalImg
								alt={alt}
								filename={field.url}
								classNames={{ img: className }}
							/>
						) : (
							<LocalImg
								alt={alt}
								filename={field.url}
								nonDB={<Spinner className={cn('h-[75px] w-[75px]')} />}
								classNames={{ img: className }}
							/>
						)}
					</Suspense>
				)
			})}
		</div>
	)
}

export const SFXFieldDiv = ({
	field,
	type,
	className,
}: {
	field: SFXField
	type: keyof SFXFieldsData
	className?: ClassValue
}) => {
	switch (field.type) {
		case 'string':
			return (
				<StringField
					field={field}
					type={field.jumpedFrom ?? type}
					jumped={!!field.jumpedFrom}
					className={className}
				/>
			)
		case 'sfxlink':
			return (
				<>
					<SFXLinkField
						field={field}
						type={field.jumpedFrom ?? type}
						jumped={!!field.jumpedFrom}
						className={className}
					/>
				</>
			)
		case 'link':
			return (
				<LinkField
					field={field}
					type={field.jumpedFrom ?? type}
					jumped={!!field.jumpedFrom}
					className={className}
				/>
			)
		case 'img':
			const alt = `Example ${field.index}`
			const img = (
				<Suspense
					key={`${field.index}_img_${field.url}`}
					fallback={<Spinner className={cn('h-[75px] w-[75px]')} />}
				>
					{field.local ? (
						<LocalImg
							alt={alt}
							filename={field.url}
							classNames={{ container: 'mx-auto', img: className }}
						/>
					) : (
						<LocalImg
							alt={alt}
							filename={field.url}
							nonDB={<Spinner className={cn('h-[75px] w-[75px]')} />}
							classNames={{ container: 'mx-auto', img: className }}
						/>
					)}
				</Suspense>
			)

			return img
		default:
			return null
	}
}
