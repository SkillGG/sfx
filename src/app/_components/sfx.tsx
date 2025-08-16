import {
  cn,
  type CollapsedOnomatopoeia,
  makeDialogBackdropExitable,
  type Promisable,
  type ValidationResult,
} from "@/utils";
import { useMemo, useRef, useState } from "react";
import { useSFXLangs } from "../hooks/langs";
import { SFXLangSelect } from "./sfxLangSelect";
import { env } from "@/env";
import { Validation } from "../hooks/validation";
import { ValidationErrorDisplay } from "./validationError";
import { TLEditorDirect } from "./TLEditor";

export type NoTLOnom = Omit<CollapsedOnomatopoeia, "tls">;

export type SaveState = "default" | "done" | "waiting";

type SFXTLDiscriminator =
  | { sfx: CollapsedOnomatopoeia; withTL: true }
  | { sfx: NoTLOnom; withTL?: false };

const SFXCard = ({ sfx, withTL }: SFXTLDiscriminator) => {
  const { langs } = useSFXLangs();

  const usedSFX = useMemo(
    () => (withTL ? sfx : { ...sfx, tls: [] }),
    [sfx, withTL],
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-dashed border-blue-300",
        "bg-blue-50 px-4 py-3 shadow-sm",
        "dark:border-blue-600 dark:bg-slate-800",
      )}
    >
      <div className={cn("flex flex-row items-baseline gap-2")}>
        <div
          className={cn("text-lg font-bold text-blue-900 dark:text-blue-100")}
        >
          {usedSFX.text}
        </div>
        {usedSFX.read && (
          <div className={cn("text-sm text-blue-500 dark:text-blue-400")}>
            {usedSFX.read}
          </div>
        )}
        <div
          className={cn(
            "flex-1 text-right text-sm",
            "text-blue-500 dark:text-blue-400",
            !Number.isFinite(sfx.id) && "text-orange-700 dark:text-orange-200",
          )}
        >
          ({langs.find((l) => l.code === usedSFX.language)?.name})
          {env.NEXT_PUBLIC_DEVENV === "development" && `[${sfx.id}]`}
        </div>
      </div>

      <div>
        <div className={cn("text-blue-700 dark:text-blue-300")}>
          {usedSFX.def}
        </div>
        <div className={cn("text-sm text-blue-400 dark:text-blue-500")}>
          {usedSFX.extra ?? ""}
        </div>
      </div>

      {withTL === true && usedSFX.tls.length > 0 && (
        <div className={cn("flex")}>
          {usedSFX.tls.map((tl) => {
            return <SFX key={tl.sfx1Id + "." + tl.sfx2Id} sfx={tl.tlSFX} />;
          })}
        </div>
      )}
    </div>
  );
};

export const SFXEdit = ({
  sfx,
  withTL,
  labels,
  classNames,
  noLang,
  removeLangs,

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
  };
  classNames?: {
    main?: string;
  };

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
              ? "Save"
              : saveBtnState === "waiting"
                ? "Saving"
                : "Saved"}
          </button>
          {withTL === true && (
            <>
              <dialog
                className={cn(
                  "m-auto rounded-xl border border-blue-200 bg-white/95 p-6",
                  "shadow-lg backdrop-blur-sm dark:border-blue-700",
                  "dark:bg-slate-800/95 dark:text-white",
                )}
                ref={tlEditDialogRef}
                onClose={() => {
                  tlEditDialogRef.current?.close();
                }}
              >
                <TLEditorDirect
                  tls={sfx.tls}
                  onChange={() => console.log("sfx.tls changed")}
                />
              </dialog>
              <button
                className={cn(
                  "rounded bg-gray-200 px-2 py-1 text-xs",
                  "hover:bg-gray-300 dark:bg-slate-600 dark:text-white",
                  "dark:hover:bg-slate-500",
                )}
                onClick={() => {
                  if (tlEditDialogRef.current) {
                    makeDialogBackdropExitable(tlEditDialogRef.current);
                    tlEditDialogRef.current.showModal();
                  }
                }}
              >
                Edit translations
              </button>
            </>
          )}
          <button
            className={cn(
              "rounded bg-gray-200 px-2 py-1 text-xs",
              "cursor-pointer",
              "hover:bg-gray-300 dark:bg-slate-600 dark:text-white",
              "dark:hover:bg-slate-500",
            )}
            onClick={() => onCancel?.()}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

export const SFX = ({
  sfx,
  editable,
  onSave,
  onRemove,
  withTL,
}: SFXTLDiscriminator & {
  onSave?: (
    prev: CollapsedOnomatopoeia,
  ) => CollapsedOnomatopoeia | void | Promise<CollapsedOnomatopoeia | void>;
  onRemove?: () => Promise<void>;
  editable?: boolean | undefined;
}) => {
  const [sfxCopy, setSFXCopy] = useState<CollapsedOnomatopoeia>(
    withTL ? sfx : { ...sfx, tls: [] },
  );

  const [mode, setMode] = useState<"edit" | "view">("view");

  const [removing, setRemoving] = useState(false);
  const [removeSure, setRemoveSure] = useState(false);

  const [saveState, setSaveState] = useState<SaveState>("default");

  if (editable) {
    if (mode === "view")
      return (
        <div className={cn("mb-2 flex flex-col gap-2")}>
          <SFX sfx={sfxCopy} />
          <div className={cn("mx-auto flex w-full max-w-[50%] gap-2")}>
            <button
              className={cn(
                "flex-1 cursor-pointer rounded bg-blue-600 px-4 py-2 text-white transition-colors",
                "hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                "focus:outline-none dark:bg-blue-700 dark:hover:bg-blue-600",
                "dark:focus:ring-blue-400 dark:focus:ring-offset-slate-800",
                "disabled:bg-slate-200 disabled:text-black dark:disabled:bg-slate-700 dark:disabled:text-white",
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
        withTL
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

  return <SFXCard sfx={sfxCopy} withTL />;
};
