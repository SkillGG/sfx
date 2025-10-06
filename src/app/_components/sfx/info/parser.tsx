import {
	Parser,
	type FieldBase,
	type ImageField,
	type LinkField,
} from '@/utils/parse/sfxParse'
import { Fragment } from 'react'

export type RichStringField = { type: 'string'; value: React.ReactNode }

export type InfoField = Omit<FieldBase, 'hidden' | 'index' | 'jumpedFrom'> &
	(LinkField | RichStringField | ImageField)

export const parseInfoField = (line: string): InfoField => {
	const regParse = Parser.asField(line)

	if (regParse.type === 'link') return regParse
	if (regParse.type === 'img') return regParse

	const str = line.trim()

	return {
		type: 'string',
		value: !str ? (
			<br />
		) : (
			<>
				{str
					.replace(/\\t/g, '\t')
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
