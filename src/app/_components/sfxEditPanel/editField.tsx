import type { Validation } from '@/app/hooks/validation'
import type { SFXFieldWithName } from '.'
import { cn } from '@/utils/utils'
import { DEFAULT_SFX_INPUT_STYLES, DEFAULT_SFX_LABEL_STYLES } from '../sfx'
import { ValidationErrorDisplay } from '../validationError'
import { LongInput } from './longInput'

export type EditField = {
	label: string
	value: string
	placeholder?: string
	type?: 'normal'
	key?: string
	long?: boolean
}

export const EditField = ({
	validation,
	field,
	onChange,
}: {
	field: SFXFieldWithName<EditField>
	validation?: Validation
	onChange: (v: (typeof field)['value']) => void
}) => {
	const { field: fieldName, label, value, placeholder, key, long } = field
	return (
		<div className={cn('flex flex-row items-start gap-2')}>
			<label
				htmlFor={key ?? fieldName}
				className={cn(
					DEFAULT_SFX_LABEL_STYLES,
					!!validation?.hasFieldError(fieldName) &&
						'font-bold text-(color:--sfx-label-error-text) underline',
				)}
			>
				{label}
			</label>
			<div className={cn('ml-auto flex flex-3 flex-col gap-2')}>
				{long ? (
					<LongInput
						fieldName={fieldName}
						label={label}
						value={value}
						placeholder={placeholder}
						validation={validation}
						onChange={onChange}
					/>
				) : (
					<input
						className={cn(DEFAULT_SFX_INPUT_STYLES(validation, fieldName))}
						placeholder={placeholder ?? label}
						type='text'
						value={value}
						id={key ?? fieldName}
						onChange={e => {
							onChange(e.currentTarget.value)
						}}
					/>
				)}
				{validation && (
					<ValidationErrorDisplay
						className='self-end'
						errors={validation.errors}
						field={fieldName}
						compact
					/>
				)}
			</div>
		</div>
	)
}
