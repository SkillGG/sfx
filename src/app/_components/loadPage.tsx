import { cn } from '@/utils/utils'
import { useTheme } from '../hooks/theme'
import { Spinner } from './spinner'

export const LoadPageSpinner = () => {
	const { mode } = useTheme()
	return (
		<div
			className={cn(
				'flex h-screen w-full items-center justify-center bg-(color:--accent-50)',
				'dark:bg-slate-900',
				mode,
			)}
		>
			<div
				className={cn(
					'flex flex-col items-center gap-4 rounded-xl bg-white px-8 py-8 shadow-lg',
					'dark:bg-slate-800',
				)}
			>
				<Spinner />
			</div>
		</div>
	)
}
