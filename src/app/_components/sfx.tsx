import { cn, type CollapsedOnomatopoeia, type Promisable } from "@/utils";
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
import { useValidation, type Validation } from "../hooks/validation";
import { TLEditorDirect } from "./TLEditor";
import type { ClassValue } from "clsx";
import Image from "next/image";
import { api } from "@/trpc/react";
import { Spinner } from "./spinner";
import { AsyncImage } from "./asyncImage";
import { SFXEditPanel } from "./sfxEditPanel";
import { TLCard } from "./tlCard";

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
          "relative z-0 h-fit max-h-[100px] w-fit font-bold",
          "before:items-center before:bg-(--accent-600)",
          "before:text-black before:opacity-0",
          "before:absolute before:hidden before:h-full",
          "before:w-full before:justify-center before:content-['show']",
          "hover:cursor-pointer hover:before:flex hover:before:opacity-75",
          "text-center hover:before:wrap-anywhere hover:before:break-all",
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
      <div className={cn("flex justify-around gap-2")}>
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
}: SFXTLDiscriminator & {
  classNames?: SFXCardClasses;
  tlExtra?: string;
}) => {
  const { langs } = useSFXLangs();

  const usedSFX = useMemo(() => ({ ...sfx }), [sfx]);
  const titleId = `sfx_${usedSFX.id}_title`;

  return (
    <article
      className={cn(
        "flex flex-col gap-2 rounded-lg border",
        "border-dashed border-(--regular-border)",
        "min-w-44 bg-(--sfx-card-bg)/50 px-4 py-3 shadow-sm shadow-(color:--accent-900)",
        classNames?.container,
      )}
      aria-labelledby={titleId}
      aria-label="SFX entry"
    >
      <header
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
          id={titleId}
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
      </header>

      {tlExtra && (
        <section
          className={cn(
            "flex w-fit border-2 border-x-0 border-t-0 border-dashed",
            "border-(--sfx-tlextra-underline) px-1",
            "text-base text-(--sfx-tlextra-text)",
          )}
          aria-labelledby={titleId}
          aria-label="SFX translation info"
        >
          <span>{tlExtra}</span>
        </section>
      )}

      <section
        className={cn(classNames?.bottominfo?.container)}
        aria-labelledby={titleId}
        aria-label="SFX details"
      >
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
      </section>

      {usedSFX.tls.length > 0 && (
        <>
          <section
            className={cn(
              "flex flex-wrap justify-center gap-2",
              classNames?.tls?.container,
            )}
            aria-labelledby={titleId}
            aria-label="SFX translation list"
          >
            {usedSFX.tls.map((tl) => {
              const isReversed = tl.additionalInfo?.startsWith("⏉");
              return (
                <TLCard
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
          </section>
        </>
      )}
    </article>
  );
};

export type SFXEditClassNames = {
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
    "bg-(--sfx-input-bg) placeholder-(--sfx-input-placeholder-text)/50 focus:ring-1 focus:outline-none",
    "border-(--sfx-input-border) focus:border-(--input-focus-border)",
    "focus:ring-(--input-focus-border)",
    validation &&
      validation.hasFieldError(field ?? "") &&
      "border-2 border-(--sfx-input-error-border)" +
        " " +
        "placeholder-(--sfx-input-error-text)/50" +
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

  separate,
  separateLabel,

  saveBtnState = "default",
  onSaveClicked,

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

  separate?: (sfx: CollapsedOnomatopoeia) => void;
  separateLabel?: string;

  onChange?: (
    action: (prev: CollapsedOnomatopoeia) => CollapsedOnomatopoeia,
  ) => void;
  onCancel: () => void;
}) => {
  const tlEditDialogRef = useRef<HTMLDialogElement>(null);

  const validation = useValidation();

  const [tempRead, setTempRead] = useState("");

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
        <SFXEditPanel
          validation={validation}
          value={{
            text: { label: "SFX", value: sfx.text, key: `sfxtext_${sfx.id}` },
            def: {
              label: "Definition",
              value: sfx.def,
              key: `sfxdef_${sfx.id}`,
              long: true,
            },
            extra: {
              label: "Extra",
              value: sfx.extra ?? "",
              key: `sfxextra_${sfx.id}`,
              long: true,
            },
            read: {
              label: "Reading",
              value: sfx.read,
              type: "toggle",
              temp: tempRead,
              key: `sfxread_${sfx.id}`,
              long: true,
            },
          }}
          onChange={(newD) => {
            onChange?.((prev) => {
              const newC = Object.entries(newD).reduce<
                Partial<CollapsedOnomatopoeia>
              >((p, [k, v]) => {
                if ("type" in v && k === "read") {
                  setTempRead(v.temp);
                }
                return { ...p, [k]: v.value };
              }, {});

              const newOnom = { ...prev, ...newC };
              return newOnom;
            });
          }}
        />

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
              const res = validation.validateSFXData(sfx);
              if (!res || res?.isValid) {
                await onSaveClicked?.();
                return;
              }
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
                  separate={separate}
                  separateLabel={separateLabel}
                  sfx={sfx}
                  onChange={(tls) => {
                    onChange?.((prev) => ({ ...prev, tls }));
                  }}
                  classNames={{
                    container: cn("bg-(--dialog-bg)/25"),
                    tls: {
                      container: "bg-(--dialog-bg)/10",
                      tl: {
                        sfxedit: {
                          main: "bg-(--dialog-bg)/10",
                        },
                        default: {
                          container: "bg-(--dialog-bg)/10",
                        },
                      },
                    },
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

export type SFXLabels = {
  edit?: string;
  removeDefault?: string;
  removeSure?: string;
  removing?: string;
  separate?: string;
};

export const SFX = ({
  sfx,
  editable,

  classNames,

  separate,

  onSave,
  onRemove,
  tlExtra,
  labels,

  allowDeeperTLs,
}: SFXTLDiscriminator & {
  classNames?: SFXClasses;

  onSave?: (
    prev: CollapsedOnomatopoeia,
  ) => Promisable<CollapsedOnomatopoeia | void>;
  onRemove?: () => Promisable<void>;

  separate?: (sfx: CollapsedOnomatopoeia) => void;
  editable?: boolean | undefined;
  tlExtra?: string;
  labels?: SFXLabels;

  allowDeeperTLs?: boolean;
}) => {
  const [sfxCopy, setSFXCopy] = useState<CollapsedOnomatopoeia>({ ...sfx });

  useEffect(() => {
    setSFXCopy(sfx);
  }, [sfx]);

  const [mode, setMode] = useState<"edit" | "view">("view");

  const [removing, setRemoving] = useState(false);
  const [removeSure, setRemoveSure] = useState(false);

  const [saveState, setSaveState] = useState<SaveState>("default");

  const removeLabel = removing
    ? (labels?.removing ?? "Removing...")
    : removeSure
      ? (labels?.removeSure ?? "Are you sure?")
      : (labels?.removeDefault ?? "Remove");

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
              {labels?.edit ?? "Edit"}
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
              {removeLabel}
            </button>
          </div>
        </div>
      );

    return (
      <SFXEdit
        sfx={sfxCopy}
        allowDeeperTLs={allowDeeperTLs}
        classNames={classNames?.edit}
        onCancel={() => {
          setSFXCopy(sfx);
          setMode("view");
        }}
        separate={
          separate
            ? (sfx) => {
                separate(sfx);
                setMode("view");
              }
            : undefined
        }
        separateLabel={labels?.separate}
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
