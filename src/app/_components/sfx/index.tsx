"use client";

import { cn, type CollapsedOnomatopoeia, type Promisable } from "@/utils/utils";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSFXLangs } from "../../hooks/langs";
import { env } from "@/env";
import { useValidation, type Validation } from "../../hooks/validation";
import { TLEditorDirect } from "../TLEditor";
import type { ClassValue } from "clsx";
import { SFXEditPanel } from "../sfxEditPanel";
import { TLCard } from "../tlCard";
import {
  type SaveState,
  type SFXCardClasses,
  type SFXTLDiscriminator,
} from "./utils";
import {
  Parser,
  parseSFXFields,
  stringToSFXFieldKey,
} from "@/utils/parse/sfxParse";
import { SFXFieldDiv } from "./fields";
import { SFXLangSelect } from "../sfx/sfxLangSelect";

const REVERSE_MARK = "⏉";

const reversedTL = (str?: string): string => {
  if (!str) return "";

  const hides = Parser.parseMultiple(str)?.filter((q) => Parser.isHide(q));

  return `${Parser.strip(str)};${hides
    .map((q) =>
      stringToSFXFieldKey(q.key) === "def"
        ? q.revIndices?.map((q) => `_d${q + 1}:(Not here)`)
        : "",
    )
    .flat(2)
    .filter(Boolean)
    .join(";")}`;
};

const SFXCard = ({
  sfx,
  classNames,
  tlExtra,
}: SFXTLDiscriminator & {
  classNames?: SFXCardClasses;
  tlExtra?: string;
}) => {
  const { langs } = useSFXLangs();

  const usedSFX = useMemo(() => ({ ...sfx }), [sfx]);
  const titleId = `sfx_${usedSFX.id}_title`;

  const curTLExtra = useMemo(() => {
    const reversedTLs = sfx.tls
      .filter((q) => q.additionalInfo?.startsWith(REVERSE_MARK))
      .map((q) => q.additionalInfo?.substring(1) ?? "")
      .filter<string>((q): q is string => !!q)
      .filter((q) => !Parser.asHide(q));

    return `${tlExtra ?? ""}${tlExtra ? ";" : ""}${reversedTLs.join(";")}`;
  }, [tlExtra, sfx.tls]);

  const parsed = useMemo(
    () =>
      parseSFXFields({
        def: sfx.def,
        extra: sfx.extra,
        read: sfx.read,
        tlExtra: curTLExtra,
      }),
    [sfx.def, sfx.extra, sfx.read, curTLExtra],
  );

  console.log("parsed", sfx.id, parsed);

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
      {/* <div className="absolute top-2 left-2 text-red-500">*</div> */}
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
          <div className={cn(classNames?.topinfo?.reading)}>
            {parsed.read
              ?.filter((q) => q.type === "string")
              .filter((q) => !q.hidden)
              .map((read) => {
                return (
                  <SFXFieldDiv
                    key={`${usedSFX.id}_read_${read.index}_${read.value}`}
                    field={read}
                    type="read"
                  />
                );
              })}
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

      {!!parsed.tlExtra?.length && (
        <section
          className={cn(
            "flex w-fit border-2 border-x-0 border-t-0 border-dashed",
            "border-(--sfx-tlextra-underline) px-1",
            "flex-col",
            classNames?.tlExtras?.container,
          )}
          aria-labelledby={titleId}
          aria-label="SFX translation info"
        >
          {parsed.tlExtra
            .filter((q) => q.type === "string")
            .filter((q) => !q.hidden)
            .map((field) => (
              <SFXFieldDiv
                key={`${sfx.id}_tl_${field.index}_${field.value}`}
                field={field}
                type="tlExtra"
                className={classNames?.tlExtras?.field}
              />
            ))}
        </section>
      )}

      <section
        className={cn(classNames?.bottominfo?.container)}
        aria-labelledby={titleId}
        aria-label="SFX definition"
      >
        <div className={cn(classNames?.bottominfo?.def)}>
          {parsed.def
            ?.filter((q) => q.type === "string")
            .filter((q) => !q.hidden)
            .map((field) => (
              <SFXFieldDiv
                key={`${usedSFX.id}_def_${field.index}_${field.value}`}
                field={field}
                type="def"
              />
            ))}
        </div>
      </section>
      <section
        className={cn(classNames?.bottominfo?.container)}
        aria-labelledby={titleId}
        aria-label="SFX extras"
      >
        <div className={cn("pl-8", classNames?.bottominfo?.extra)}>
          {parsed.extra
            ?.filter((q) => q.type === "string")
            .filter((q) => !q.hidden)
            .map((field) => (
              <SFXFieldDiv
                key={`${usedSFX.id}_extra_${field.index}_${field.value}`}
                field={field}
                type="extra"
              />
            ))}
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
              const isReversed = tl.additionalInfo?.startsWith(REVERSE_MARK);
              return (
                <TLCard
                  key={tl.sfx1Id + "." + tl.sfx2Id}
                  tl={
                    isReversed
                      ? {
                          ...tl,
                          additionalInfo: reversedTL(
                            tl.additionalInfo?.substring(1),
                          ),
                        }
                      : tl
                  }
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
    console.log("Rendering new SFX", sfx.id);
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

  if (
    editable &&
    !(
      tlExtra?.startsWith(REVERSE_MARK) ||
      sfx.tls.some((q) => q.additionalInfo?.startsWith(REVERSE_MARK))
    )
  ) {
    if (mode === "view")
      return (
        <div
          className={cn(
            "relative mb-2 flex flex-col gap-2",
            classNames?.editable?.main,
          )}
        >
          <SFX
            sfx={sfxCopy}
            classNames={
              classNames?.editable?.sfx ?? {
                default: classNames?.default,
              }
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
