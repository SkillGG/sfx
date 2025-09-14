import type { Language, Translation } from "@prisma/client";
import { twMerge } from "tailwind-merge";
import clsx, { type ClassValue } from "clsx";
import type z from "zod/v4";
import { array, boolean, literal, number, object, string } from "zod/v4";
import { generate } from "random-words";

export const SearchOptions = object({
  limit: number().default(100),
  skip: number().default(0),
  query: string(),
  langs: array(string()),
  order: literal("asc").or(literal("desc")).default("asc"),
  id: number().int(),
  ids: array(number().int()),
  nodedupe: boolean(),
})
  .partial()
  .or(literal("list"));

export type SearchOptions = z.infer<typeof SearchOptions>;

export type CollapsedTL = Omit<
  Translation & {
    sfx: CollapsedOnomatopoeia;
    forDeletion?: boolean;
  },
  "createdAt" | "updatedAt"
>;

export type CollapsedOnomatopoeia = SFXData & {
  tls: CollapsedTL[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type TranslationData = Omit<
  Translation,
  "id" | "createdAt" | "updatedAt"
>;

export type SFXData = z.infer<typeof SFXData>;

export type Promisable<T> = T | Promise<T>;

export const getRandomWordString = (length = 2) => {
  const wordString = [
    ...generate({
      exactly: length,
      formatter(word) {
        return word.substring(0, 1).toLocaleUpperCase() + word.substring(1);
      },
    }),
  ]
    .flat()
    .join("");

  return wordString;
};

export const CollapsedTL = object({
  id: number().or(literal(Infinity)),
  sfx1Id: number().or(literal(Infinity)),
  sfx2Id: number().or(literal(Infinity)),
  additionalInfo: string().nullable(),
  forDeletion: boolean().optional(),
  get sfx() {
    return CollapsedOnomatopoeia;
  },
});

export const CollapsedOnomatopoeia = object({
  id: number().or(literal(Infinity)),
  text: string(),
  read: string().nullable(),
  def: string(),
  extra: string().nullable(),
  language: string(),
  tls: array(CollapsedTL),
});

export const SFXData = object({
  id: number(),
  text: string(),
  read: string().nullable(),
  def: string(),
  extra: string().nullable(),
  language: string(),
});

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

export const validateLongs = (
  value: string,
  fieldName: string,
): ValidationResult => {
  if (value.endsWith(";")) {
    return {
      isValid: false,
      errors: [
        {
          field: fieldName,
          message: `Cannot end on an empty line!`,
        },
      ],
    };
  }
  return { errors: [], isValid: true };
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
          message: `Max length: ${maxLength}`,
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
      errors: [{ field: "language", message: "Invalid language" }],
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

  const defLongValidation = validateLongs(sfxData.def ?? "", "def");
  if (!defLongValidation.isValid) errors.push(...defLongValidation.errors);

  const languageValidation = validateLanguage(sfxData.language ?? "");
  if (!languageValidation.isValid) errors.push(...languageValidation.errors);

  // Validate optional fields with length limits
  if (sfxData.read) {
    const readValidation = validateLongs(sfxData.read, "read");
    if (!readValidation.isValid) errors.push(...readValidation.errors);
  }

  if (sfxData.extra) {
    const extraValidation = validateLongs(sfxData.extra, "extra");
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

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const parseMemoryData = (
  q: string | null,
): Partial<{
  text: string | null;
  def: string | null;
  read: string | null;
  lang: string;
  extra: string | null;
  tempRead: string | null;
  tls: CollapsedTL[];
}> | null => {
  if (!q) {
    // console.log("No memory string");
    return null;
  }
  try {
    const memory: unknown = JSON.parse(q);
    const ret: ReturnType<typeof parseMemoryData> = {};
    if (!memory || !(typeof memory === "object")) {
      // console.log("No memory data!");
      return null;
    }
    if ("text" in memory && typeof memory.text === "string")
      ret.text = memory.text;
    if ("def" in memory && typeof memory.def === "string") ret.def = memory.def;
    if ("read" in memory && typeof memory.read === "string")
      ret.read = memory.read;
    if ("extra" in memory && typeof memory.extra === "string")
      ret.extra = memory.extra;
    if ("lang" in memory && typeof memory.lang === "string")
      ret.lang = memory.lang;
    if ("tempRead" in memory && typeof memory.tempRead === "string")
      ret.tempRead = memory.tempRead;
    if ("tls" in memory && Array.isArray(memory.tls)) {
      const denullifyIds = (tl: CollapsedTL): CollapsedTL => {
        return {
          ...tl,
          id: tl.id ?? Infinity,
          sfx1Id: tl.sfx1Id ?? Infinity,
          sfx2Id: tl.sfx2Id ?? Infinity,
          sfx: {
            ...tl.sfx,
            id: tl.sfx.id ?? Infinity,
            tls: tl.sfx.tls?.map((q) => denullifyIds(q)) ?? [],
          } as CollapsedOnomatopoeia,
        };
      };

      const denullified = memory.tls.map((tl: CollapsedTL) => {
        return denullifyIds(tl);
      });

      ret.tls = denullified;
    }

    return ret;
  } catch (err) {
    console.warn("Error parsing memory string", err);
    return null;
  }
};

export type SearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

export const noop = () => void 0;

export type LangObject = Record<string, string>;

export const toLangObject = (l: Language[]): LangObject => {
  const ret: LangObject = {};
  for (const { id, name } of l) ret[id] = name;
  return ret;
};

export const IMAGE_SIZE = {
  width: 600,
  height: 600 * 0.5,
};
