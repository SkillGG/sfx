import {
  cn,
  type CollapsedOnomatopoeia,
  type Promisable,
  type ValidationResult,
} from "@/utils";
import React, {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSFXLangs } from "../hooks/langs";
import { SFXLangSelect } from "./sfxLangSelect";
import { env } from "@/env";
import { Validation } from "../hooks/validation";
import { ValidationErrorDisplay } from "./validationError";
import { TLEditorDirect } from "./TLEditor";
import type { ClassValue } from "clsx";
import Image from "next/image";
import { api } from "@/trpc/react";
import { Spinner } from "./spinner";

export type SaveState = "default" | "done" | "waiting";

type SFXTLDiscriminator = { sfx: CollapsedOnomatopoeia };

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

type SFXField =
  | {
      type: "string";
      data: string;
    }
  | { type: "img"; data: string }
  | { type: "sfxlink"; data: number }
  | { type: "link"; data: string };

type Arrayable<T> = T | T[];

const sfxFieldFromString = (str: string): Arrayable<SFXField | null> => {
  const imgRegex =
    /(img:(?<img>.+))|(imgs:\[(?<imgs>[^,]+,?(?:[^,]+,?)+)\])/gi.exec(str);

  if (!!imgRegex) {
    if (!!imgRegex.groups?.img) {
      return { type: "img", data: imgRegex.groups.img };
    }
    if (!!imgRegex.groups?.imgs) {
      return imgRegex.groups.imgs.split(",").map((data) => {
        return { data, type: "img" };
      });
    }
  }

  if (!str.includes(":")) {
    return { type: "string", data: str };
  }
  return null;
};

const GetLocalImg = ({ filename, alt }: { filename: string; alt: string }) => {
  const [img] = api.picture.getPicture.useSuspenseQuery(filename);

  const popupRef = useRef<HTMLDialogElement>(null);

  if (typeof img !== "string")
    return (
      <span
        className={cn("text-red-900 dark:text-red-300")}
        title={img.err.message}
      >
        {alt}
      </span>
    );

  const src = `data:image/png;base64,${img}`;

  return (
    <>
      <div
        className={cn(
          "relative w-fit",
          "before:absolute before:hidden before:h-full before:w-full before:justify-center hover:before:flex",
          "font-bold before:items-center before:bg-(--accent-600) before:text-black before:opacity-0",
          "before:content-['show'] hover:cursor-pointer hover:before:opacity-75",
        )}
        onClick={() => {
          popupRef.current?.showPopover();
        }}
      >
        <Image
          src={src}
          alt={alt}
          width={100}
          height={100}
          className={cn("h-auto max-h-[100px] w-auto", "hover:cursor-pointer")}
        />
      </div>
      <dialog
        ref={popupRef}
        popover="auto"
        className="absolute top-0 right-0 left-0 h-full w-full items-center justify-center bg-(--accent-200)/50 dark:bg-(--accent-900)/15"
        onClick={() => {
          popupRef.current?.hidePopover();
        }}
      >
        <div className={cn("flex h-full w-full items-center justify-center")}>
          <Image
            width={0}
            height={0}
            className={cn("h-auto w-auto")}
            src={src}
            alt={alt}
          />
        </div>
      </dialog>
    </>
  );
};

const parseSFXText = (str?: string | null): ReactNode => {
  const fields: SFXField[] =
    str
      ?.split(";")
      .map((fieldstr) => {
        return sfxFieldFromString(fieldstr);
      })
      .flat(1)
      .filter((q) => !!q) ?? [];

  return (
    <>
      {fields
        .filter((q) => q.type === "string")
        .map((q, i, arr) => {
          return (
            <React.Fragment key={q.data}>
              {arr[0]?.data.startsWith("- ") && `${i + 1}. `}
              {i === 0 && q.data.startsWith("- ")
                ? q.data.substring(1)
                : q.data}
              {"\n"}
            </React.Fragment>
          );
        })}
      <div className={cn("flex justify-around")}>
        {fields
          .filter((q) => q.type === "img")
          .map((q, i) => {
            const alt = `Example #${i + 1}`;
            const img = (
              <Suspense
                key={`img_${q.data}`}
                fallback={<Spinner className={cn("h-[75px] w-[75px]")} />}
              >
                {q.data.startsWith("@") ? (
                  <GetLocalImg alt={alt} filename={q.data.substring(1)} />
                ) : (
                  <Image alt={alt} src={q.data} width={50} height={50} />
                )}
              </Suspense>
            );

            return img;
          })}
      </div>
    </>
  );
};

const SFXCard = ({
  sfx,
  tlExtra,
  classNames,
}: SFXTLDiscriminator & { classNames?: SFXCardClasses; tlExtra?: string }) => {
  const { langs } = useSFXLangs();

  const usedSFX = useMemo(() => ({ ...sfx }), [sfx]);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-dashed border-(color:--accent-300)",
        "min-w-44 bg-(color:--accent-50) px-4 py-3 shadow-sm",
        "dark:border-(color:--accent-600) dark:bg-slate-800",
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
            "self-center pr-2 text-lg font-bold text-(color:--accent-900) dark:text-(color:--accent-100)",
            classNames?.topinfo?.text,
          )}
        >
          {usedSFX.text}
        </div>

        {usedSFX.read && (
          <div
            className={cn(
              "text-sm whitespace-pre-wrap text-(color:--accent-500) dark:text-(color:--accent-400)",
              classNames?.topinfo?.reading,
            )}
          >
            {parseSFXText(usedSFX.read)}
          </div>
        )}
        <div
          className={cn(
            "flex-1 text-right text-sm",
            "text-(color:--accent-500) dark:text-(color:--accent-400)",
            !Number.isFinite(sfx.id) &&
              "text-(color:--notice-700) dark:text-(color:--dark-notice-200)",
            classNames?.topinfo?.language,
          )}
        >
          ({langs.find((l) => l.code === usedSFX.language)?.name})
          {env.NEXT_PUBLIC_DEVENV === "development" &&
            `[${isFinite(sfx.id) ? sfx.id : "NEW"}]`}
        </div>
      </div>

      {tlExtra && (
        <div
          className={cn(
            "flex w-fit border-2 border-x-0 border-t-0 border-dashed border-red-300 px-1",
            "text-base text-(color:--accent-400) dark:text-(color:--accent-300)",
          )}
        >
          <span>{tlExtra}</span>
        </div>
      )}

      <div className={cn(classNames?.bottominfo?.container)}>
        <div
          className={cn(
            "whitespace-pre-wrap text-(color:--accent-700) dark:text-(color:--accent-300)",
            classNames?.bottominfo?.def,
          )}
        >
          {parseSFXText(usedSFX.def)}
        </div>
        <div
          className={cn(
            "pl-8 text-sm whitespace-pre-wrap text-(color:--accent-400) dark:text-(color:--accent-500)",
            classNames?.bottominfo?.extra,
          )}
        >
          {parseSFXText(usedSFX.extra)}
        </div>
      </div>

      {usedSFX.tls.length > 0 && (
        <>
          <div
            className={cn(
              "flex flex-wrap justify-center gap-2",
              classNames?.tls?.container,
            )}
          >
            {usedSFX.tls.map((tl) => {
              const isReversed = tl.additionalInfo?.startsWith("⏉");
              return (
                <SFX
                  key={tl.sfx1Id + "." + tl.sfx2Id}
                  sfx={tl.sfx}
                  classNames={{
                    ...classNames?.tls?.sfx,
                    default: {
                      ...classNames?.tls?.sfx?.default,
                      container: cn(
                        "border-2 dark:border-1",
                        classNames?.tls?.sfx?.default?.container,
                        isReversed &&
                          "border-(color:--error-900) dark:border-(color:--warning-400)",
                      ),
                    },
                  }}
                  tlExtra={tl.additionalInfo?.replace("⏉", "") ?? undefined}
                />
              );
            })}
          </div>
        </>
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
  labels,
  classNames,
  noLang,
  removeLangs,

  tlAddInfoElem,

  noTLs,
  allowDeeperTLs,

  saveBtnState = "default",
  onSaveClicked,

  onValidate,
  onChange,
  onCancel,
}: SFXTLDiscriminator & {
  noLang?: boolean;
  removeLangs?: string[];
  noTLs?: boolean;
  allowDeeperTLs?: boolean;
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
    action: (prev: CollapsedOnomatopoeia) => CollapsedOnomatopoeia,
  ) => void;
  onCancel: () => void;
  onValidate?: (sfx: CollapsedOnomatopoeia) => ValidationResult;
}) => {
  const [tempRead, setTempRead] = useState(sfx.read ?? "");

  const tlEditDialogRef = useRef<HTMLDialogElement>(null);

  const [validation, setValidation] = useState<Validation>(new Validation());

  return (
    <>
      <div
        className={cn(
          "flex flex-col gap-2 rounded-xl border-2 border-(color:--accent-300)",
          "bg-(color:--accent-50) p-2 shadow-sm",
          "dark:border-(color:--accent-600) dark:bg-slate-800",
          classNames?.main,
        )}
      >
        <h2
          className={cn(
            "flex items-center justify-center border-b border-(color:--accent-200)",
            "pb-2 text-center text-2xl font-semibold text-(color:--accent-800)",
            "dark:border-(color:--accent-700) dark:text-(color:--accent-200)",
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
            "text-base font-medium text-(color:--accent-700) dark:text-(color:--accent-300)",
          )}
        >
          <div className={cn("flex flex-row items-start gap-2")}>
            <label
              htmlFor="sfx"
              className={cn(
                "flex-1 font-medium whitespace-nowrap",
                "text-(color:--accent-700) dark:text-(color:--accent-300)",
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
                    : "border-(color:--accent-300) focus:border-(color:--accent-500) focus:ring-(color:--accent-500) dark:border-(color:--accent-600) dark:focus:border-(color:--accent-400) dark:focus:ring-(color:--accent-400)",
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
                "text-(color:--accent-700) dark:text-(color:--accent-300)",
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
                    : "border-(color:--accent-300) focus:border-(color:--accent-500) focus:ring-(color:--accent-500) dark:border-(color:--accent-600) dark:focus:border-(color:--accent-400) dark:focus:ring-(color:--accent-400)",
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
                "text-(color:--accent-700) dark:text-(color:--accent-300)",
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
                    : "border-(color:--accent-300) focus:border-(color:--accent-500) focus:ring-(color:--accent-500) dark:border-(color:--accent-600) dark:focus:border-(color:--accent-400) dark:focus:ring-(color:--accent-400)",
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
                  "text-(color:--accent-700) dark:text-(color:--accent-300)",
                  validation.hasFieldError("read") &&
                    "text-red-600 dark:text-red-400",
                )}
              >
                Reading
              </label>
              <label
                className={cn(
                  "flex items-center gap-1 text-sm",
                  "text-(color:--accent-600) dark:text-(color:--accent-400)",
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
                    "h-4 w-4 rounded border-(color:--accent-300) text-(color:--accent-600)",
                    "focus:ring-(color:--accent-500) dark:border-(color:--accent-600) dark:bg-slate-700",
                    "dark:focus:ring-(color:--accent-400)",
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
                    : "border-(color:--accent-300) focus:border-(color:--accent-500) focus:ring-(color:--accent-500) dark:border-(color:--accent-600) dark:focus:border-(color:--accent-400) dark:focus:ring-(color:--accent-400)",
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

        {tlAddInfoElem}

        <div className={cn("mt-2 flex flex-row gap-2")}>
          <button
            className={cn(
              "rounded bg-(color:--accent-600) px-4 py-2 text-white transition-colors",
              "cursor-pointer hover:bg-(color:--accent-700)",
              "focus:ring-2 focus:ring-(color:--accent-500) focus:ring-offset-2 focus:outline-none",
              "dark:bg-(color:--accent-700) dark:hover:bg-(color:--accent-600) dark:focus:ring-(color:--accent-400) dark:focus:ring-offset-slate-800",
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

          {!noTLs && (
            <>
              <dialog
                id={`tleditdialog_${sfx.id}`}
                className={cn(
                  "m-auto min-w-[50%] rounded-xl border border-(color:--accent-200) bg-white/95 p-6",
                  "shadow-lg backdrop-blur-sm dark:border-(color:--accent-700)",
                  "dark:bg-slate-800/95 dark:text-white",
                )}
                ref={tlEditDialogRef}
                popover="auto"
              >
                <TLEditorDirect
                  tls={sfx.tls}
                  removeOnCancel={false}
                  noTLs={allowDeeperTLs ? false : true}
                  allowDeeperTLs={allowDeeperTLs}
                  sfx={sfx}
                  onChange={(tls) => {
                    console.log("tls_sfx_change", sfx.text, tls);

                    onChange?.((prev) => ({ ...prev, tls }));
                  }}
                />
              </dialog>
              <button
                className={cn(
                  "rounded bg-gray-200 px-2 py-1 text-xs",
                  "hover:bg-gray-300 dark:bg-slate-600 dark:text-white",
                  "dark:hover:bg-slate-500",
                )}
                onClick={() => {
                  tlEditDialogRef.current?.showPopover();
                }}
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
  tlExtra,
}: SFXTLDiscriminator & {
  classNames?: SFXClasses;

  onSave?: (
    prev: CollapsedOnomatopoeia,
  ) => Promisable<CollapsedOnomatopoeia | void>;
  onRemove?: () => Promisable<void>;
  editable?: boolean | undefined;
  tlExtra?: string;
}) => {
  const [sfxCopy, setSFXCopy] = useState<CollapsedOnomatopoeia>({ ...sfx });

  useEffect(() => {
    setSFXCopy(sfx);
  }, [sfx]);

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
                "flex-1 cursor-pointer rounded bg-(color:--accent-600) px-4 py-2 text-white transition-colors",
                "hover:bg-(color:--accent-700) focus:ring-2 focus:ring-(color:--accent-500) focus:ring-offset-2",
                "focus:outline-none dark:bg-(color:--accent-700) dark:hover:bg-(color:--accent-600)",
                "dark:focus:ring-(color:--accent-400) dark:focus:ring-offset-slate-800",
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
        classNames={classNames?.edit}
        onCancel={() => {
          setSFXCopy(sfx);
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
        tlAddInfoElem={<>{tlExtra ?? ""}</>}
      />
    );
  }

  return (
    <SFXCard sfx={sfxCopy} classNames={classNames?.default} tlExtra={tlExtra} />
  );
};
