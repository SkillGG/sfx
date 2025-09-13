import { cn } from "@/utils/utils";
import { Suspense } from "react";
import { LocalImg } from "./localImg";
import { Spinner } from "../spinner";
import type {
  FieldBase,
  SFXField,
  SFXFieldsData,
  StringField as StringFieldType,
} from "@/utils/parse/sfxParse";
import type { ClassValue } from "clsx";

export const FieldTypeClasses: Record<
  keyof SFXFieldsData | `${keyof SFXFieldsData}_j`,
  string
> = {
  read: "text-sm text-center text-(--sfx-read-text)",
  read_j: "text-sm text-center text-(--sfx-read-text)",
  extra: "text-sm whitespace-pre-wrap text-(--sfx-extra-text)",
  extra_j: "text-sm whitespace-pre-wrap text-(--sfx-extra-text) ml-4",
  tlExtra: "text-base text-(--sfx-tlextra-text)",
  tlExtra_j: "text-sm text-(--sfx-extra-text) ml-4",
  def: "text-(--sfx-def-text)",
  def_j: "text-(--sfx-def-text)",
};

export const StringField = ({
  field,
  type,
  className,
}: {
  field: FieldBase & StringFieldType;
  type: keyof SFXFieldsData;
  className?: ClassValue;
}) => {
  const fieldType: keyof typeof FieldTypeClasses = `${type}${field.jumpedFrom ? "_j" : ""}`;

  return (
    <div className={cn(FieldTypeClasses[fieldType], className)}>
      {field.counter ? `${field.counter}.` : ""}
      {field.value}
    </div>
  );
};

export const SFXFieldDiv = ({
  field,
  type,
  className,
}: {
  field: SFXField;
  type: keyof SFXFieldsData;
  className?: ClassValue;
}) => {
  switch (field.type) {
    case "string":
      return (
        <StringField
          field={field}
          type={field.jumpedFrom ?? type}
          className={cn(className)}
        />
      );
    case "img":
      const alt = `Example ${field.index}`;
      const img = (
        <Suspense
          key={`${field.index}_img_${field.url}`}
          fallback={<Spinner className={cn("h-[75px] w-[75px]")} />}
        >
          {field.url.startsWith("@") ? (
            <LocalImg
              alt={alt}
              filename={field.url.substring(1)}
              className={cn(className)}
            />
          ) : (
            <LocalImg
              alt={alt}
              filename={field.url}
              nonDB={<Spinner className={cn("h-[75px] w-[75px]")} />}
              className={cn(className)}
            />
          )}
        </Suspense>
      );

      return img;
    default:
      return null;
  }
};
