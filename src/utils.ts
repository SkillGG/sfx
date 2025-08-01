import type { Onomatopoeia, Translation } from "@prisma/client";
import type { SFXLang } from "./app/hooks/langs";
import { twMerge } from "tailwind-merge";
import clsx, { type ClassValue } from "clsx";

type SFXTranslationObject = Record<SFXLang["code"], SFXData>;

export type SFXData = Omit<Onomatopoeia, "id" | "createdAt" | "updatedAt"> & {
  id?: Onomatopoeia["id"];
} & {
  tls?: SFXTranslationObject;
};

export type TranslationData = Omit<
  Translation,
  "id" | "createdAt" | "updatedAt"
>;

// Simple validation error types
export type ValidationError = {
  field: string;
  message: string;
};

export type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
};

// Simple validation functions
export const validateRequired = (
  value: string,
  fieldName: string,
): ValidationResult => {
  if (!value || value.trim().length === 0) {
    return {
      isValid: false,
      errors: [{ field: fieldName, message: `${fieldName} is required` }],
    };
  }
  return { isValid: true, errors: [] };
};

export const validateMaxLength = (
  value: string,
  maxLength: number,
  fieldName: string,
): ValidationResult => {
  if (value && value.length > maxLength) {
    return {
      isValid: false,
      errors: [
        {
          field: fieldName,
          message: `${fieldName} cannot exceed ${maxLength} characters`,
        },
      ],
    };
  }
  return { isValid: true, errors: [] };
};

export const validateLanguage = (language: string): ValidationResult => {
  if (!language) {
    return {
      isValid: false,
      errors: [
        { field: "language", message: "Please select a valid language" },
      ],
    };
  }
  return { isValid: true, errors: [] };
};

// Simple SFX validation
export const validateSFX = (sfxData: Partial<SFXData>): ValidationResult => {
  const errors: ValidationError[] = [];

  // Validate required fields
  const textValidation = validateRequired(sfxData.text ?? "", "text");
  if (!textValidation.isValid) errors.push(...textValidation.errors);

  const defValidation = validateRequired(sfxData.def ?? "", "def");
  if (!defValidation.isValid) errors.push(...defValidation.errors);

  const languageValidation = validateLanguage(sfxData.language ?? "");
  if (!languageValidation.isValid) errors.push(...languageValidation.errors);

  // Validate optional fields with length limits
  if (sfxData.read) {
    const readValidation = validateMaxLength(sfxData.read, 200, "read");
    if (!readValidation.isValid) errors.push(...readValidation.errors);
  }

  if (sfxData.extra) {
    const extraValidation = validateMaxLength(sfxData.extra, 1000, "extra");
    if (!extraValidation.isValid) errors.push(...extraValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Simple translation validation
export const validateTranslation = (
  translationData: Partial<TranslationData>,
): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!translationData.sfx1Id || translationData.sfx1Id < 1) {
    errors.push({ field: "sfx1Id", message: "Original SFX ID is required" });
  }

  if (!translationData.sfx2Id || translationData.sfx2Id < 1) {
    errors.push({ field: "sfx2Id", message: "Target SFX ID is required" });
  }

  if (
    translationData.sfx1Id &&
    translationData.sfx2Id &&
    translationData.sfx1Id === translationData.sfx2Id
  ) {
    errors.push({
      field: "translation",
      message: "Original and target SFX must be different",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 *
 * @param {HTMLDialogElement} dialog
 * @param {()=>void} [closeCallback]
 */
export const makeDialogBackdropExitable = (
  dialog: HTMLDialogElement,
  closeCallback?: () => void,
  closeCallbackOnly?: boolean,
) => {
  dialog.addEventListener("click", function (event) {
    if (
      event.target instanceof HTMLSelectElement ||
      event.target instanceof HTMLOptionElement
    ) {
      console.log("Clicking a select!");
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const rect = dialog.getBoundingClientRect();
    const isInDialog =
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width;
    console.log("isInDialog", isInDialog);
    if (!isInDialog) {
      if (!closeCallbackOnly) dialog.close();
      closeCallback?.();
    }
  });
};

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};
