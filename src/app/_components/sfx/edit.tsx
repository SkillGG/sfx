import type { ClassValue } from "clsx";
import type { SaveState, SFXTLDiscriminator } from "./utils";
import { cn, type CollapsedOnomatopoeia, type Promisable } from "@/utils/utils";
import { useRef, useState } from "react";
import { useValidation } from "@/app/hooks/validation";
import { SFXLangSelect } from "./sfxLangSelect";
import { SFXEditPanel } from "../sfxEditPanel";
import { TLEditorDirect } from "../TLEditor";

export type SFXEditClassNames = {
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

  separate,
  separateLabel,

  saveBtnState = "default",
  onSaveClicked,

  onChange,
  onCancel,

  dev,
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
  dev?: boolean;
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
            ...(dev
              ? {
                  featured: {
                    type: "switch",
                    label: "Featured",
                    value: sfx.featured,
                  },
                }
              : {}),
          }}
          onChange={(newD) => {
            onChange?.((prev) => {
              const newC = Object.entries(newD).reduce<
                Partial<CollapsedOnomatopoeia>
              >((p, [k, v]) => {
                if ("type" in v && v.type === "switch") {
                  // do nothihng
                } else if ("type" in v && k === "read") {
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
