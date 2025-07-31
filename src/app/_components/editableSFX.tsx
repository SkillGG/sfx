"use client";

import { makeDialogBackdropExitable, type SFXData, cn } from "@/utils";
import { useRef, useState } from "react";
import { SFXCard } from "./sfx";

type SFXCardEditableProps = {
  sfx: SFXData;
  onSave?: (updated: SFXData) => void;
  disableTLEdition?: boolean;
};

export function SFXCardEditable({
  sfx,
  onSave,
  disableTLEdition,
}: SFXCardEditableProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(sfx.text);
  const [read, setRead] = useState(sfx.read);
  const [def, setDef] = useState(sfx.def);
  const [extra, setExtra] = useState(sfx.extra ?? "");

  const tlEditDialogRef = useRef<HTMLDialogElement>(null);

  if (!editing) {
    if (!text)
      return (
        <div
          className={cn(
            "flex w-fit flex-row items-center gap-3 rounded-lg border border-dashed border-blue-300 bg-blue-50 px-4 py-3 shadow-sm dark:border-blue-600 dark:bg-slate-800",
          )}
        >
          <span
            className={cn(
              "flex items-center gap-2 text-base font-medium text-blue-700 dark:text-blue-300",
            )}
          >
            No SFX yet
          </span>
          <button
            className={cn(
              "ml-2 rounded-md bg-gradient-to-r from-blue-500 to-blue-400 px-4 py-1.5 text-sm font-semibold text-white shadow transition hover:from-blue-600 hover:to-blue-500 dark:from-blue-600 dark:to-blue-500 dark:hover:from-blue-700 dark:hover:to-blue-600",
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
        </div>
      );

    return <SFXCard sfx={sfx} />;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-dashed border-blue-300 bg-blue-50 px-4 py-3 shadow-sm dark:border-blue-600 dark:bg-slate-800",
      )}
    >
      <div
        className={cn(
          "flex w-full flex-col gap-2 text-base font-medium text-blue-700 dark:text-blue-300",
        )}
      >
        <div className={cn("flex flex-row items-center gap-2")}>
          <label
            className={cn(
              "w-20 text-right text-sm text-blue-700 dark:text-blue-300",
            )}
          >
            SFX
          </label>
          <input
            className={cn(
              "flex-1 rounded border bg-white px-1 py-0.5 text-lg font-bold text-blue-900 placeholder:text-blue-400 dark:border-blue-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-blue-500",
            )}
            value={text}
            placeholder="SFX"
            onChange={(e) => setText(e.target.value)}
            style={{ minWidth: "4rem" }}
          />
        </div>
        <div className={cn("flex flex-row items-center gap-2")}>
          <label
            className={cn(
              "w-20 text-right text-sm text-blue-700 dark:text-blue-300",
            )}
          >
            Reading
          </label>
          <input
            placeholder="Reading"
            className={cn(
              "flex-1 rounded border bg-white px-1 py-0.5 text-sm text-blue-700 placeholder:text-blue-400 dark:border-blue-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-blue-500",
            )}
            value={read}
            onChange={(e) => setRead(e.target.value)}
            style={{ minWidth: "4rem" }}
          />
        </div>
        <div className={cn("flex flex-row items-center gap-2")}>
          <label
            className={cn(
              "w-20 text-right text-sm text-blue-700 dark:text-blue-300",
            )}
          >
            Definition
          </label>
          <input
            placeholder="Definition"
            className={cn(
              "flex-1 rounded border bg-white px-1 py-0.5 text-sm text-blue-700 placeholder:text-blue-400 dark:border-blue-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-blue-500",
            )}
            value={def}
            onChange={(e) => setDef(e.target.value)}
            style={{ minWidth: "6rem" }}
          />
        </div>
        <div className={cn("flex flex-row items-center gap-2")}>
          <label
            className={cn(
              "w-20 text-right text-sm text-blue-700 dark:text-blue-300",
            )}
          >
            Extra
          </label>
          <input
            placeholder="Extra"
            className={cn(
              "flex-1 rounded border bg-white px-1 py-0.5 text-sm text-blue-700 placeholder:text-blue-400 dark:border-blue-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-blue-500",
            )}
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            style={{ minWidth: "6rem" }}
          />
        </div>
      </div>
      <div className={cn("mt-2 flex flex-row gap-2")}>
        <button
          className={cn(
            "rounded-md bg-gradient-to-r from-blue-500 to-blue-400 px-4 py-1.5 text-sm font-semibold text-white shadow transition hover:from-blue-600 hover:to-blue-500 dark:from-blue-600 dark:to-blue-500 dark:hover:from-blue-700 dark:hover:to-blue-600",
          )}
          onClick={() => {
            setEditing(false);
            if (onSave) {
              onSave({
                text,
                read,
                def,
                extra,
              });
            }
          }}
          type="button"
        >
          Save
        </button>
        {!disableTLEdition && (
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
            <dialog
              className={cn(
                "m-auto rounded-lg p-4 dark:bg-slate-800 dark:text-white",
              )}
              ref={tlEditDialogRef}
              onClose={() => {
                tlEditDialogRef.current?.close();
              }}
            >
              <div>
                <h2>Edit translations</h2>
                <div>
                  <div>
                    <div>
                      <div></div>
                      <div></div>
                    </div>
                  </div>
                </div>
              </div>
            </dialog>
            Edit translations
          </button>
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
