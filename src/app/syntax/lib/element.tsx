import type React from 'react'
import { onlyText } from 'react-children-utilities'
const SupportedLanguages = { javascript: true } as const

type SupportedLanguages = typeof SupportedLanguages

export const SyntaxHighlight = ({
	language,
	children,
}: React.PropsWithChildren<{ language: keyof SupportedLanguages }>) => {
	const code = onlyText(children)

	console.log('code:', code)

	return <>{code}</>
}
