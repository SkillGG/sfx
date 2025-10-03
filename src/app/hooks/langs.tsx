'use client'

import { api } from '@/trpc/react'
import { createContext, useContext, useEffect } from 'react'

export type SFXLang = { name: string; code: string }

const DEFAULT_LANGUAGES = [
	{ name: 'English', code: 'en' },
	{ name: 'Polish', code: 'pl' },
	{ name: 'Chinese', code: 'zh' },
	{ name: 'Japanese', code: 'ja' },
	{ name: 'Korean', code: 'ko' },
	{ name: 'French', code: 'fr' },
	{ name: 'German', code: 'de' },
	{ name: 'Spanish', code: 'es' },
	{ name: 'Italian', code: 'it' },
]

const SFXLangs = createContext<{
	langs: SFXLang[]
	setLangs: (
		langs: SFXLang[] | ((prev: SFXLang[]) => SFXLang[]),
	) => Promise<void>
}>({ langs: [], setLangs: async () => void 0 })

export const useSFXLangs = () => {
	const { langs, setLangs } = useContext(SFXLangs)
	if (!langs) throw new Error('Not in a SFXLangProvider!')
	return { langs, setLangs }
}

export const SFXLangProvider = ({
	children,
}: {
	children: React.ReactNode
}) => {
	const { data } = api.sfx.listLangs.useQuery()

	// console.log("langs", data);

	const utils = api.useUtils()

	const addLang = api.sfx.addLang.useMutation()

	useEffect(() => {
		if (data?.length === 0) {
			// seed with default langs

			// console.log("Populating languages!");

			void Promise.all(
				DEFAULT_LANGUAGES.map(lang => {
					return addLang.mutateAsync({ id: lang.code, name: lang.name })
				}),
			).then(() => {
				return utils.invalidate()
			})
		}
	}, [addLang, data, utils])

	data?.sort(
		(a, b) =>
			DEFAULT_LANGUAGES.findIndex(q => q.code === a.id) -
			DEFAULT_LANGUAGES.findIndex(q => q.code === b.id),
	)

	return (
		<SFXLangs.Provider
			value={{
				langs: (data ?? []).map(q => ({ code: q.id, name: q.name })),
				setLangs: async _ls => {
					//
				},
			}}
		>
			{children}
		</SFXLangs.Provider>
	)
}
