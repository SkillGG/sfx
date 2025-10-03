'use client'

import { type ValidationError, cn } from '@/utils/utils'

type ValidationErrorDisplayProps = {
	errors: ValidationError[]
	field?: string
	className?: string
	compact?: boolean
}

export const ValidationErrorDisplay = ({
	errors,
	field,
	className,
	compact = false,
}: ValidationErrorDisplayProps) => {
	// Filter errors by field if specified
	const filteredErrors = field
		? errors.filter(error => error.field === field)
		: errors

	if (filteredErrors.length === 0) {
		return null
	}

	if (compact) {
		return (
			<div className={cn(className)}>
				{filteredErrors.map((error, index) => (
					<div
						key={`${error.field}-${index}`}
						className={cn(
							'flex items-center gap-1 text-xs',
							'text-(--validationerror-text)',
						)}
					>
						<svg
							className={cn('h-3 w-3 flex-shrink-0')}
							fill='none'
							stroke='currentColor'
							strokeWidth={2}
							viewBox='0 0 24 24'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
							/>
						</svg>
						<span>{error.message}</span>
					</div>
				))}
			</div>
		)
	}

	return (
		<div className={cn('mt-1 space-y-1', className)}>
			{filteredErrors.map((error, index) => (
				<div
					key={`${error.field}-${index}`}
					className={cn(
						'flex items-start gap-2 rounded-md bg-(color:--error-50) p-2',
						'text-sm text-(--validationerror-text) dark:bg-(--validationerror-light-bg)/20',
					)}
				>
					<svg
						className={cn('mt-0.5 h-4 w-4 flex-shrink-0')}
						fill='none'
						stroke='currentColor'
						strokeWidth={2}
						viewBox='0 0 24 24'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
						/>
					</svg>
					<div className='flex-1'>{error.message}</div>
				</div>
			))}
		</div>
	)
}
