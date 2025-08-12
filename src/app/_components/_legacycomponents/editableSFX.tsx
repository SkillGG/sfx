"use client";

import {
  makeDialogBackdropExitable,
  cn,
  type CollapsedOnomatopoeia,
  type CollapsedTL,
} from "@/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { SFXCard } from "./sfx";
import { api } from "@/trpc/react";
import { SFXLangSelect } from "../sfxLangSelect";
import { SFXTLEditor } from "./sfxTLEdit.";

type NoTLOnom = Omit<CollapsedOnomatopoeia, "tls">;

export function SFXCardEditable<
  DT extends boolean,
  Q extends DT extends false ? CollapsedOnomatopoeia : NoTLOnom,
  NotQ extends DT extends true ? CollapsedOnomatopoeia : NoTLOnom,
>({
  sfx,
  onSave,
  disableTLEdition,
  classNames,
  labels,
  allowLocal,
  noLang,
  onRemove,
}: {
  sfx: Q | null;
  onSave?: (updated: Q | NotQ) => Promise<void>;
  disableTLEdition?: DT;
  labels?: {
    main?: React.ReactNode;
    empty?: React.ReactNode;
  };
  classNames?: {
    main?: string;
  };
  allowLocal?: boolean;
  onRemove?: () => Promise<void> | void;
  noLang?: boolean;
}) {
  const [jSFX, setjsfx] = useState<Q | null>(sfx);

  const emptySFX = useMemo(
    () =>
      ({
        def: "",
        extra: "",
        id: -1,
        language: "en",
        prime: false,
        read: "",
        text: "",
      }) as Q,
    [],
  );

  const nSFX = jSFX ?? emptySFX;

  const assocSFX = api.sfx.getSFX.useQuery(
    { id: nSFX.id ?? 0 },
    { enabled: typeof nSFX.id === "number" },
  );

  const sfxData: Q | undefined = useMemo(() => {
    console.log("Changed SFX");
    if (assocSFX.isLoading) return { ...nSFX, id: -1, temp: true } as Q;

    if (assocSFX.data && "err" in assocSFX.data)
      return { ...nSFX, id: -1, temp: true } as Q;

    return typeof nSFX.id === "number"
      ? (assocSFX.data as Q)
      : allowLocal
        ? { ...nSFX, id: -1 }
        : nSFX;
  }, [assocSFX, nSFX, allowLocal]);

  const collOnom: CollapsedOnomatopoeia = useMemo(() => {
    return (
      sfxData &&
      ("tls" in sfxData
        ? (sfxData as Q & { tls: CollapsedTL[] })
        : { ...sfxData, tls: [] })
    );
  }, [sfxData]);

  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(sfxData?.text ?? "");
  const [read, setRead] = useState(sfxData?.read ?? "");
  const [def, setDef] = useState(sfxData?.def ?? "");
  const [extra, setExtra] = useState(sfxData?.extra ?? "");
  const [language, setLanguage] = useState(sfxData?.language ?? "en");
  const [readingEnabled, setReadingEnabled] = useState<boolean>(
    !!sfxData?.read,
  );

  const [removeSure, setRemoveSure] = useState(false);

  const tlEditDialogRef = useRef<HTMLDialogElement>(null);
  const pickSFXDialogRef = useRef<HTMLDialogElement>(null);

  const [saving, setSaving] = useState(false);

  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    setText(sfxData?.text || text);
    setRead(!sfxData?.read ? read : "");
    setDef(sfxData?.def || def);
    setExtra(!sfxData?.extra ? extra : "");
    setReadingEnabled(readingEnabled || !!sfxData?.read);
  }, [def, extra, read, readingEnabled, sfxData, text]);

  if (assocSFX.isFetched && !collOnom?.id)
    return <div>Something went wrong fetching SFX from DB</div>;

  if (!editing) {
    console.log("not edit");
    if (!collOnom || !text) {
      console.log("no collOnom / empty text");
      return (
        <div
          className={cn(
            "mx-auto mt-2 flex w-fit flex-row items-center gap-3 rounded-lg border border-dashed",
            "border-blue-300 bg-blue-50 px-4 py-3 shadow-sm dark:border-blue-600 dark:bg-slate-800",
            classNames?.main,
          )}
        >
          <span
            className={cn(
              "flex items-center gap-2 text-base font-medium text-blue-700 dark:text-blue-300",
            )}
          >
            {labels?.empty ?? "No SFX yet"}
          </span>
          <button
            className={cn(
              "ml-2 rounded-md bg-gradient-to-r from-blue-500 to-blue-400 px-4 py-1.5",
              "text-sm font-semibold text-white shadow transition hover:from-blue-600",
              "hover:to-blue-500 dark:from-blue-600 dark:to-blue-500 dark:hover:from-blue-700",
              "dark:hover:to-blue-600",
            )}
            onClick={() => setEditing(true)}
          >
            <span className={cn("flex items-center gap-1")}>
              <svg
                className={cn("h-4 w-4")}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 4v16m8-8H4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              New SFX
            </span>
          </button>
          <dialog
            className={cn(
              "m-auto rounded-xl border border-blue-200 bg-white/95 p-6 shadow-lg",
              "backdrop-blur-sm dark:border-blue-700 dark:bg-slate-800/95 dark:text-white",
            )}
            ref={pickSFXDialogRef}
            onClose={() => {
              pickSFXDialogRef.current?.close();
            }}
          >
            <div className="rounded-lg bg-transparent p-6 dark:bg-slate-800">
              <h2 className="mb-4 text-xl font-semibold text-blue-800 dark:text-blue-200">
                Pick SFX
              </h2>
            </div>
          </dialog>
          <button
            className={cn(
              "ml-2 flex items-center gap-1 rounded-md bg-gradient-to-r from-blue-500",
              "to-blue-400 px-4 py-1.5 text-sm font-semibold text-white shadow transition",
              "hover:from-blue-600 hover:to-blue-500 dark:from-blue-600 dark:to-blue-500",
              "dark:hover:from-blue-700 dark:hover:to-blue-600",
            )}
            onClick={() => {
              if (pickSFXDialogRef.current) {
                makeDialogBackdropExitable(pickSFXDialogRef.current);
                pickSFXDialogRef.current.showModal();
              }
            }}
          >
            <svg
              className={cn("h-4 w-4")}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Pick SFX
          </button>
          <button
            className={cn(
              "ml-2 flex items-center gap-1 rounded-md bg-gradient-to-r from-red-500",
              "to-blue-400 px-4 py-1.5 text-sm font-semibold text-white shadow transition",
              "hover:from-red-600 hover:to-red-500 dark:from-red-600 dark:to-red-500",
              "dark:hover:from-red-700 dark:hover:to-red-600",
            )}
            onClick={async () => {
              if (!removeSure) {
                setRemoveSure(true);
                return;
              }
              const id = sfxData?.id ?? (allowLocal ? -1 : null);
              if (id === null) return;
              setRemoving(true);
              await onRemove?.();
              setRemoving(false);
              setRemoveSure(false);
            }}
          >
            {removeSure ? (
              "Are you sure?"
            ) : removing ? (
              "Removing..."
            ) : (
              <>
                <svg
                  className={cn("h-4 w-4")}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Remove
              </>
            )}
          </button>
        </div>
      );
    }

    console.log("collOnom", collOnom);

    return (
      <div className={cn("mb-2 flex flex-col gap-2")}>
        <SFXCard sfx={collOnom} disableTLs />
        <div className={cn("mx-auto flex w-full max-w-[50%] gap-2")}>
          <button
            className={cn(
              "flex-1 cursor-pointer rounded bg-blue-600 px-4 py-2 text-white transition-colors",
              "hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              "focus:outline-none dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-blue-400",
              "disabled:bg-slate-200 disabled:text-black dark:focus:ring-offset-slate-800 dark:disabled:bg-slate-700 dark:disabled:text-white",
            )}
            onClick={() => setEditing(true)}
            type="button"
            disabled={!allowLocal && "temp" in collOnom}
          >
            Edit
          </button>

          <button
            className={cn(
              "flex-1 cursor-pointer rounded bg-red-600 px-4 py-2 text-white transition-colors",
              "hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none",
              "dark:bg-red-700 dark:hover:bg-red-600 dark:focus:ring-red-400",
              "disabled:bg-slate-200 disabled:text-black dark:focus:ring-offset-slate-800 dark:disabled:bg-slate-700 dark:disabled:text-white",
            )}
            onClick={async () => {
              if (!removeSure) {
                setRemoveSure(true);
                return;
              }
              const id = sfxData?.id ?? (allowLocal ? -1 : null);
              if (id === null) return;
              setRemoving(true);
              await onRemove?.();
              setRemoving(false);
              setRemoveSure(false);
            }}
            onBlur={() => {
              setRemoveSure(false);
            }}
            disabled={!allowLocal && "temp" in collOnom}
          >
            {removing ? "Removing..." : removeSure ? "Are you sure?" : "Remove"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border-2 border-blue-300 bg-blue-50 p-2 shadow-sm dark:border-blue-600 dark:bg-slate-800",
        classNames?.main,
      )}
    >
      <h2
        className={cn(
          "flex items-center justify-center border-b border-blue-200 pb-2 text-center text-2xl font-semibold text-blue-800 dark:border-blue-700 dark:text-blue-200",
        )}
      >
        {labels?.main ?? "Edit SFX"}{" "}
        {!noLang && (
          <SFXLangSelect
            classNames={{
              main: "ml-2 text-sm",
            }}
            hideValues={[language]}
            value={language}
            onChange={(e) => setLanguage(e)}
          />
        )}
      </h2>
      <div
        className={cn(
          "flex w-full flex-col gap-2 text-base font-medium text-blue-700 dark:text-blue-300",
        )}
      >
        <div className={cn("flex flex-row items-center gap-2")}>
          <label
            htmlFor="sfx"
            className={cn(
              "flex-1 font-medium whitespace-nowrap text-blue-700 dark:text-blue-300",
            )}
          >
            SFX
          </label>
          <input
            className={cn(
              "ml-auto flex-3 rounded border border-blue-300 bg-white px-2 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-blue-600 dark:bg-slate-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-400",
            )}
            placeholder="SFX"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <div className={cn("flex flex-row items-center gap-2")}>
          <label
            htmlFor="def"
            className={cn(
              "flex-1 font-medium whitespace-nowrap text-blue-700 dark:text-blue-300",
            )}
          >
            Definition
          </label>
          <input
            className={cn(
              "ml-auto flex-3 rounded border border-blue-300 bg-white px-2 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-blue-600 dark:bg-slate-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-400",
            )}
            placeholder="Definition"
            type="text"
            value={def}
            onChange={(e) => setDef(e.target.value)}
          />
        </div>
        <div className={cn("flex flex-row items-center gap-2")}>
          <label
            htmlFor="extra"
            className={cn(
              "flex-1 font-medium whitespace-nowrap text-blue-700 dark:text-blue-300",
            )}
          >
            Extra
          </label>
          <input
            className={cn(
              "ml-auto flex-3 rounded border border-blue-300 bg-white px-2 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-blue-600 dark:bg-slate-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-400",
            )}
            placeholder="Extra"
            type="text"
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
          />
        </div>
        <div className={cn("flex flex-row items-center gap-2")}>
          <div className={cn("flex flex-1 items-center gap-2")}>
            <label
              htmlFor="read"
              className={cn(
                "font-medium whitespace-nowrap text-blue-700 dark:text-blue-300",
              )}
            >
              Reading
            </label>
            <label
              className={cn(
                "flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400",
              )}
            >
              <input
                type="checkbox"
                checked={readingEnabled}
                onChange={(e) => setReadingEnabled(e.target.checked)}
                className={cn(
                  "h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500 dark:border-blue-600 dark:bg-slate-700 dark:focus:ring-blue-400",
                )}
              />
              <span>Enable</span>
            </label>
          </div>
          <input
            className={cn(
              "ml-auto flex-3 rounded border border-blue-300 bg-white px-2 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-blue-600 dark:bg-slate-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-400",
              !readingEnabled && "cursor-not-allowed opacity-50",
            )}
            placeholder="Reading"
            type="text"
            value={read ?? ""}
            onChange={(e) => setRead(e.target.value)}
            disabled={!readingEnabled}
          />
        </div>
      </div>
      <div className={cn("mt-2 flex flex-row gap-2")}>
        <button
          className={cn(
            "rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-blue-400 dark:focus:ring-offset-slate-800",
          )}
          onClick={async () => {
            setSaving(true);
            const newSFX = {
              ...nSFX,
              text,
              read: readingEnabled ? read : null,
              def,
              extra,
              language,
              prime: nSFX.prime,
            } as Q;
            await onSave?.(newSFX);
            setjsfx(newSFX);
            setEditing(false);
            setSaving(false);
          }}
          type="button"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {!disableTLEdition && sfxData && (
          <>
            <dialog
              className={cn(
                "m-auto rounded-xl border border-blue-200 bg-white/95 p-6 shadow-lg backdrop-blur-sm dark:border-blue-700 dark:bg-slate-800/95 dark:text-white",
              )}
              ref={tlEditDialogRef}
              onClose={() => {
                tlEditDialogRef.current?.close();
              }}
            >
              <SFXTLEditor
                sfx={collOnom}
                updateSFX={async () => {
                  if (!sfxData?.id) throw new Error("No sfxData id!");
                  setSaving(true);
                  const newSFX = {
                    ...sfxData,
                    text,
                    read: readingEnabled ? read : null,
                    def,
                    extra,
                    language,
                    prime: nSFX.prime,
                  };
                  await onSave?.(newSFX);
                  setjsfx(newSFX);
                  tlEditDialogRef.current?.close();
                  setSaving(false);
                }}
              />
            </dialog>
            <button
              className={cn(
                "rounded bg-gray-200 px-2 py-1 text-xs hover:bg-gray-300 dark:bg-slate-600 dark:text-white dark:hover:bg-slate-500",
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
            "rounded bg-gray-200 px-2 py-1 text-xs hover:bg-gray-300 dark:bg-slate-600 dark:text-white dark:hover:bg-slate-500",
          )}
          onClick={() => setEditing(false)}
          type="button"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
