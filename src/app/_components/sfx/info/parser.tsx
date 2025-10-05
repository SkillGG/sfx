import type { FieldBase, LinkField } from '@/utils/parse/sfxParse'

type StringField = { type: 'string'; value: string }

export type InfoField = Omit<FieldBase, 'hidden' | 'index' | 'jumpedFrom'> &
	(LinkField | StringField)

export const parseInfoField = (line: string): InfoField => {
	return { type: 'string', value: line.trim(), key: line.trim() }
}

export const parseInfo = (str: string): InfoField[] => {
	const lines = str.split('\n').filter(q => !!q)
	return lines
		.map(parseInfoField)
		.map((q, i) => ({ ...q, key: `${q.key.substring(0, 5)}${i}` }))
}
