"use client";

import { useState, useCallback } from "react";
import {
  type ValidationError,
  type SFXData,
  type TranslationData,
  validateSFX,
  validateTranslation,
  type ValidationResult,
} from "@/utils";

export type ValidationState = {
  errors: ValidationError[];
  isValid: boolean;
};

export class Validation {
  validateSFXData: (sfxData: Partial<SFXData>) => ValidationResult;
  get errors() {
    return this.validationState.errors;
  }
  set errors(value) {
    this.validationState.errors = value;
  }
  get isValid() {
    return this.validationState.isValid;
  }
  set isValid(value) {
    this.validationState.isValid = value;
  }
  validateTranslationData: (
    translationData: Partial<TranslationData>,
  ) => ValidationResult;
  clearErrors: () => ValidationResult;
  clearError: (errField: ValidationError["field"]) => ValidationResult;
  getFieldErrors: (field: string) => string[];
  hasFieldError: (field: string) => boolean;
  getFirstFieldError: (field: string) => string | null;
  validationState: ValidationState;
  constructor(results?: ValidationResult) {
    this.validationState = results ?? { errors: [], isValid: true };
    this.validateSFXData = (sfxData: Partial<SFXData>) => {
      const result = validateSFX(sfxData);
      this.validationState = {
        errors: result.errors,
        isValid: result.isValid,
      };
      return result;
    };

    this.validateTranslationData = (
      translationData: Partial<TranslationData>,
    ) => {
      const result = validateTranslation(translationData);
      this.validationState = {
        errors: result.errors,
        isValid: result.isValid,
      };
      return result;
    };

    this.clearErrors = () => {
      return (this.validationState = {
        errors: [],
        isValid: true,
      });
    };

    this.clearError = (errField: ValidationError["field"]) => {
      const newErrs = this.validationState.errors.filter(
        (err) => err.field !== errField,
      );
      return { errors: newErrs, isValid: newErrs.length === 0 };
    };
    this.getFieldErrors = (field: string): string[] => {
      return this.validationState.errors
        .filter((error) => error.field === field)
        .map((error) => error.message);
    };

    this.hasFieldError = (field: string): boolean => {
      return this.validationState.errors.some((error) => error.field === field);
    };

    this.getFirstFieldError = (field: string): string | null => {
      const error = this.validationState.errors.find(
        (error) => error.field === field,
      );
      return error?.message ?? null;
    };
  }
}

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
