"use client";

import { useState, useCallback } from "react";
import {
  type ValidationError,
  type SFXData,
  type TranslationData,
  validateSFX,
  validateTranslation,
} from "@/utils";

export type ValidationState = {
  errors: ValidationError[];
  isValid: boolean;
};

export const useValidation = () => {
  const [validationState, setValidationState] = useState<ValidationState>({
    errors: [],
    isValid: true,
  });

  const validateSFXData = useCallback((sfxData: Partial<SFXData>) => {
    const result = validateSFX(sfxData);
    setValidationState({
      errors: result.errors,
      isValid: result.isValid,
    });
    return result;
  }, []);

  const validateTranslationData = useCallback(
    (translationData: Partial<TranslationData>) => {
      const result = validateTranslation(translationData);
      setValidationState({
        errors: result.errors,
        isValid: result.isValid,
      });
      return result;
    },
    [],
  );

  const clearErrors = useCallback(() => {
    setValidationState({
      errors: [],
      isValid: true,
    });
  }, []);

  const clearError = useCallback((errField: ValidationError["field"]) => {
    setValidationState((prev) => {
      const newErrs = prev.errors.filter((err) => err.field !== errField);
      return { errors: newErrs, isValid: newErrs.length === 0 };
    });
  }, []);

  const getFieldErrors = useCallback(
    (field: string): string[] => {
      return validationState.errors
        .filter((error) => error.field === field)
        .map((error) => error.message);
    },
    [validationState.errors],
  );

  const hasFieldError = useCallback(
    (field: string): boolean => {
      return validationState.errors.some((error) => error.field === field);
    },
    [validationState.errors],
  );

  const getFirstFieldError = useCallback(
    (field: string): string | null => {
      const error = validationState.errors.find(
        (error) => error.field === field,
      );
      return error?.message ?? null;
    },
    [validationState.errors],
  );

  return {
    // State
    errors: validationState.errors,
    isValid: validationState.isValid,

    // Validation functions
    validateSFXData,
    validateTranslationData,

    // Error management
    clearErrors,
    clearError,
    getFieldErrors,
    hasFieldError,
    getFirstFieldError,
  };
};
