'use client'

import {
	type ValidationError,
	type SFXData,
	type TranslationData,
	validateSFX,
	validateTranslation,
	type ValidationResult,
} from '@/utils/utils'
import { useState } from 'react'

export type Validation = ReturnType<typeof useValidation>

export const useValidation = () => {
	const [state, setState] = useState<ValidationResult>({
		errors: [],
		isValid: true,
	})

	return {
		...state,
		setValidation: setState,
		validateSFXData: (sfxData: Partial<SFXData>) => {
			const result = validateSFX(sfxData)
			setState(() => {
				return { errors: result.errors, isValid: result.isValid }
			})
			return result
		},

		validateTranslationData: (translationData: Partial<TranslationData>) => {
			const result = validateTranslation(translationData)
			setState({ errors: result.errors, isValid: result.isValid })
			return result
		},

		clearErrors: () => {
			setState({ isValid: true, errors: [] })
		},

		clearError: (errField: ValidationError['field']) => {
			const newErrs = state.errors.filter(err => err.field !== errField)
			setState({ errors: newErrs, isValid: newErrs.length === 0 })
		},
		getFieldErrors: (field: string): string[] => {
			return state.errors
				.filter(error => error.field === field)
				.map(error => error.message)
		},

		hasFieldError: (field: string): boolean => {
			return state.errors.some(error => error.field === field)
		},

		getFirstFieldError: (field: string): string | null => {
			const error = state.errors.find(error => error.field === field)
			return error?.message ?? null
		},
	}
}
