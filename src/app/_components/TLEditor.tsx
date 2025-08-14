import {
  cn,
  type CollapsedOnomatopoeia,
  type CollapsedTL,
  type Promisable,
} from "@/utils";
import { SFX, SFXEdit, type NoTLOnom, type SaveState } from "./sfx";
import { SFXLangSelect } from "./sfxLangSelect";
import React, { useState } from "react";
import { useSFXLangs } from "../hooks/langs";
import { Validation } from "../hooks/validation";

export const TL = ({
  tl,

  removeLangs,

  onChange,
  onSave,
}: {
  tl: CollapsedTL;

  removeLangs?: string[];

  onSave?: (tl: CollapsedTL | null) => Promisable<void>;
  onChange?: (tl: CollapsedTL) => Promisable<void>;
}) => {
  const { langs } = useSFXLangs();

  const [mode, setMode] = useState<"view" | "edit">(
    tl.tlSFX.id === Infinity ? "edit" : "view",
  );

  const [onceSaved, setOnceSaved] = useState(false);

  const [cancelData, setCancelData] = useState<NoTLOnom | null>(null);

  if (mode === "edit") {
    return (
      <>
        <SFXEdit
          removeLangs={removeLangs}
          labels={{
            main: `New ${langs.find((l) => l.code === tl.tlSFX.language)?.name ?? "unknown"} TL (${tl.id})`,
          }}
          onValidate={(sfx) => {
            return new Validation().validateSFXData(sfx);
          }}
          sfx={tl.tlSFX}
          onCancel={async () => {
            if (onceSaved && cancelData) {
              await onChange?.({ ...tl, tlSFX: cancelData });
              setMode("view");
            } else await onSave?.(null);
          }}
          onChange={async (action) => {
            await onChange?.({ ...tl, tlSFX: action(tl.tlSFX) });
          }}
          onSaveClicked={async () => {
            await onSave?.(tl);
            setOnceSaved(true);
            setCancelData(tl.tlSFX);
            setMode("view");
          }}
        />
      </>
    );
  }

  return (
    <div className="relative">
      <div className="absolute right-2 bottom-11 dark:text-yellow-300">
        {tl.id}
      </div>
      <SFX sfx={tl.tlSFX} editable={false} withTL={false} />
      <div className={cn("flex flex-row gap-2")}>
        <button
          className={cn(
            "inline-block flex-1 cursor-pointer rounded bg-blue-500 px-4 py-2 text-white",
            "hover:bg-blue-600",
            "dark:bg-blue-600 dark:hover:bg-blue-700",
          )}
          onClick={() => {
            setMode("edit");
          }}
        >
          Edit
        </button>
      </div>
    </div>
  );
};

export const TLEditorDirect = ({
  tls,

  sfx,

  onChange,
}: {
  tls: CollapsedTL[];
  sfx?: NoTLOnom;
  onChange: (tls: CollapsedTL[]) => Promisable<void>;
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

  console.log(tls);

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
          "border-b border-blue-200",
          "dark:border-blue-700 dark:text-blue-100",
          "text-center text-xl font-bold",
          "text-blue-900",
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
            "inline-block flex-1 cursor-pointer rounded bg-blue-500 px-4 py-2",
            "text-white",
            "hover:bg-blue-600",
            "dark:bg-blue-600",
            "dark:hover:bg-blue-700",
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

export const TLEditorSaveable = ({
  sfx,

  saveState,
  onChange: _onChange,
  onSave,
}: {
  sfx: CollapsedOnomatopoeia;

  saveState?: SaveState;
  onChange?: (tls: CollapsedTL[]) => Promisable<void>;
  onSave?: (tls: CollapsedTL[]) => Promisable<void>;
}) => {
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

  const [tls, setTLs] = useState([...sfx.tls]);

  return (
    <>
      {tls.map((tl) => (
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
              "inline-block flex-1 rounded bg-blue-500 px-4 py-2 text-white",
              "hover:bg-blue-600",
              "dark:bg-blue-600",
              "dark:hover:bg-blue-700",
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
              "inline-block flex-1 rounded bg-green-500 px-4 py-2 text-white",
              "hover:bg-green-600",
              "dark:bg-green-600",
              "dark:hover:bg-green-700",
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
