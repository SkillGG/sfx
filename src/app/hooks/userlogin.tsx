import { createContext, useContext, useEffect, useState } from 'react'

export type UserSessionData = { token: string; deviceName: string }

const UserSession = createContext<null | UserSessionData | undefined>(undefined)

export const useUser = () => {
	const ctx = useContext(UserSession)
	if (ctx === undefined) throw new Error('Not in UserSessionProvider')
	if (ctx === null) return null
	return ctx
}

export const UserSessionProvider = ({
	children,
}: {
	children: React.ReactNode
}) => {
	const [uSess, setUserSession] = useState<UserSessionData | null>(null)

	useEffect(() => {
		const token = sessionStorage.getItem('stk')
		const deviceName = sessionStorage.getItem('dnam')

		if (!token || !deviceName) {
			console.warn('No session provided!')
			return
		}

		setUserSession({ token, deviceName })
	}, [])

	return <UserSession.Provider value={uSess}>{children}</UserSession.Provider>
}
