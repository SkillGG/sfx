'use client'

import type React from 'react'
import { onlyText } from 'react-children-utilities'
import './style.css'
import { useEffect, useRef } from 'react'

export type SupportedLanguage = 'javascript' | 'css'

type SyntaxTokenType = string

import Prism from 'prismjs'
import { cn } from '@/utils/utils'

Prism.manual = true

const getTokens = (s: string, language?: string) => {
	const lang = language ? Prism.languages[language] : undefined
	if (lang) {
		const tokenStream = Prism.tokenize(s, lang)
		return tokenStream
	}
	return [s]
}

const addHighlightToText = (obj: {
	reg: HighlightRegistry
	node: Node
	start: number
	end: number
	key: SyntaxTokenType
}) => {
	const { node, start, end, reg, key } = obj
	const range = new Range()
	range.setStart(node, start)
	range.setEnd(node, end)
	const hg = reg.get(`syntax-${key}`) ?? new Highlight()
	hg.add(range)
	reg.set(`syntax-${key}`, hg)
}

const highlight = (reg: HighlightRegistry, node: Node) => {
	const text = node.textContent
	if (!text) return

	const tokens = getTokens(text, 'javascript')

	let cursor = 0

	const usedTypes = new Set<string>()

	for (const token of tokens) {
		const key = typeof token === 'string' ? 'token' : token.type

		addHighlightToText({
			reg,
			key,
			node,
			start: cursor,
			end: cursor + token.length,
		})
		usedTypes.add(key)
		cursor += token.length
		console.log(usedTypes)
	}
}

export const SyntaxHighlight = ({
	language,
	children,
	theme,
	key,
}: React.PropsWithChildren<{
	language: SupportedLanguage
	theme?: string
	key?: string
}>) => {
	const code = onlyText(children)

	const spanRef = useRef<HTMLSpanElement>(null)

	useEffect(() => {
		if (!CSS.highlights) {
			console.warn('This browser does not support highlighting via CSS!')
			return
		}

		if (!spanRef.current) {
			console.log('No spanRef!')
			return
		}
		const textNode = spanRef.current.firstChild
		if (!textNode) {
			console.log('No text node inside!')
			return
		}

		highlight(CSS.highlights, textNode)
	}, [])

	return (
		<>
			<span
				key={key ?? code.substring(0, 40)} // makes it work through rerenders
				data-lang={language}
				ref={spanRef}
				className={cn(
					'syntax-highlighted whitespace-pre',
					theme && `syntaxtheme-${theme}`,
				)}
			>
				{code}
			</span>
		</>
	)
}
