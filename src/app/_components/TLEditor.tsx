import { cn, type CollapsedOnomatopoeia, type CollapsedTL } from "@/utils";
import { SFX, SFXEdit, type NoTLOnom, type SaveState } from "./sfx";
import { SFXLangSelect } from "./sfxLangSelect";
import React, { useState } from "react";
import { useSFXLangs } from "../hooks/langs";

export const TL = ({
  tl,

  removeLangs,

  onChange,
  onSave,
}: {
  tl: CollapsedTL;

  removeLangs?: string[];

  onSave?: (tl: CollapsedTL | null) => void | Promise<void>;
  onChange?: (tl: CollapsedTL) => void | Promise<void>;
}) => {
  const { langs } = useSFXLangs();

  const [mode, setMode] = useState<"view" | "edit">(
    tl.tlSFX.id === Infinity ? "edit" : "view",
  );

  if (mode === "edit") {
    return (
      <>
        <SFXEdit
          removeLangs={removeLangs}
          labels={{
            main: `New ${langs.find((l) => l.code === tl.tlSFX.language)?.name ?? "unknown"} TL`,
          }}
          sfx={tl.tlSFX}
          onCancel={() => onSave?.(null)}
          onChange={async (action) => {
            await onChange?.({ ...tl, tlSFX: action(tl.tlSFX) });
          }}
          onSaveClicked={async () => {
            await onSave?.(tl);
            setMode("view");
          }}
        />
      </>
    );
  }

  return (
    <>
      <SFX sfx={tl.tlSFX} editable={false} withTL={false} />
      <div className={cn("flex flex-row gap-2")}>
        <button
          className={cn(
            "inline-block flex-1 rounded bg-blue-500 px-4 py-2",
            "text-white hover:bg-blue-600",
            "dark:bg-blue-600 dark:hover:bg-blue-700",
          )}
          onClick={() => {
            setMode("edit");
          }}
        >
          Edit
        </button>
      </div>
    </>
  );
};

export const TLCreator = ({
  tls,

  sfx,

  onChange,
}: {
  tls: CollapsedTL[];
  sfx?: NoTLOnom;
  onChange: (tls: CollapsedTL[]) => void | Promise<void>;
}) => {
  const [newTL, setNewTL] = useState<CollapsedTL>({
    additionalInfo: "",
    sfx1Id: Infinity,
    sfx2Id: Infinity,
    id: tls.length + 1,
    tlSFX: {
      def: "",
      extra: null,
      id: Infinity,
      language: "",
      prime: false,
      read: null,
      text: "",
    },
  });

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border-2",
        "border-blue-300 bg-blue-50 p-2 shadow-sm",
        "dark:border-blue-600 dark:bg-slate-800",
        "h-full max-h-[100dvh] min-h-0",
      )}
      style={{ height: "100%", minHeight: 0, maxHeight: "100dvh" }}
    >
      <div
        className={cn(
          "border-b border-blue-200 dark:border-blue-700",
          "text-bold text-center text-xl text-blue-900 dark:text-blue-100",
        )}
      >
        Translations
      </div>
      <div
        className={cn("flex min-h-0 flex-col gap-2", "overflow-y-auto")}
        style={{ minHeight: 0 }}
      >
        {tls.map((tl) => (
          <TL
            tl={tl}
            removeLangs={[sfx?.language ?? ""]}
            key={tl.id}
            onChange={async (tl) => {
              const newTLs = tls.map((t) => (t.id === tl.id ? tl : t));
              await onChange?.(newTLs);
            }}
            onSave={async (ntl) => {
              if (!ntl) {
                await onChange?.(tls.filter((t) => t.id !== tl.id));
              }
            }}
          />
        ))}
      </div>
      <div className={cn("flex flex-row gap-2")}>
        <SFXLangSelect
          hideValues={[newTL.tlSFX.language]}
          removeValues={[...(sfx?.language ? [sfx.language] : [])]}
          value={newTL.tlSFX.language}
          onChange={(lang) =>
            setNewTL((p) => ({ ...p, tlSFX: { ...p.tlSFX, language: lang } }))
          }
        />
        <button
          className={cn(
            "inline-block flex-1 rounded bg-blue-500 px-4 py-2",
            "text-white hover:bg-blue-600",
            "dark:bg-blue-600 dark:hover:bg-blue-700",
          )}
          onClick={async () => {
            const newTLs = [...tls, newTL];
            await onChange?.(newTLs);
            setNewTL((p) => ({
              ...p,
              id: p.id + 1,
            }));
          }}
        >
          Add Translation
        </button>
      </div>
    </div>
  );
};

export const TLEditorv2 = ({
  sfx,

  saveState: _saveState,
  onChange: _onChange,
}: {
  sfx: CollapsedOnomatopoeia;

  saveState?: SaveState;
  onChange?: (tls: CollapsedTL[]) => void | Promise<void>;
}) => {
  console.log("SFX", sfx);

  const [newTL, setNewTL] = useState<CollapsedTL>({
    additionalInfo: "",
    sfx1Id: sfx.id,
    sfx2Id: Infinity,
    id: sfx.tls.length + 1,
    tlSFX: {
      def: "",
      extra: null,
      id: Infinity,
      language: "",
      prime: false,
      read: null,
      text: "",
    },
  });

  return (
    <>
      {sfx.tls.map((tl) => (
        <TL tl={tl} key={tl.id} />
      ))}
      <div>
        <div className={cn("mt-2 flex flex-row gap-2")}>
          <SFXLangSelect
            hideValues={[newTL.tlSFX.language]}
            value={newTL.tlSFX.language}
            onChange={(lang) =>
              setNewTL((p) => ({ ...p, tlSFX: { ...p.tlSFX, language: lang } }))
            }
          />
          <button
            className={cn(
              "inline-block flex-1 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700",
            )}
            onClick={() => {
              //
            }}
          >
            Add Translation
          </button>
        </div>
      </div>
    </>
  );
};
