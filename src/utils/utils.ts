import type { Language, Translation } from "@prisma/client";
import { twMerge } from "tailwind-merge";
import clsx, { type ClassValue } from "clsx";
import type z from "zod/v4";
import { array, boolean, literal, number, object, string } from "zod/v4";
import { generate } from "random-words";
import type { REVERSE_MARK } from "@/app/_components/sfx";

/** Options given to getList that filter the sfx list */
export const SearchOptions = object({
  /** Ammount of sfx taken */
  limit: number().default(100),
  /** Ammount of sfx skipped (from the start, ordered by id) */
  skip: number().default(0),
  /** String to search the database by. Searches text,searchref,searchdef,searchextra fields */
  query: string(),
  /** Languages to filter for */
  langs: array(string()),
  /** The ordering of thhe returned SFX. Ordered by ID */
  order: literal("asc").or(literal("desc")).default("asc"),
  /** SFX id to search for (returns single item) */
  id: number().int(),
  /** SFX ids to query. Returns at most ids.length ammount of SFX */
  ids: array(number().int()),
  /** Skip sfx deduping */
  nodedupe: boolean(),
  /** Filter by featured flag */
  featured: boolean(),
})
  .partial() // can use any combination
  .or(literal("list")); // or just `list`. This returns all SFX without thhe TL data

export type SearchOptions = z.infer<typeof SearchOptions>;

/** A Translation object with CollapsedOnomatopoeia and `forDeletion` that marks thhe translation for deletion */
export type CollapsedTL = Omit<
  Translation & {
    /** Collapsed SFX data */
    sfx: CollapsedOnomatopoeia;
    /** Marks the sound effect for deletion */
    forDeletion?: boolean;
  },
  "createdAt" | "updatedAt"
>;

/** SFX Data with CollapsedTL inside */
export type CollapsedOnomatopoeia = SFXData & {
  tls: CollapsedTL[];
  createdAt?: Date;
  updatedAt?: Date;
};
/** Pure translation data */
export type TranslationData = Omit<
  Translation,
  "id" | "createdAt" | "updatedAt"
>;

/** Pure Sound effect data */
export type SFXData = z.infer<typeof SFXData>;

export type Promisable<T> = T | Promise<T>;

/**
 * Function to generate random string consisting of 2 english words
 * @param length the number of words in thhe string
 * @returns A generated string
 */
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

/** A Translation object with CollapsedOnomatopoeia and `forDeletion` that marks thhe translation for deletion */
export const CollapsedTL = object({
  /**  Translation ID */
  id: number().or(literal(Infinity)),
  /** OGSFX ID */
  sfx1Id: number().or(literal(Infinity)),
  /** TLSFX ID */
  sfx2Id: number().or(literal(Infinity)),
  /** Translation specific info. If first chharacter is {@link REVERSE_MARK}, marks it as reverse TL. */
  additionalInfo: string().nullable(),
  /** If set, TL will be deleted in `update` */
  forDeletion: boolean().optional(),
  /** TLSFX (or OGSFX if reversed) */
  get sfx() {
    return CollapsedOnomatopoeia;
  },
});

/** {@link CollapsedOnomatopoeia} zod schema */
export const CollapsedOnomatopoeia = object({
  /** SFX id */
  id: number().or(literal(Infinity)),
  /** SFX main text */
  text: string(),
  /** SFX reading */
  read: string().nullable(),
  /** SFX definition */
  def: string(),
  /** SFX extra information */
  extra: string().nullable(),
  /** Is the SFX featured on the main page? */
  featured: boolean().default(false),
  /** SFX's language */
  language: string(),
  /** An array of translations this SFX references */
  tls: array(CollapsedTL),
});

/** Client-side SFX Data object without the TLs */
export const SFXData = object({
  id: number(),
  text: string(),
  read: string().nullable(),
  def: string(),
  extra: string().nullable(),
  featured: boolean().default(false),
  language: string(),
});

// #region VALIDATION
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

// #endregion

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
  featured: boolean;
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
    if ("featured" in memory && typeof memory.featured === "boolean")
      ret.featured = memory.featured;
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
