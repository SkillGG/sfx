import { cn } from "@/utils";
import type { Validation } from "../../hooks/validation";
import { EditField } from "./editField";
import {
  ToggleableEditField,
  type ToggledEditField,
} from "./toggleableEditField";

export type SFXEditField = EditField | ToggledEditField;

type SFXEditFieldObject = Record<string, SFXEditField>;

export type SFXFieldWithName<T extends SFXEditField> = T & { field: string };

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
                onChange={(newQ) => {
                  const pField = value[q.field];
                  validation.clearError(q.field);
                  if (newQ !== null) {
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
                      [q.field]: {
                        ...pField,
                        temp: q.value ?? "",
                        value: null,
                      },
                    });
                  }
                }}
              />
            );
          default:
            return (
              <EditField
                field={q}
                validation={validation}
                key={q.field}
                onChange={(newV) => {
                  const pField = value[q.field];
                  if (pField) {
                    onChange?.({
                      ...value,
                      [q.field]: {
                        ...pField,
                        value: newV,
                      },
                    });
                    validation.clearError(q.field);
                  }
                }}
              />
            );
        }
      })}
    </div>
  );
};
