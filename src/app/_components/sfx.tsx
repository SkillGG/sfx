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
import { TL, TLEditorDirect } from "./TLEditor";
import type { ClassValue } from "clsx";
import Image from "next/image";
import { api } from "@/trpc/react";
import { Spinner } from "./spinner";
import { AsyncImage } from "./asyncImage";

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

  return { type: "string", data: str };
};

const GetLocalImg = ({
  filename,
  alt,
  nonDB,
}: {
  filename: string;
  alt: string;
  nonDB?: React.ReactNode;
}) => {
  const [img] = nonDB
    ? [filename]
    : api.picture.getPicture.useSuspenseQuery(filename);

  const popupRef = useRef<HTMLDialogElement>(null);

  if (typeof img !== "string")
    return (
      <span className={cn("text-(--error-text)")} title={img.err.message}>
        {alt}
      </span>
    );

  const src = nonDB ? img : `data:image/png;base64,${img}`;

  return (
    <>
      <div
        className={cn(
          "relative z-0 h-fit w-fit font-bold",
          "before:items-center before:bg-(--accent-600)",
          "before:text-black before:opacity-0",
          "before:absolute before:hidden before:h-full",
          "before:w-full before:justify-center before:content-['show']",
          "hover:cursor-pointer hover:before:flex hover:before:opacity-75",
        )}
        onClick={() => {
          popupRef.current?.showPopover();
        }}
      >
        {nonDB ? (
          <AsyncImage
            src={src}
            fallback={nonDB}
            alt={alt}
            unoptimized
            priority={true}
            height={0}
            width={0}
            className={cn(
              "-z-10 h-[100px] w-auto",
              "relative hover:cursor-pointer",
            )}
            containerClassName={cn("w-fit h-full")}
            style={{ position: "initial", width: "auto" }}
          />
        ) : (
          <Image
            src={src}
            alt={alt}
            width={0}
            height={0}
            unoptimized
            className={cn("h-[100px] w-auto", "hover:cursor-pointer")}
          />
        )}
      </div>
      <dialog
        ref={popupRef}
        popover="auto"
        className={cn(
          "absolute top-0 right-0 left-0 cursor-pointer",
          "z-20 h-full w-full items-center justify-center",
          "bg-(--dialog-bg)/70",
        )}
        onClick={() => {
          popupRef.current?.hidePopover();
        }}
      >
        <div className={cn("flex h-full w-full items-center justify-center")}>
          {nonDB ? (
            <AsyncImage
              fallback={nonDB}
              width={0}
              height={0}
              containerClassName={cn("z-30")}
              className={cn("z-40 h-auto w-auto")}
              src={src}
              alt={alt}
              unoptimized
              priority={true}
              loader={({ src }) => src}
            />
          ) : (
            <Image
              width={0}
              height={0}
              unoptimized
              className={cn("h-auto w-auto")}
              src={src}
              alt={alt}
            />
          )}
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

  // TODO: make extra and fields intertwine or add (sm:) option

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
                  <GetLocalImg
                    alt={alt}
                    filename={q.data}
                    nonDB={<Spinner className={cn("h-[75px] w-[75px]")} />}
                  />
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
        "flex flex-col gap-2 rounded-lg border",
        "border-dashed border-(--regular-border)",
        "min-w-44 bg-(--sfx-card-bg)/50 px-4 py-3 shadow-sm shadow-(color:--accent-900)",
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
            "self-center pr-2 text-lg font-bold",
            "text-(--sfx-text-text)",
            classNames?.topinfo?.text,
          )}
        >
          {usedSFX.text}
        </div>

        {usedSFX.read && (
          <div
            className={cn(
              "text-sm whitespace-pre-wrap text-(--sfx-read-text)",
              classNames?.topinfo?.reading,
            )}
          >
            {parseSFXText(usedSFX.read)}
          </div>
        )}
        <div
          className={cn(
            "flex-1 text-right text-sm",
            "text-(--sfx-lang-text)",
            !Number.isFinite(sfx.id) && "text-(--sfx-lang-new-text)",
            classNames?.topinfo?.language,
          )}
        >
          {langs.find((l) => l.code === usedSFX.language)?.name}{" "}
          {env.NEXT_PUBLIC_DEVENV === "development" &&
            `[${isFinite(sfx.id) ? sfx.id : "NEW"}]`}
        </div>
      </div>

      {tlExtra && (
        <div
          className={cn(
            "flex w-fit border-2 border-x-0 border-t-0 border-dashed",
            "border-(--sfx-tlextra-underline) px-1",
            "text-base text-(--sfx-tlextra-text)",
          )}
        >
          <span>{tlExtra}</span>
        </div>
      )}

      <div className={cn(classNames?.bottominfo?.container)}>
        <div
          className={cn(
            "whitespace-pre-wrap text-(--sfx-def-text)",
            classNames?.bottominfo?.def,
          )}
        >
          {parseSFXText(usedSFX.def)}
        </div>
        <div
          className={cn(
            "pl-8 text-sm whitespace-pre-wrap text-(--sfx-extra-text)",
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
                <TL
                  key={tl.sfx1Id + "." + tl.sfx2Id}
                  tl={tl}
                  classNames={{
                    ...classNames?.tls?.sfx,
                    container: cn(
                      "flex flex-col gap-2 min-w-44 basis-[45%] grow",
                    ),
                    tlNum: "hidden",
                    default: {
                      ...classNames?.tls?.sfx?.default,
                      container: cn(
                        "border-2",
                        classNames?.tls?.sfx?.default?.container,
                        isReversed && "border-4 border-(--sfx-reversed-border)",
                      ),
                    },
                  }}
                  editable={false}
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

export const DEFAULT_SFX_INPUT_STYLES = (
  validation?: Validation,
  field?: string,
) =>
  cn(
    "rounded border px-2 py-1 text-(--sfx-input-text)",
    "bg-(--sfx-input-bg) placeholder-(--sfx-input-placeholder-text) focus:ring-1 focus:outline-none",
    "border-(--sfx-input-border) focus:border-(--input-focus-border)",
    "focus:ring-(--input-focus-border)",
    validation &&
      validation.hasFieldError(field ?? "") &&
      "border-2 border-(--sfx-input-error-border)" +
        " " +
        "placeholder-(--sfx-input-error-text)" +
        " " +
        "focus:border-(--sfx-input-error-border)" +
        " " +
        "focus:ring-(--sfx-input-error-border)",
  );

export const DEFAULT_SFX_LABEL_STYLES = cn(
  "mt-1 flex-1 font-medium whitespace-nowrap",
  "text-(color:--sfx-label-text)",
);

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
          "flex flex-col gap-2 rounded-xl border-2 border-(--regular-border)",
          "bg-(--sfx-card-bg) p-2 shadow-sm",
          classNames?.main,
        )}
      >
        <h2
          className={cn(
            "flex items-center justify-center border-b border-(--regular-border)",
            "pb-2 text-center text-2xl font-semibold text-(--sfx-header-text)",
          )}
        >
          {labels?.main ?? `Edit ${sfx.text}`}{" "}
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
          className={cn("flex w-full flex-col gap-2", "text-base font-medium")}
        >
          <div className={cn("flex flex-row items-start gap-2")}>
            <label
              htmlFor="sfx"
              className={cn(
                DEFAULT_SFX_LABEL_STYLES,
                validation.hasFieldError("text") &&
                  "font-bold text-(color:--sfx-label-error-text) underline",
              )}
            >
              SFX
            </label>
            <div className={cn("ml-auto flex flex-3 flex-col gap-2")}>
              <input
                className={cn(DEFAULT_SFX_INPUT_STYLES(validation, "text"))}
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
                DEFAULT_SFX_LABEL_STYLES,
                validation.hasFieldError("def") &&
                  "font-bold text-(color:--sfx-label-error-text) underline",
              )}
            >
              Definition
            </label>
            <div className={cn("ml-auto flex flex-3 flex-col gap-2")}>
              <input
                className={cn(DEFAULT_SFX_INPUT_STYLES(validation, "def"))}
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
            <label htmlFor="extra" className={cn(DEFAULT_SFX_LABEL_STYLES)}>
              Extra
            </label>
            <div className={cn("ml-auto flex w-full flex-3 flex-col gap-2")}>
              <input
                className={cn(DEFAULT_SFX_INPUT_STYLES(validation, "extra"))}
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
              <label htmlFor="read" className={cn(DEFAULT_SFX_LABEL_STYLES)}>
                Reading
              </label>
              <label className={cn("flex items-center gap-1")}>
                <input
                  type="checkbox"
                  checked={typeof sfx.read === "string"}
                  onChange={(e) =>
                    onChange?.((prev) => ({
                      ...prev,
                      read: e.currentTarget.checked ? tempRead : null,
                    }))
                  }
                  className="hidden"
                />
                <div
                  tabIndex={0}
                  aria-roledescription="Switch"
                  onKeyDown={(e) => {
                    if ([" ", "Enter"].includes(e.key)) {
                      onChange?.((prev) => ({
                        ...prev,
                        read: sfx.read === null ? tempRead : null,
                      }));
                    }
                  }}
                  className={cn(
                    "mr-auto h-4 w-4 rounded-full border-2 border-(--input-border)",
                    "focus:ring-(--input-focus-border)",
                    "cursor-pointer",
                    typeof sfx.read === "string"
                      ? "bg-(--button-checkbox-checked-bg)"
                      : "border-(--button-disabled-bg) opacity-50",
                  )}
                ></div>
              </label>
            </div>
            <div className={cn("ml-auto flex flex-3 flex-col gap-2")}>
              <input
                className={cn(
                  DEFAULT_SFX_INPUT_STYLES(validation, "read"),
                  "disabled:cursor-not-allowed disabled:opacity-50",
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
              "rounded bg-(--button-submit-bg) px-4 py-2 text-lg font-bold text-(--button-submit-text) transition-colors",
              "grow cursor-pointer hover:bg-(--button-submit-hover-bg)",
              "focus:ring-2 focus:ring-(--input-focus-border) focus:ring-offset-2",
              "focus:ring-offset-(color:--main-bg) focus:outline-none",
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
                  "m-auto min-w-[50%] rounded-xl border",
                  "border-(--regular-border) bg-(--dialog-bg)/50 p-6 shadow-lg backdrop-blur-sm",
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
                    onChange?.((prev) => ({ ...prev, tls }));
                  }}
                />
              </dialog>
              <button
                className={cn(
                  "flex-1 cursor-pointer rounded bg-(--button-neutral-bg) px-4 py-2 text-(--button-neutral-text)",
                  "transition-colors",
                  "hover:bg-(--button-neutral-hover-bg)",
                  "focus:ring-2 focus:ring-(--input-focus-border) focus:ring-offset-2",
                  "focus:ring-offset-(color:--main-bg) focus:outline-none",
                  "disabled:bg-(--button-neutral-disabled-bg) disabled:text-(--button-neutral-disabled-text)",
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
              "flex-1 cursor-pointer rounded bg-(--sfx-button-cancel-bg) px-4 py-2 text-(--sfx-button-cancel-text)",
              "transition-colors",
              "hover:bg-(--sfx-button-cancel-hover-bg)",
              "focus:ring-2 focus:ring-(--input-focus-border) focus:ring-offset-2",
              "focus:ring-offset-(color:--main-bg) focus:outline-none",
              "disabled:bg-(--sfx-button-cancel-disabled-bg) disabled:text-(--sfx-button-cancel-disabled-text)",
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
                "flex-1 cursor-pointer rounded bg-(--button-submit-bg) px-4 py-2 text-(--button-submit-text)",
                "transition-colors",
                "hover:bg-(--button-submit-hover-bg)",
                "focus:ring-2 focus:ring-(--input-focus-border) focus:ring-offset-2",
                "focus:ring-offset-(color:--main-bg) focus:outline-none",
                "disabled:bg-(--button-submit-disabled-bg) disabled:text-(--button-submit-disabled-text)",
                classNames?.editable?.edit?.buttonEdit,
              )}
              onClick={() => (setMode("edit"), setSaveState("default"))}
              type="button"
            >
              Edit
            </button>

            <button
              className={cn(
                "flex-1 cursor-pointer rounded bg-(--sfx-button-remove-bg) px-4 py-2 text-(--sfx-button-remove-text)",
                "transition-colors",
                "hover:bg-(--sfx-button-remove-hover-bg)",
                "focus:ring-2 focus:ring-(--input-focus-border) focus:ring-offset-2",
                "focus:ring-offset-(color:--main-bg) focus:outline-none",
                "disabled:bg-(--sfx-button-remove-disabled-bg) disabled:text-(--sfx-button-remove-disabled-text)",
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
