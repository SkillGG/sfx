import { cn } from "@/utils";
import { DEFAULT_SFX_INPUT_STYLES, DEFAULT_SFX_LABEL_STYLES } from "./sfx";
import type { Validation } from "../hooks/validation";
import { ValidationErrorDisplay } from "./validationError";

type NormalEditField = {
  label: string;
  value: string;
  placeholder?: string;
  type?: "normal";
};

type ToggledEditField = {
  label: string;
  value: string | null;
  type: "toggle";
  placeholder?: string;
  temp: string;
};

type SFXEditField = NormalEditField | ToggledEditField;

type SFXEditFieldObject = Record<string, SFXEditField>;

type SFXFieldWithName<T extends SFXEditField> = T & { field: string };

const ToggleableEditField = ({
  validation,
  field,
  change,
}: {
  field: SFXFieldWithName<ToggledEditField>;
  validation: Validation;
  change: (v: string | null) => void;
}) => {
  const { field: fieldName, label, value, temp, placeholder } = field;

  return (
    <div className={cn("flex flex-row items-center gap-2")}>
      <div className={cn("flex flex-1 items-center gap-2")}>
        <label htmlFor={fieldName} className={cn(DEFAULT_SFX_LABEL_STYLES)}>
          {label}
        </label>
        <label className={cn("flex items-center gap-1")}>
          <input
            type="checkbox"
            checked={typeof value === "string"}
            onChange={(e) =>
              change?.(!!e.currentTarget.value ? e.currentTarget.value : null)
            }
            id={fieldName}
            className="hidden"
          />
          <div
            tabIndex={0}
            aria-roledescription="Switch"
            onKeyDown={(e) => {
              if ([" ", "Enter"].includes(e.key)) {
                change?.(value ? null : temp);
              }
            }}
            className={cn(
              "mr-auto h-4 w-4 rounded-full border-2 border-(--input-border)",
              "focus:ring-(--input-focus-border)",
              "cursor-pointer",
              !!value
                ? "bg-(--button-checkbox-checked-bg)"
                : "border-(--button-disabled-bg) opacity-50",
            )}
          ></div>
        </label>
      </div>
      <div className={cn("ml-auto flex flex-3 flex-col gap-2")}>
        <input
          className={cn(
            DEFAULT_SFX_INPUT_STYLES(validation, fieldName),
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
          placeholder={placeholder ?? label}
          type="text"
          value={value ?? temp}
          onChange={(e) => {
            change?.(e.currentTarget.value);
            validation.clearError(fieldName);
          }}
          disabled={value === null}
        />
        <ValidationErrorDisplay
          errors={validation.errors}
          field={fieldName}
          compact
        />
      </div>
    </div>
  );
};

const RegularEditField = ({
  validation,
  field,
  change,
}: {
  field: SFXFieldWithName<NormalEditField>;
  validation: Validation;
  change: (v: string) => void;
}) => {
  const { field: fieldName, label, value, placeholder } = field;
  return (
    <div className={cn("flex flex-row items-start gap-2")}>
      <label
        htmlFor="sfx"
        className={cn(
          DEFAULT_SFX_LABEL_STYLES,
          !!validation.hasFieldError(fieldName) &&
            "font-bold text-(color:--sfx-label-error-text) underline",
        )}
      >
        {label}
      </label>
      <div className={cn("ml-auto flex flex-3 flex-col gap-2")}>
        <input
          className={cn(DEFAULT_SFX_INPUT_STYLES(validation, fieldName))}
          placeholder={placeholder ?? label}
          type="text"
          value={value}
          onChange={(e) => {
            change(e.currentTarget.value);
            validation.clearError(fieldName);
          }}
        />
        <ValidationErrorDisplay
          className="self-end"
          errors={validation.errors}
          field={fieldName}
          compact
        />
      </div>
    </div>
  );
};

export const SFXEditPanel = <T extends SFXEditFieldObject>({
  validation,
  onChange,
  value,
}: {
  value: T;
  validation: Validation;
  onChange?: (cb: T) => void;
}) => {
  const fields = Object.entries(value).map<SFXFieldWithName<SFXEditField>>(
    ([k, v]) => ({
      ...v,
      field: k,
    }),
  );

  return (
    <div className={cn("flex w-full flex-col gap-2", "text-base font-medium")}>
      {fields.map((q) => {
        switch (q.type) {
          case "toggle":
            return (
              <ToggleableEditField
                key={q.field}
                validation={validation}
                field={q}
                change={(newQ) => {
                  const pField = value[q.field];
                  if (newQ) {
                    onChange?.({
                      ...value,
                      [q.field]: {
                        ...pField,
                        value: newQ,
                      },
                    });
                  } else {
                    onChange?.({
                      ...value,
                      [q.field]: { ...pField, temp: q.value, value: null },
                    });
                  }
                }}
              />
            );
          default:
            return (
              <RegularEditField
                field={q}
                validation={validation}
                key={q.field}
                change={(newV) => {
                  const pField = value[q.field];
                  if (pField)
                    onChange?.({
                      ...value,
                      [q.field]: {
                        ...pField,
                        value: newV,
                      },
                    });
                }}
              />
            );
        }
      })}
    </div>
  );

  //   return (
  //     <div className={cn("flex w-full flex-col gap-2", "text-base font-medium")}>
  //       <div className={cn("items-top flex flex-row gap-2")}>
  //         <label
  //           htmlFor="def"
  //           className={cn(
  //             DEFAULT_SFX_LABEL_STYLES,
  //             validation.hasFieldError("def") &&
  //               "font-bold text-(color:--sfx-label-error-text) underline",
  //           )}
  //         >
  //           Definition
  //         </label>
  //         <div className={cn("ml-auto flex flex-3 flex-col gap-2")}>
  //           <input
  //             className={cn(DEFAULT_SFX_INPUT_STYLES(validation, "def"))}
  //             placeholder="Definition"
  //             type="text"
  //             value={sfx.def}
  //             onChange={(e) => {
  //               onChange?.((p) => ({ ...p, def: e.currentTarget.value }));
  //               setValidation(new Validation(validation.clearError("def")));
  //             }}
  //           />
  //           <ValidationErrorDisplay
  //             className="self-end"
  //             errors={validation.errors}
  //             field="def"
  //             compact
  //           />
  //         </div>
  //       </div>

  //       <div className={cn("flex flex-row items-center gap-2")}>
  //         <label htmlFor="extra" className={cn(DEFAULT_SFX_LABEL_STYLES)}>
  //           Extra
  //         </label>
  //         <div className={cn("ml-auto flex w-full flex-3 flex-col gap-2")}>
  //           <input
  //             className={cn(DEFAULT_SFX_INPUT_STYLES(validation, "extra"))}
  //             placeholder="Extra"
  //             type="text"
  //             value={sfx.extra ?? ""}
  //             onChange={(e) =>
  //               onChange?.((p) => ({
  //                 ...p,
  //                 extra: e.currentTarget.value || null,
  //               }))
  //             }
  //           />
  //           <ValidationErrorDisplay
  //             errors={validation.errors}
  //             field="extra"
  //             compact
  //           />
  //         </div>
  //       </div>

  //   </div>
  //   );
};
