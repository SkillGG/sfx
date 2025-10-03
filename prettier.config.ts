import type { Config } from 'prettier'
import type { PluginOptions } from 'prettier-plugin-tailwindcss'

const prettierConfig: Config & PluginOptions = {
	plugins: ['prettier-plugin-tailwindcss'],

	useTabs: true,
	semi: false,

	singleQuote: true,
	jsxSingleQuote: true,

	arrowParens: 'avoid',

	bracketSameLine: false,

	endOfLine: 'crlf',

	objectWrap: 'collapse',
	singleAttributePerLine: true,
}

export default prettierConfig
