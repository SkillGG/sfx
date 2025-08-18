import {
  cn,
  type CollapsedOnomatopoeia,
  type Promisable,
  type ValidationResult,
} from "@/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSFXLangs } from "../hooks/langs";
import { SFXLangSelect } from "./sfxLangSelect";
import { env } from "@/env";
import { Validation } from "../hooks/validation";
import { ValidationErrorDisplay } from "./validationError";
import { TLEditorDirect } from "./TLEditor";
import type { ClassValue } from "clsx";

export type NoTLOnom = Omit<CollapsedOnomatopoeia, "tls">;

export type SaveState = "default" | "done" | "waiting";

type SFXTLDiscriminator =
  | { sfx: CollapsedOnomatopoeia; withTL: true }
  | { sfx: NoTLOnom; withTL?: false };

type SFXCardClasses = {
  container?: ClassValue;
  topinfo?: {
    container?: ClassValue;
    text?: ClassValue;
    reading?: ClassValue;
    language?: ClassValue;
  };
  bottominfo?: {
    container?: ClassValue;
    def?: ClassValue;
    extra?: ClassValue;
  };
  tls?: {
    container?: ClassValue;
    sfx?: SFXClasses;
  };
};

const commaToList = (str?: string | null): string => {
  return (
    str
      ?.split(";")
      .map((q, i) => `${i + 1}. ${q}`)
      .join("\n") ?? ""
  );
};

const SFXCard = ({
  sfx,
  withTL,
  classNames,
}: SFXTLDiscriminator & { classNames?: SFXCardClasses }) => {
  const { langs } = useSFXLangs();

  const usedSFX = useMemo(
    () => (withTL ? sfx : { ...sfx, tls: [] }),
    [sfx, withTL],
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-dashed border-blue-300",
        "min-w-44 bg-blue-50 px-4 py-3 shadow-sm",
        "dark:border-blue-600 dark:bg-slate-800",
        classNames?.container,
      )}
    >
      <div
        className={cn(
          "flex-rowitems-baseline flex gap-2",
          classNames?.topinfo?.container,
        )}
      >
        <div
          className={cn(
            "self-center pr-2 text-lg font-bold text-blue-900 dark:text-blue-100",
            classNames?.topinfo?.text,
            !sfx.prime && "text-orange-700 dark:text-orange-200",
          )}
        >
          {usedSFX.text}
        </div>
        {usedSFX.read && (
          <div
            className={cn(
              "text-sm whitespace-pre-wrap text-blue-500 dark:text-blue-400",
              classNames?.topinfo?.reading,
            )}
          >
            {commaToList(usedSFX.read)}
          </div>
        )}
        <div
          className={cn(
            "flex-1 text-right text-sm",
            "text-blue-500 dark:text-blue-400",
            !Number.isFinite(sfx.id) && "text-orange-700 dark:text-orange-200",
            classNames?.topinfo?.language,
          )}
        >
          ({langs.find((l) => l.code === usedSFX.language)?.name})
          {env.NEXT_PUBLIC_DEVENV === "development" &&
            `[${isFinite(sfx.id) ? sfx.id : "NEW"}]`}
        </div>
      </div>

      <div className={cn(classNames?.bottominfo?.container)}>
        <div
          className={cn(
            "whitespace-pre-wrap text-blue-700 dark:text-blue-300",
            classNames?.bottominfo?.def,
          )}
        >
          {commaToList(usedSFX.def)}
        </div>
        <div
          className={cn(
            "pl-8 text-sm whitespace-pre-wrap text-blue-400 dark:text-blue-500",
            classNames?.bottominfo?.extra,
          )}
        >
          {commaToList(usedSFX.extra)}
        </div>
      </div>

      {withTL === true && usedSFX.tls.length > 0 && (
        <div
          className={cn(
            "flex flex-wrap justify-center gap-2",
            classNames?.tls?.container,
          )}
        >
          {usedSFX.tls.map((tl) => {
            return (
              <SFX
                key={tl.sfx1Id + "." + tl.sfx2Id}
                sfx={tl.tlSFX}
                classNames={classNames?.tls?.sfx}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

type SFXEditClassNames = {
  main?: ClassValue;
  btns?: {
    cancel?: ClassValue;
  };
};

export const SFXEdit = ({
  sfx,
  withTL,
  labels,
  classNames,
  noLang,
  removeLangs,

  tlAddInfoElem,

  saveBtnState = "default",
  onSaveClicked,

  onValidate,
  onChange,
  onCancel,
}: SFXTLDiscriminator & {
  noLang?: boolean;
  removeLangs?: string[];
  labels?: {
    main?: React.ReactNode;
    empty?: React.ReactNode;
    btns?: {
      edittl?: string;
      cancel?: string;
      save?: {
        save?: string;
        saving?: string;
        saved?: string;
      };
    };
  };
  classNames?: SFXEditClassNames;

  tlAddInfoElem?: React.ReactNode;

  saveBtnState?: SaveState;
  onSaveClicked?: () => Promisable<void>;

  onChange?: (
    action: <Q extends CollapsedOnomatopoeia | NoTLOnom>(prev: Q) => Q,
  ) => void;
  onCancel: () => void;
  onValidate?: <Q extends CollapsedOnomatopoeia | NoTLOnom>(
    sfx: Q,
  ) => ValidationResult;
}) => {
  const [tempRead, setTempRead] = useState(sfx.read ?? "");

  const tlEditDialogRef = useRef<HTMLDialogElement>(null);

  const [validation, setValidation] = useState<Validation>(new Validation());

  return (
    <>
      <div
        className={cn(
          "flex flex-col gap-2 rounded-xl border-2 border-blue-300",
          "bg-blue-50 p-2 shadow-sm",
          "dark:border-blue-600 dark:bg-slate-800",
          classNames?.main,
        )}
      >
        <h2
          className={cn(
            "flex items-center justify-center border-b border-blue-200",
            "pb-2 text-center text-2xl font-semibold text-blue-800",
            "dark:border-blue-700 dark:text-blue-200",
          )}
        >
          {labels?.main ?? "Edit SFX"}{" "}
          {!noLang && (
            <SFXLangSelect
              removeValues={removeLangs}
              classNames={{
                main: "ml-2 text-sm",
              }}
              hideValues={[sfx.language, ...(removeLangs ?? [])]}
              value={sfx.language}
              onChange={(e) => {
                onChange?.((p) => ({ ...p, language: e }));
              }}
            />
          )}
        </h2>

        {/** Edit fields */}
        <div
          className={cn(
            "flex w-full flex-col gap-2",
            "text-base font-medium text-blue-700 dark:text-blue-300",
          )}
        >
          <div className={cn("flex flex-row items-start gap-2")}>
            <label
              htmlFor="sfx"
              className={cn(
                "flex-1 font-medium whitespace-nowrap",
                "text-blue-700 dark:text-blue-300",
              )}
            >
              SFX
            </label>
            <div className={cn("ml-auto flex flex-3 flex-col gap-2")}>
              <input
                className={cn(
                  "rounded border bg-white px-2 py-1",
                  "focus:ring-1 focus:outline-none dark:bg-slate-700 dark:text-white",
                  "dark:placeholder-gray-400",
                  validation.hasFieldError("text")
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400"
                    : "border-blue-300 focus:border-blue-500 focus:ring-blue-500 dark:border-blue-600 dark:focus:border-blue-400 dark:focus:ring-blue-400",
                )}
                placeholder="SFX"
                type="text"
                value={sfx.text}
                onChange={(e) => {
                  onChange?.((s) => ({ ...s, text: e.currentTarget.value }));
                  setValidation(new Validation(validation.clearError("text")));
                }}
              />
              <ValidationErrorDisplay
                className="self-end"
                errors={validation.errors}
                field="text"
                compact
              />
            </div>
          </div>

          <div className={cn("items-top flex flex-row gap-2")}>
            <label
              htmlFor="def"
              className={cn(
                "mt-1 flex-1 font-medium whitespace-nowrap",
                "text-blue-700 dark:text-blue-300",
                validation.hasFieldError("def") &&
                  "text-red-600 dark:text-red-400",
              )}
            >
              Definition
            </label>
            <div className={cn("ml-auto flex flex-3 flex-col gap-2")}>
              <input
                className={cn(
                  "flex-3 rounded border bg-white px-2 py-1",
                  "focus:ring-1 focus:outline-none dark:bg-slate-700 dark:text-white",
                  "dark:placeholder-gray-400",
                  validation.hasFieldError("def")
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400"
                    : "border-blue-300 focus:border-blue-500 focus:ring-blue-500 dark:border-blue-600 dark:focus:border-blue-400 dark:focus:ring-blue-400",
                )}
                placeholder="Definition"
                type="text"
                value={sfx.def}
                onChange={(e) => {
                  onChange?.((p) => ({ ...p, def: e.currentTarget.value }));
                  setValidation(new Validation(validation.clearError("def")));
                }}
              />
              <ValidationErrorDisplay
                className="self-end"
                errors={validation.errors}
                field="def"
                compact
              />
            </div>
          </div>

          <div className={cn("flex flex-row items-center gap-2")}>
            <label
              htmlFor="extra"
              className={cn(
                "flex-1 font-medium whitespace-nowrap",
                "text-blue-700 dark:text-blue-300",
              )}
            >
              Extra
            </label>
            <div className={cn("ml-auto flex w-full flex-3 flex-col gap-2")}>
              <input
                className={cn(
                  "ml-auto w-full rounded border bg-white px-2 py-1",
                  "focus:ring-1 focus:outline-none dark:bg-slate-700 dark:text-white",
                  "dark:placeholder-gray-400",
                  validation.hasFieldError("extra")
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400"
                    : "border-blue-300 focus:border-blue-500 focus:ring-blue-500 dark:border-blue-600 dark:focus:border-blue-400 dark:focus:ring-blue-400",
                )}
                placeholder="Extra"
                type="text"
                value={sfx.extra ?? ""}
                onChange={(e) =>
                  onChange?.((p) => ({
                    ...p,
                    extra: e.currentTarget.value || null,
                  }))
                }
              />
              <ValidationErrorDisplay
                errors={validation.errors}
                field="extra"
                compact
              />
            </div>
          </div>

          <div className={cn("flex flex-row items-center gap-2")}>
            <div className={cn("flex flex-1 items-center gap-2")}>
              <label
                htmlFor="read"
                className={cn(
                  "font-medium whitespace-nowrap",
                  "text-blue-700 dark:text-blue-300",
                  validation.hasFieldError("read") &&
                    "text-red-600 dark:text-red-400",
                )}
              >
                Reading
              </label>
              <label
                className={cn(
                  "flex items-center gap-1 text-sm",
                  "text-blue-600 dark:text-blue-400",
                )}
              >
                <input
                  type="checkbox"
                  checked={typeof sfx.read === "string"}
                  onChange={(e) =>
                    onChange?.((prev) => ({
                      ...prev,
                      read: e.currentTarget.checked ? tempRead : null,
                    }))
                  }
                  className={cn(
                    "h-4 w-4 rounded border-blue-300 text-blue-600",
                    "focus:ring-blue-500 dark:border-blue-600 dark:bg-slate-700",
                    "dark:focus:ring-blue-400",
                  )}
                />
              </label>
            </div>
            <div className={cn("ml-auto flex flex-3 flex-col gap-2")}>
              <input
                className={cn(
                  "ml-auto w-full rounded border bg-white px-2 py-1",
                  "focus:ring-1 focus:outline-none",
                  "dark:bg-slate-700 dark:text-white dark:placeholder-gray-400",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  validation.hasFieldError("read")
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400"
                    : "border-blue-300 focus:border-blue-500 focus:ring-blue-500 dark:border-blue-600 dark:focus:border-blue-400 dark:focus:ring-blue-400",
                )}
                placeholder="Reading"
                type="text"
                value={sfx.read ?? tempRead}
                onChange={(e) => {
                  onChange?.((prev) => ({
                    ...prev,
                    read: e.currentTarget.value,
                  }));
                  setTempRead(e.currentTarget.value);
                }}
                disabled={sfx.read === null}
              />
              <ValidationErrorDisplay
                errors={validation.errors}
                field="read"
                compact
              />
            </div>
          </div>
        </div>

        {!withTL && tlAddInfoElem}

        <div className={cn("mt-2 flex flex-row gap-2")}>
          <button
            className={cn(
              "rounded bg-blue-600 px-4 py-2 text-white transition-colors",
              "cursor-pointer hover:bg-blue-700",
              "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none",
              "dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-blue-400 dark:focus:ring-offset-slate-800",
            )}
            onClick={async () => {
              const validation = onValidate?.(sfx);
              if (!validation || validation?.isValid) {
                await onSaveClicked?.();
                return;
              }
              setValidation(new Validation(validation));
            }}
            type="button"
            disabled={saveBtnState === "waiting"}
          >
            {saveBtnState === "default"
              ? (labels?.btns?.save?.save ?? "Save")
              : saveBtnState === "waiting"
                ? (labels?.btns?.save?.saving ?? "Saving")
                : (labels?.btns?.save?.saved ?? "Saved")}
          </button>
          {withTL === true && (
            <>
              <dialog
                id="edittlDialog"
                className={cn(
                  "m-auto min-w-[50%] rounded-xl border border-blue-200 bg-white/95 p-6",
                  "shadow-lg backdrop-blur-sm dark:border-blue-700",
                  "dark:bg-slate-800/95 dark:text-white",
                )}
                ref={tlEditDialogRef}
                popover={"auto"}
              >
                <TLEditorDirect
                  tls={sfx.tls}
                  removeOnCancel={false}
                  sfx={sfx}
                  onChange={(tls) => {
                    onChange?.((prev) => ({ ...prev, tls }));
                  }}
                />
              </dialog>
              <button
                popoverTarget="edittlDialog"
                popoverTargetAction="show"
                className={cn(
                  "rounded bg-gray-200 px-2 py-1 text-xs",
                  "hover:bg-gray-300 dark:bg-slate-600 dark:text-white",
                  "dark:hover:bg-slate-500",
                )}
              >
                {labels?.btns?.edittl ?? "Edit TLs"}
              </button>
            </>
          )}
          <button
            className={cn(
              "rounded bg-gray-200 px-2 py-1 text-xs",
              "cursor-pointer",
              "hover:bg-gray-300 dark:bg-slate-600 dark:text-white",
              "dark:hover:bg-slate-500",
              classNames?.btns?.cancel,
            )}
            onClick={() => onCancel?.()}
            type="button"
          >
            {labels?.btns?.cancel ?? "Cancel"}
          </button>
        </div>
      </div>
    </>
  );
};

export type SFXClasses = {
  default?: SFXCardClasses;
  edit?: SFXEditClassNames;
  editable?: {
    main?: ClassValue;
    sfx?: SFXClasses;
    edit?: {
      main?: ClassValue;
      buttonEdit?: ClassValue;
      buttonRemove?: ClassValue;
    };
  };
};

export const SFX = ({
  sfx,
  editable,

  classNames,

  onSave,
  onRemove,
  withTL,
}: SFXTLDiscriminator & {
  classNames?: SFXClasses;

  onSave?: (
    prev: CollapsedOnomatopoeia,
  ) => Promisable<CollapsedOnomatopoeia | void>;
  onRemove?: () => Promisable<void>;
  editable?: boolean | undefined;
}) => {
  const [sfxCopy, setSFXCopy] = useState<CollapsedOnomatopoeia>(
    withTL ? sfx : { ...sfx, tls: [] },
  );

  useEffect(() => {
    setSFXCopy(withTL ? sfx : { ...sfx, tls: [] });
  }, [sfx, withTL]);

  const [mode, setMode] = useState<"edit" | "view">("view");

  const [removing, setRemoving] = useState(false);
  const [removeSure, setRemoveSure] = useState(false);

  const [saveState, setSaveState] = useState<SaveState>("default");

  if (editable) {
    if (mode === "view")
      return (
        <div
          className={cn("mb-2 flex flex-col gap-2", classNames?.editable?.main)}
        >
          <SFX
            sfx={sfxCopy}
            withTL={withTL}
            classNames={
              classNames?.editable?.sfx ?? { default: classNames?.default }
            }
          />
          <div
            className={cn(
              "mx-auto flex w-full max-w-[50%] gap-2",
              classNames?.editable?.edit?.main,
            )}
          >
            <button
              className={cn(
                "flex-1 cursor-pointer rounded bg-blue-600 px-4 py-2 text-white transition-colors",
                "hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                "focus:outline-none dark:bg-blue-700 dark:hover:bg-blue-600",
                "dark:focus:ring-blue-400 dark:focus:ring-offset-slate-800",
                "disabled:bg-slate-200 disabled:text-black dark:disabled:bg-slate-700 dark:disabled:text-white",
                classNames?.editable?.edit?.buttonEdit,
              )}
              onClick={() => (setMode("edit"), setSaveState("default"))}
              type="button"
            >
              Edit
            </button>

            <button
              className={cn(
                "flex-1 cursor-pointer rounded bg-red-600 px-4 py-2 text-white transition-colors",
                "hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
                "focus:outline-none dark:bg-red-700 dark:hover:bg-red-600",
                "dark:focus:ring-red-400 dark:focus:ring-offset-slate-800",
                "disabled:bg-slate-200 disabled:text-black dark:disabled:bg-slate-700 dark:disabled:text-white",
                classNames?.editable?.edit?.buttonRemove,
              )}
              onClick={async () => {
                if (!removeSure) {
                  setRemoveSure(true);
                  return;
                }
                setRemoving(true);
                await onRemove?.();
                setRemoving(false);
                setRemoveSure(false);
              }}
              onBlur={() => {
                setRemoveSure(false);
              }}
            >
              {removing
                ? "Removing..."
                : removeSure
                  ? "Are you sure?"
                  : "Remove"}
            </button>
          </div>
        </div>
      );

    return (
      <SFXEdit
        sfx={sfxCopy}
        withTL={withTL}
        classNames={classNames?.edit}
        onCancel={() => {
          setSFXCopy(withTL ? sfx : { ...sfx, tls: [] });
          setMode("view");
        }}
        onSaveClicked={async () => {
          setSaveState("waiting");
          await onSave?.(sfxCopy);
          setSaveState("done");
          setMode("view");
        }}
        saveBtnState={saveState}
        onChange={(action) => {
          setSFXCopy(action(sfxCopy));
        }}
      />
    );
  }

  return (
    <SFXCard sfx={sfxCopy} withTL={withTL} classNames={classNames?.default} />
  );
};
