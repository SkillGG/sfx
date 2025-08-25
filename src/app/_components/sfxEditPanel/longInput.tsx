import { cn } from "@/utils";
import { DEFAULT_SFX_INPUT_STYLES } from "../sfx";
import type { Validation } from "@/app/hooks/validation";
import type React from "react";
import { useEffect, useImperativeHandle, useRef } from "react";

export const showSpecial = (str: string) =>
  str.replaceAll("\n", "\\n").replaceAll("\u037e", "{gsemi}");

const parseView = (value: string) => {
  // TODO: Add fields showing fancy as well
  const addNewlines = (str: string) => {
    return str.replaceAll(";", "\u23ce\n");
  };

  return addNewlines(value);
};

const parseUpdate = (prev: string, value: string) => {
  const removeEmptyLines = (str: string) => {
    return str.replace(/(^|;);/g, "$1");
  };
  const removeNewlines = (str: string) => {
    const endsWithNewline = prev.endsWith(";");
    const add = endsWithNewline ? /(\u23ce\n)/g : /(\u23ce\n)|(\n)/g;
    const remove = /(\u23ce)|\n/g;

    return str.replace(add, ";").replace(remove, "");
  };

  const ret = removeEmptyLines(removeNewlines(value));

  return ret;
};

export const LongInput = ({
  ref,
  value,
  fieldName,
  label,
  validation,
  placeholder,
  disabled,

  onChange,
}: {
  ref?: React.Ref<HTMLTextAreaElement>;
  value: string;
  placeholder?: string;
  label: string;
  validation?: Validation;
  fieldName: string;
  disabled?: boolean;

  onChange?: (v: string) => void;
}) => {
  const inRef = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => inRef.current!, []);

  useEffect(() => {
    if (inRef.current) {
      inRef.current.style.height = "auto";
      inRef.current.style.height = inRef.current.scrollHeight + 2 + "px";
    }
  }, [value]);

  return (
    <textarea
      className={cn(
        DEFAULT_SFX_INPUT_STYLES(validation, fieldName),
        "disabled:cursor-not-allowed disabled:opacity-50",
      )}
      placeholder={placeholder ?? label}
      value={parseView(value)}
      rows={parseView(value).split("\n").length}
      ref={inRef}
      onChange={(e) => {
        onChange?.(parseUpdate(value, e.currentTarget.value));
      }}
      data-text={value}
      disabled={disabled}
    />
  );
};
