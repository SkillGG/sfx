import type { LinkField } from '@/utils/parse/sfxParse'

type StringField = { type: 'string'; value: string }

export type InfoField = LinkField | StringField

export const parseInfoField = (line: string): InfoField => {
	return { type: 'string', value: line.trim() }
}

export const parseInfo = (str: string): InfoField[] => {
	const lines = str.split('\n').filter(q => !!q)
	return lines.map(parseInfoField)
}
