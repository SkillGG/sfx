import {
  cn,
  type CollapsedOnomatopoeia,
  type CollapsedTL,
  type Promisable,
} from "@/utils";
import {
  DEFAULT_SFX_INPUT_STYLES,
  DEFAULT_SFX_LABEL_STYLES,
  SFX,
  SFXEdit,
  type SaveState,
  type SFXClasses,
} from "./sfx";
import { SFXLangSelect } from "./sfxLangSelect";
import React, { useRef, useState, type RefObject } from "react";
import { useSFXLangs } from "../hooks/langs";
import { Validation } from "../hooks/validation";
import { api } from "@/trpc/react";
import type { ClassValue } from "clsx";

export const TL = ({
  tl,

  editable = true,

  removeLangs,

  removeOnCancel,

  noTLs,
  allowDeeperTLs,

  classNames,

  onChange,
  onSave,
}: {
  tl: CollapsedTL;

  editable?: boolean;

  removeLangs?: string[];
  removeOnCancel?: boolean;

  noTLs?: boolean;
  allowDeeperTLs?: boolean;

  classNames?: SFXClasses & { container?: ClassValue; tlNum?: ClassValue };

  onSave?: (tl: CollapsedTL | null) => Promisable<void>;
  onChange?: (tl: CollapsedTL) => Promisable<void>;
}) => {
  const { langs } = useSFXLangs();

  const [mode, setMode] = useState<"view" | "edit">(
    !tl.sfx.text ? "edit" : "view",
  );

  const [onceSaved, setOnceSaved] = useState(!!tl.sfx.text);

  const [cancelData, setCancelData] = useState<CollapsedOnomatopoeia | null>(
    null,
  );

  const isReversed = tl.additionalInfo?.startsWith("⏉");

  if (mode === "edit" && !isReversed && editable) {
    return (
      <>
        <SFXEdit
          noTLs={noTLs}
          allowDeeperTLs={allowDeeperTLs}
          removeLangs={removeLangs}
          classNames={{
            btns: {
              cancel:
                removeOnCancel &&
                !onceSaved &&
                `bg-(--sfx-button-remove-bg) text-(--sfx-button-remove-text)
                hover:bg-(--sfx-button-remove-hover-bg)`,
            },
          }}
          labels={{
            main: `New ${langs.find((l) => l.code === tl.sfx.language)?.name ?? "unknown"} TL (${tl.id})`,
            btns: {
              cancel: removeOnCancel && !onceSaved ? "Remove" : "Cancel",
            },
          }}
          onValidate={(sfx) => {
            return new Validation().validateSFXData(sfx);
          }}
          sfx={tl.sfx}
          onCancel={async () => {
            if (removeOnCancel && !onceSaved) {
              await onSave?.(null);
              return;
            }

            await onChange?.({ ...tl, sfx: cancelData ?? tl.sfx });
            setMode("view");
          }}
          onChange={async (action) => {
            await onChange?.({ ...tl, sfx: action(tl.sfx) });
          }}
          onSaveClicked={async () => {
            await onSave?.(tl);
            setOnceSaved(true);
            setCancelData(tl.sfx);
            setMode("view");
          }}
          tlAddInfoElem={
            <div className={cn("flex flex-row items-center gap-2")}>
              <div className={cn(DEFAULT_SFX_LABEL_STYLES)}>TL info</div>
              <div className={cn("ml-auto flex flex-3 flex-col gap-2")}>
                <input
                  id={`tl-additional-info-${tl.id}`}
                  className={cn(DEFAULT_SFX_INPUT_STYLES())}
                  type="text"
                  value={tl.additionalInfo ?? ""}
                  onChange={({ currentTarget: { value: additionalInfo } }) =>
                    onChange?.({ ...tl, additionalInfo })
                  }
                  placeholder="TL info"
                />
              </div>
            </div>
          }
        />
      </>
    );
  }

  return (
    <div className={cn("relative", classNames?.container)}>
      <div
        className={cn(
          "absolute right-2 bottom-11 dark:text-white",
          classNames?.tlNum,
        )}
      >
        {tl.id}
      </div>
      <SFX
        sfx={tl.sfx}
        key={`tl_${tl.id}:${tl.sfx.id}_${tl.forDeletion}`}
        editable={false}
        tlExtra={tl.additionalInfo ?? ""}
        classNames={{
          ...classNames,
          default: {
            ...classNames?.default,
            container: cn(
              classNames?.default?.container,
              tl.forDeletion && "border-(--sfx-tlfordeletion-border)",
            ),
            topinfo: {
              ...classNames?.default?.topinfo,
              text: tl.forDeletion && "text-(--sfx-tlfordeletion-text)",
            },
          },
        }}
      />
      {editable && (
        <div className={cn("flex flex-row gap-2")}>
          <button
            className={cn(
              "flex-1 cursor-pointer rounded bg-(--button-submit-bg) px-4 py-2 text-(--button-submit-text)",
              "transition-colors",
              "hover:bg-(--button-submit-hover-bg)",
              "focus:ring-2 focus:ring-(--input-focus-border) focus:ring-offset-2",
              "focus:ring-offset-(color:--main-bg) focus:outline-none",
              "disabled:bg-(--button-submit-disabled-bg) disabled:text-(--button-submit-disabled-text)",
            )}
            onClick={() => {
              if (!tl.forDeletion) setMode("edit");
            }}
            disabled={tl.forDeletion}
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
            )}
            onClick={async () => {
              await onSave?.(null);
            }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
};

const ConnectSFXDialog = ({
  onChange,
  sfx,
  illegibleSFX,
  ref,
}: {
  onChange?: (
    change: (prev: CollapsedTL[]) => CollapsedTL[],
  ) => Promisable<void>;
  ref?: RefObject<HTMLDialogElement | null>;
  illegibleSFX?: (() => number[]) | number[];
  sfx: CollapsedOnomatopoeia;
}) => {
  const sfxs = api.sfx.listSFX.useQuery("list");

  const illegible =
    typeof illegibleSFX === "function" ? illegibleSFX() : (illegibleSFX ?? []);

  const SFXDialogID = `connectSFXDialog_${sfx.id}`;

  return (
    <dialog
      popover={"auto"}
      id={SFXDialogID}
      ref={ref}
      className={cn(
        "m-auto min-w-[50%] rounded-xl border border-(color:--regular-border) bg-white/95 p-6",
        "shadow-lg backdrop-blur-sm",
        "dark:bg-slate-800/95 dark:text-white",
      )}
    >
      <button
        className={cn(
          "absolute top-4 right-4 z-10 rounded-full bg-gray-200 p-2",
          "text-(color:--accent-700) hover:bg-gray-300",
          "dark:bg-slate-700 dark:text-(color:--accent-100) dark:hover:bg-slate-600",
        )}
        type="button"
        popoverTarget={SFXDialogID}
        popoverTargetAction="hide"
        aria-label="Close"
      >
        ×
      </button>
      {sfxs.isFetching && (
        <div
          className={cn(
            "py-4 text-center text-(color:--accent-700) dark:text-(color:--accent-200)",
          )}
        >
          Loading...
        </div>
      )}
      {sfxs.isFetched && (
        <div>
          <div
            className={cn(
              "mb-4 text-lg font-semibold text-(color:--accent-900) dark:text-(color:--accent-100)",
            )}
          >
            Connect to another SFX:
          </div>
          <div className={cn("max-h-96 overflow-y-auto")}>
            <ul className={cn("flex flex-col gap-4")}>
              {sfxs.data
                ?.filter((s) => !illegible.includes(s.id))
                .map((connSFX) => {
                  return (
                    <li
                      key={connSFX.id}
                      className={cn(
                        "flex flex-row items-center gap-4 rounded-lg border border-(color:--regular-border)",
                        "bg-(color:--accent-50) p-3 shadow-sm dark:bg-slate-700",
                      )}
                    >
                      <div className={cn("flex-1")}>
                        <SFX sfx={connSFX} />
                      </div>
                      <button
                        className={cn(
                          "cursor-pointer rounded bg-(color:--accent-600) px-3 py-1 text-sm text-white",
                          "transition-colors hover:bg-(color:--accent-700)",
                          "focus:ring-2 focus:ring-(color:--accent-500) focus:outline-none",
                          "dark:bg-(color:--accent-700) dark:hover:bg-(color:--accent-600) dark:focus:ring-(color:--accent-400)",
                        )}
                        popoverTargetAction="hide"
                        popoverTarget={SFXDialogID}
                        onClick={async () => {
                          console.log("Adding translation!");
                          await onChange?.((prev) => [
                            ...prev,
                            {
                              id: Infinity,
                              sfx1Id: sfx.id,
                              sfx2Id: connSFX.id,
                              sfx: connSFX,
                              additionalInfo: "",
                            },
                          ]);
                        }}
                      >
                        Connect
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>
        </div>
      )}
    </dialog>
  );
};

export const TLEditorDirect = ({
  tls,

  sfx,
  removeOnCancel,

  noTLs,
  allowDeeperTLs,

  onChange,
}: {
  tls: CollapsedTL[];
  sfx?: CollapsedOnomatopoeia;
  removeOnCancel?: boolean;
  noTLs?: boolean;
  allowDeeperTLs?: boolean;
  onChange: (tls: CollapsedTL[]) => Promisable<void>;
}) => {
  const [newTL, setNewTL] = useState<CollapsedTL>({
    additionalInfo: "",
    sfx1Id: sfx?.id ?? Infinity,
    sfx2Id: Infinity,
    id: tls.length + 1,
    sfx: {
      def: "",
      extra: null,
      id: Infinity,
      language: "",
      read: null,
      text: "",
      tls: [],
    },
  });

  const connSFXDialog = useRef<HTMLDialogElement>(null);

  const [freshTLs, setFreshTLs] = useState<number[]>([]);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border-2",
        "border-(color:--regular-border) bg-(color:--accent-50) p-2 shadow-sm",
        "dark:bg-slate-800",
        "h-full max-h-[100dvh] min-h-0",
      )}
      style={{ height: "100%", minHeight: 0, maxHeight: "100dvh" }}
    >
      <div
        className={cn(
          "border-b border-(color:--regular-border)",
          "dark:text-(color:--accent-100)",
          "text-center text-xl font-bold",
          "text-(color:--accent-900)",
        )}
      >
        Translations
      </div>
      <div
        className={cn("flex min-h-0 flex-col", "overflow-y-auto")}
        style={{ minHeight: 0 }}
      >
        {tls.map((tl) => (
          <TL
            tl={tl}
            removeLangs={[sfx?.language ?? ""]}
            key={tl.id}
            noTLs={noTLs}
            allowDeeperTLs={allowDeeperTLs}
            removeOnCancel={freshTLs.includes(tl.id) ? true : removeOnCancel}
            onChange={async (tl) => {
              const newTLs = tls.map((t) => (t.id === tl.id ? tl : t));
              await onChange?.(newTLs);
            }}
            onSave={async (ntl) => {
              setFreshTLs((prev) => prev.filter((q) => q !== ntl?.sfx.id));
              if (!ntl) {
                if (removeOnCancel || freshTLs.includes(tl.id)) {
                  await onChange?.(tls.filter((t) => t.id !== tl.id));
                } else {
                  await onChange?.(
                    tls.map((t) =>
                      t.id === tl.id
                        ? {
                            ...t,
                            forDeletion: !t.forDeletion,
                          }
                        : t,
                    ),
                  );
                }
              }
            }}
          />
        ))}
      </div>
      <div className={cn("flex flex-row gap-2")}>
        <SFXLangSelect
          hideValues={[newTL.sfx.language]}
          removeValues={[...(sfx?.language ? [sfx.language] : [])]}
          value={newTL.sfx.language}
          onChange={(lang) =>
            setNewTL((p) => ({ ...p, sfx: { ...p.sfx, language: lang } }))
          }
        />
        <button
          className={cn(
            "inline-block flex-1 cursor-pointer rounded bg-(color:--accent-500) px-4 py-2",
            "text-white",
            "hover:bg-(color:--accent-600)",
            "dark:bg-(color:--accent-600)",
            "dark:hover:bg-(color:--accent-700)",
          )}
          onClick={async () => {
            const newTLs = [...tls, newTL];
            await onChange?.(newTLs);
            setFreshTLs((prev) => [...prev, newTL.id]);
            setNewTL((p) => ({
              ...p,
              id: p.id + 1,
            }));
          }}
        >
          Add Translation
        </button>
        {sfx && (
          <ConnectSFXDialog
            sfx={sfx}
            ref={connSFXDialog}
            illegibleSFX={[...tls.map((t) => t.sfx.id), sfx.id]}
            onChange={async (change) => {
              await onChange?.(change(tls));
            }}
          />
        )}
        <button
          className={cn(
            "inline-block flex-1 cursor-pointer rounded bg-(color:--accent-500) px-4 py-2",
            "text-white",
            "hover:bg-(color:--accent-600)",
            "dark:bg-(color:--accent-600)",
            "dark:hover:bg-(color:--accent-700)",
          )}
          onClick={() => {
            connSFXDialog.current?.showPopover();
          }}
        >
          Connect SFX
        </button>
      </div>
    </div>
  );
};

export const TLEditorSaveable = ({
  sfx,

  saveState,
  onSave,
}: {
  sfx: CollapsedOnomatopoeia;

  saveState?: SaveState;
  onSave?: (tls: CollapsedTL[]) => Promisable<void>;
}) => {
  const [newTL, setNewTL] = useState<CollapsedTL>({
    additionalInfo: "",
    sfx1Id: sfx.id,
    sfx2Id: Infinity,
    id: sfx.tls.length + 1,
    sfx: {
      def: "",
      extra: null,
      id: Infinity,
      language: "",
      read: null,
      text: "",
      tls: [],
    },
  });

  const [tls, setTLs] = useState([...sfx.tls]);

  return (
    <>
      {tls.map((tl) => (
        <TL tl={tl} key={tl.id} />
      ))}
      <div>
        <div className={cn("mt-2 flex flex-row gap-2")}>
          <SFXLangSelect
            hideValues={[newTL.sfx.language]}
            value={newTL.sfx.language}
            onChange={(lang) =>
              setNewTL((p) => ({ ...p, sfx: { ...p.sfx, language: lang } }))
            }
          />
          <button
            className={cn(
              "inline-block flex-1 rounded bg-(color:--accent-500) px-4 py-2 text-white",
              "hover:bg-(color:--accent-600)",
              "dark:bg-(color:--accent-600)",
              "dark:hover:bg-(color:--accent-700)",
            )}
            onClick={() => {
              setTLs((prev) => [...prev, newTL]);
              setNewTL((prev) => ({ ...prev, id: prev.id + 1 }));
            }}
          >
            Add Translation
          </button>
          <button
            onClick={async () => await onSave?.(tls)}
            className={cn(
              "inline-block flex-1 rounded bg-(color:--success-500) px-4 py-2 text-white",
              "hover:bg-(color:--success-600)",
              "dark:bg-(color:--success-600)",
              "dark:hover:bg-(color:--success-700)",
            )}
            disabled={saveState === "waiting"}
          >
            {saveState === "waiting"
              ? "Saving..."
              : saveState === "done"
                ? "Saved!"
                : "Save"}
          </button>
        </div>
      </div>
    </>
  );
};
