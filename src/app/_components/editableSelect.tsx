"use client";

import { cn } from "@/utils";
import { useEffect, useRef, useState } from "react";

type SelectOption = {
  label: string;
  value: string;
};

export const EditableSelect = ({
  values,
  onChange,
  onAdd,
  value,
  styles,
  classNames,
  addTitle,
  hideValues,
  placeholders,
}: {
  values?: SelectOption[];
  onChange?: (e: React.ChangeEvent<HTMLSelectElement> | string) => void;
  onAdd?: (item: SelectOption) => void;
  value: string;
  addTitle?: string;
  hideValues?: string[];
  placeholders?: {
    label?: string;
    value?: string;
  };
  styles?: {
    dialog?: React.CSSProperties;
    select?: React.CSSProperties;
    button?: React.CSSProperties;
    main?: React.CSSProperties;
  };
  classNames?: {
    main?: string;
    dialog?: string;
    select?: string;
    button?: string;
  };
}) => {
  const [items, setItems] = useState<SelectOption[]>(
    values ?? [{ label: "None", value: "" }],
  );
  const [selectedValue, setSelectedValue] = useState(value);

  const [hideValuesState, setHideValuesState] = useState(hideValues);

  const dialogID = `editableSelect_${values?.map((v) => v.value).join(",") ?? ""}`;

  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (value !== selectedValue) {
      setSelectedValue(value);
    }
  }, [value, selectedValue]);

  useEffect(() => {
    setHideValuesState(hideValues);
  }, [hideValues]);

  useEffect(() => {
    if (!value) {
      setSelectedValue(items[0]?.value ?? "");
      onChange?.(items[0]?.value ?? "");
    }
  }, [value, items, onChange]);

  return (
    <>
      <div
        className={cn(
          "inline-flex w-fit cursor-pointer items-center overflow-hidden rounded",
          "border border-(--input-border) bg-(--input-bg)",
          classNames?.main,
        )}
        style={styles?.main}
      >
        <dialog
          id={dialogID}
          className={cn(
            "m-auto rounded-xl border border-(--regular-border)",
            "bg-(--dialog-bg)/25 p-6",
            "shadow-lg backdrop-blur-sm",
            classNames?.dialog,
          )}
          ref={dialogRef}
          popover="auto"
          style={styles?.dialog}
        >
          <div className={cn("flex flex-col gap-2")}>
            <h2 className={cn("text-2xl font-bold", "text-(--text-light)")}>
              {addTitle ?? "New"}
            </h2>
            <form
              className={cn("flex flex-col gap-2")}
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const label = formData.get("label") as string;
                const value = formData.get("value") as string;

                dialogRef?.current?.hidePopover();

                setItems([...items, { label, value }]);
                onAdd?.({ label, value });
              }}
            >
              <div className={cn("flex flex-row items-center gap-2")}>
                <label
                  htmlFor="label"
                  className={cn("text-(--input-label-text)")}
                >
                  Label
                </label>
                <input
                  type="text"
                  placeholder={placeholders?.label}
                  id="label"
                  className={cn(
                    "rounded border bg-(--input-bg) px-2 py-1 text-(--input-text)",
                    "focus:border-(--input-focus-border) focus:ring-1 focus:outline-none",
                    "dark:placeholder-(--input-placeholder-text)",
                    "border-(--input-border)",
                    "focus:ring-(--input-focus-border)",
                  )}
                  name="label"
                />
              </div>
              <div className={cn("flex flex-row items-center gap-2")}>
                <label
                  htmlFor="value"
                  className={cn("text-(--input-label-text)")}
                >
                  Value
                </label>
                <input
                  type="text"
                  placeholder={placeholders?.value}
                  id="value"
                  className={cn(
                    "rounded border bg-(--input-bg) px-2 py-1 text-(--input-text)",
                    "focus:border-(input-focus-border) focus:ring-1 focus:outline-none",
                    "dark:placeholder-(--input-placeholder-text)",
                    "border-(--input-border)",
                    "focus:ring-(--input-focus-border)",
                  )}
                  name="value"
                />
              </div>
              <button
                type="submit"
                className={cn(
                  "rounded-md bg-(--button-submit-bg) px-4 py-2 text-white",
                  "hover:bg-(--button-submit-hover-bg)",
                )}
                popoverTarget={dialogID}
                popoverTargetAction="hide"
              >
                Add
              </button>
            </form>
          </div>
        </dialog>
        <select
          // Add dark mode styles to the select element to ensure legible text and background
          style={{
            ...styles?.select,
            boxShadow: "none",
          }}
          className={cn(
            "cursor-pointer border-0 bg-(--input-bg) px-2 py-1 text-(--input-text)",
            "focus:ring-0 focus:outline-none",
            classNames?.select,
          )}
          value={selectedValue}
          onChange={(e) => {
            onChange?.(e);
            setSelectedValue(e.target.value);
          }}
        >
          {items.map(({ label, value }) => (
            <option
              key={value}
              disabled={hideValuesState?.includes(value)}
              className={cn(
                "cursor-pointer hover:text-red-500 disabled:hidden",
              )}
              value={value}
            >
              {label}
            </option>
          ))}
        </select>
        <button
          popoverTarget={dialogID}
          popoverTargetAction="show"
          className={cn(
            "cursor-pointer border-0 px-3 py-1 text-(--input-text)",
            "hover:font-extrabold hover:text-(--input-hover-text) focus:ring-0 focus:outline-none",
            classNames?.button,
          )}
          type="button"
          style={{ ...styles?.button, boxShadow: "none" }}
        >
          +
        </button>
      </div>
    </>
  );
};
