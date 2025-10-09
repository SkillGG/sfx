import { Parser, type FieldBase, type ImageField } from '@/utils/parse/sfxParse'
import { makeRegexLineIndependent } from '@/utils/utils'
import { Fragment } from 'react'

export type RichStringField = { type: 'string'; value: React.ReactNode }

export type InfoField = Omit<FieldBase, 'hidden' | 'index' | 'jumpedFrom'> &
	(RichStringField | ImageField) & { style: 'def' | 'read' | 'extra' }

export const parseInfoField = (line: string): InfoField => {
	const regParse = Parser.asField(line)

	if (regParse.type === 'img') return { ...regParse, style: 'def' }

	const str = line.trim()

	const links: { url: string; label: string }[] = []

	return {
		type: 'string',
		style: 'def',
		value: !str ? (
			<br />
		) : (
			<>
				{str
					.replace(/\\t/g, '\t')
					.replace(makeRegexLineIndependent(Parser.linkRegex), match => {
						console.log('found a link!', match)

						const utf8PUACode = 57344 // '\ue000'.codePointAt(0);

						const utf8CodePoint = `${String.fromCodePoint(utf8PUACode + links.length)}`

						return utf8CodePoint
					})
					.split('')
					.map((q, i) => {
						switch (q) {
							case '\t':
								return (
									<Fragment key={`tab_space#${i}_from${q}`}>&emsp;</Fragment>
								)
							default:
								return q
						}
					})}
			</>
		),
		key: str,
	}
}

export const parseInfo = (str: string): InfoField[] => {
	const lines = str.split('\n')
	return lines
		.map(parseInfoField)
		.map((q, i) => ({ ...q, key: `${q.key.substring(0, 5)}${i}` }))
}
