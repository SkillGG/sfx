import type { Validation } from "@/app/hooks/validation";
import type { SFXFieldWithName } from ".";
import { cn } from "@/utils";
import { DEFAULT_SFX_INPUT_STYLES, DEFAULT_SFX_LABEL_STYLES } from "../sfx";
import { ValidationErrorDisplay } from "../validationError";
import { useRef } from "react";
import { LongInput } from "./longInput";

export type ToggledEditField = {
  label: string;
  long?: boolean;
  value: string | null;
  type: "toggle";
  placeholder?: string;
  temp: string;
  key?: string;
};

export const ToggleableEditField = ({
  validation,
  field,
  onChange,
}: {
  field: SFXFieldWithName<ToggledEditField>;
  validation?: Validation;
  onChange: (v: string | null) => void;
}) => {
  const {
    field: fieldName,
    label,
    value,
    temp,
    placeholder,
    key,
    long,
  } = field;

  const inputRef = useRef<HTMLInputElement>(null);
  const tAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleToggle = () => {
    const newValue = value === null ? temp : null;
    onChange?.(newValue);
    if (newValue !== null) {
      console.log("focusing");
      setTimeout(() => inputRef?.current?.select(), 0);
    }
  };

  return (
    <div className={cn("flex flex-row items-center gap-2")}>
      <div className={cn("flex flex-1 items-center gap-2")}>
        <label
          htmlFor={key ?? fieldName}
          className={cn(
            DEFAULT_SFX_LABEL_STYLES,
            !!validation?.hasFieldError(fieldName) &&
              "font-bold text-(color:--sfx-label-error-text) underline",
          )}
        >
          {label}
        </label>
        <label className={cn("flex items-center gap-1")}>
          <input
            type="checkbox"
            data-value={value}
            checked={typeof value === "string"}
            onChange={handleToggle}
            id={key ?? fieldName}
            className="hidden"
          />
          <div
            tabIndex={0}
            aria-roledescription="Switch"
            onKeyDown={(e) => {
              if ([" ", "Enter"].includes(e.key)) {
                handleToggle();
              }
            }}
            className={cn(
              "mr-auto h-4 w-4 rounded-full border-2 border-(--input-border)",
              "focus:ring-(--input-focus-border)",
              "cursor-pointer",
              value !== null
                ? "bg-(--button-checkbox-checked-bg)"
                : "border-(--button-disabled-bg) opacity-50",
            )}
          ></div>
        </label>
      </div>
      <div className={cn("ml-auto flex flex-3 flex-col gap-2")}>
        {long ? (
          <LongInput
            fieldName={fieldName}
            label={label}
            validation={validation}
            value={value ?? temp}
            ref={tAreaRef}
            placeholder={placeholder}
            onChange={(e) => {
              onChange?.(e);
            }}
            disabled={value === null}
          />
        ) : (
          <input
            type="text"
            className={cn(
              DEFAULT_SFX_INPUT_STYLES(validation, fieldName),
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
            placeholder={placeholder ?? label}
            value={value ?? temp}
            ref={inputRef}
            aria-multiline={false}
            onChange={(e) => {
              onChange?.(e.currentTarget.value);
            }}
            data-text={value ?? temp}
            disabled={value === null}
          />
        )}
        {validation && (
          <ValidationErrorDisplay
            className="self-end"
            errors={validation.errors}
            field={fieldName}
            compact
          />
        )}
      </div>
    </div>
  );
};
