import {
	parseSFXFields,
	type SFXField,
	type SFXFieldsData,
} from '@/utils/parse/sfxParse'
import type { LangObject } from '@/utils/utils'
import type { SFXTLDiscriminator } from './utils'
import { api } from '@/trpc/server'
import type { CSSProperties } from 'react'

const allowedFields: SFXField['type'][] = ['string', 'sfxlink']

const FieldTypeStyles: (
	scale: number,
) => Record<
	keyof SFXFieldsData | `${keyof SFXFieldsData}_j`,
	CSSProperties
> = scale => ({
	read: { fontSize: `${18 / scale}px`, color: '#60a5fa' }, //"text-sm ml-2 text-(--sfx-read-text)",
	read_j: {
		marginLeft: '2.3em',
		fontSize: `${18 / scale}px`,
		color: '#60a5fa',
	}, //"text-sm text-(--sfx-read-text) ml-[2.3em]",
	extra: { fontSize: `${14 / scale}px`, color: '#3b82f6' }, //"text-sm whitespace-pre-wrap text-(--sfx-extra-text)",
	extra_j: {
		marginLeft: '2.3em',
		fontSize: `${14 / scale}px`,
		color: '#3b82f6',
	}, //"text-sm whitespace-pre-wrap text-(--sfx-extra-text) ml-[2.3em]",
	tlExtra: {}, //"text-base text-(--sfx-tlextra-text)",
	tlExtra_j: {}, //"text-sm text-(--sfx-extra-text) ml-[2.3em]",
	def: { color: '#93c5fd', fontSize: `${18 / scale}px` }, //"text-(--sfx-def-text)",
	def_j: { marginLeft: '2.3em', color: '#93c5fd', fontSize: `${18 / scale}px` }, //"text-(--sfx-def-text) ml-[2.3em]",
})

const SimpleField = async ({
	field,
	type,
	textScale,
}: {
	field: SFXField
	type: keyof SFXFieldsData
	textScale: number
}) => {
	const cType: keyof ReturnType<typeof FieldTypeStyles> =
		`${field.jumpedFrom ?? type}${field.jumpedFrom ? '_j' : ''}`
	if (field.hidden) {
		return null
	}
	switch (field.type) {
		case 'string':
			return (
				<div
					key={field.index}
					style={{ ...FieldTypeStyles(textScale)[cType], display: 'flex' }}
				>
					<span style={{ fontFamily: 'monospace', marginRight: '2px' }}>
						{field.counter ? `${field.counter}.  ` : ''}
					</span>
					{field.value}
				</div>
			)
		case 'sfxlink':
			const link = await field.consume?.(api)

			const labels = {
				pre: field.preLabel ?? (field.postLabel ? '' : 'See also'),
				post: field.postLabel ?? '',
				sep: field.labelSeparator ?? ',',
				inx: { pre: field.inLabel?.pre ?? '', post: field.inLabel?.post ?? '' },
			}

			return (
				<div
					key={field.index}
					style={{ ...FieldTypeStyles(textScale)[cType], display: 'flex' }}
				>
					{labels.pre}
					{link
						?.map(q => `${labels.inx.pre}${q.label}${labels.inx.post}`)
						.join(labels.sep) ?? `${field.ids.join(labels.sep)}`}
					{labels.post}
				</div>
			)
		default:
			return null
	}
}

const SimpleSFX = ({
	parsed,
	text,
	tls,
	titleId,
	textScale: txtScale,
	style,
}: {
	parsed: ReturnType<typeof parseSFXFields>
	text: string
	tls: SFXTLDiscriminator['sfx']['tls']
	titleId: string
	textScale?: number
	style?: CSSProperties
}) => {
	const textScale = txtScale ?? 1
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				borderRadius: '8px',
				border: '1px dashed #1d4ed8',
				borderStyle: 'dashed',
				minWidth: '80%',
				backgroundColor: '#374151',
				padding: '12px 16px',
				boxShadow: '0 1px 2px 0 #1e3a8a',
				...style,
			}}
			aria-labelledby={titleId}
			aria-label='SFX entry'
		>
			<div style={{ display: 'flex', alignItems: 'baseline' }}>
				<div
					style={{
						display: 'flex',
						alignSelf: 'center',
						paddingRight: '8px',
						fontSize: `${30 / textScale}px`,
						fontWeight: 900,
						color: '#e0e7ff',
						fontFamily: `ui-sans-serif, system-ui, sans-serif`,
					}}
					id={titleId}
				>
					{text}
				</div>

				{parsed.read && (
					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							color: '#60a5fa',
							marginLeft: '15px',
						}}
					>
						{parsed.read
							.filter(q => allowedFields.includes(q.type))
							.map(z => (
								<SimpleField
									key={z.key}
									field={z}
									type='read'
									textScale={textScale * 1.5}
								/>
							))}
					</div>
				)}
			</div>

			<div
				style={{ display: 'flex', flexDirection: 'column', marginLeft: '25px' }}
				aria-labelledby={titleId}
				aria-label='SFX details'
			>
				<div
					style={{ display: 'flex', flexDirection: 'column', color: '#93c5fd' }}
				>
					{parsed.def
						?.filter(q => allowedFields.includes(q.type))
						.map(z => (
							<SimpleField
								key={z.key}
								field={z}
								textScale={textScale}
								type='def'
							/>
						))}
				</div>
				<div style={{ display: 'flex', paddingLeft: '35px' }}>
					{parsed.extra
						?.filter(q => allowedFields.includes(q.type))
						.map(z => (
							<SimpleField
								key={z.key}
								field={z}
								textScale={textScale}
								type='extra'
							/>
						))}
				</div>
			</div>

			{tls.length > 0 && (
				<>
					<div
						style={{
							display: 'flex',
							justifyContent: 'center',
							margin: '5px auto 0 auto',
						}}
						aria-labelledby={titleId}
						aria-label='SFX translation list'
					>
						{tls
							.filter((_, i) => i < 2)
							.map((tl, i, a) => {
								return (
									<SimpleSFX
										key={`tl_${tl.sfx.id}`}
										parsed={parseSFXFields(tl.sfx)}
										text={tl.sfx.text}
										titleId={`sfx_${tl.sfx.id}_title`}
										tls={[]}
										style={{
											minWidth: a.length > 1 ? '' : '80%',
											width: a.length > 1 ? '50%' : '80%',
										}}
										textScale={1.5}
									/>
								)
							})}
					</div>
				</>
			)}
		</div>
	)
}

export const SimpleSFXCard = async ({
	sfx,
	size,
}: SFXTLDiscriminator & {
	langs?: LangObject[]
	tlExtra?: string
	size: { width: number; height: number }
}) => {
	const titleId = `sfx_${sfx.id}_title`

	const parsed = parseSFXFields(sfx)

	return (
		<div
			style={{
				display: 'flex',
				width: `${size.width}px`,
				height: `${size.height}px`,
				backgroundColor: '#1e293b',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<SimpleSFX
				parsed={parsed}
				titleId={titleId}
				text={sfx.text}
				tls={sfx.tls}
			/>
		</div>
	)
}
