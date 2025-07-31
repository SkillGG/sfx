import { useState } from "react";
import type { SFXData } from "@/utils";
import { cn } from "@/utils";
import { SFXCardEditable } from "./editableSFX";
import { useSFXLangs } from "@/app/hooks/langs";
import { SFXLangSelect } from "./sfxLangSelect";

export const SFXTLEditor = ({
  sfx,
  updateSFX,
}: {
  sfx: SFXData;
  updateSFX: (sfx: SFXData | ((sfx: SFXData) => SFXData)) => void;
}) => {
  const { langs } = useSFXLangs();

  const [addCurLang, setAddCurLang] = useState<string>("");

  return (
    <div
      className={cn(
        "rounded-xl border-2 border-blue-300 bg-blue-50 p-2 dark:border-blue-600 dark:bg-slate-800",
      )}
    >
      <h1
        className={cn(
          "border-b border-blue-200 text-center text-2xl font-semibold text-blue-800 dark:border-blue-700 dark:text-blue-200",
        )}
      >
        TLs
      </h1>
      <div className={cn("mx-auto flex w-fit flex-col items-center")}>
        {Object.entries(sfx.tls ?? {}).map(([code, tl]) => (
          <div key={code} className={cn("flex flex-col gap-2")}>
            <h2
              className={cn(
                "flex flex-row items-center gap-2 text-xl font-semibold text-blue-800 dark:text-blue-200",
              )}
            >
              {langs.find((l) => l.code === code)?.name ?? code}
              <button
                className={cn(
                  "ml-auto cursor-pointer rounded bg-red-500 px-1 py-0.5 text-[10px] text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700",
                )}
                onClick={() => {
                  updateSFX((prev) => {
                    const newTLs = {
                      ...prev.tls,
                    };
                    delete newTLs[code];
                    return {
                      ...prev,
                      tls: newTLs,
                    };
                  });
                }}
                title="Remove"
              >
                ×
              </button>
            </h2>
            <div className={cn("flex flex-col gap-2")}>
              <SFXCardEditable
                sfx={tl ?? { def: "", extra: "", read: "", text: "" }}
                onSave={(updated) => {
                  updateSFX((prev) => ({
                    ...prev,
                    tls: {
                      ...prev.tls,
                      [code]: updated,
                    },
                  }));
                }}
                disableTLEdition
              />
            </div>
          </div>
        ))}
      </div>
      <div>
        <div className={cn("mt-2 flex flex-row gap-2")}>
          <SFXLangSelect
            hideValues={Object.keys(sfx.tls ?? {})}
            value={addCurLang}
            onChange={setAddCurLang}
          />
          <button
            className={cn(
              "inline-block flex-1 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700",
            )}
            onClick={() => {
              if (!addCurLang) throw new Error("No curlang selected!");
              updateSFX((prev) => ({
                ...prev,
                tls: {
                  ...prev.tls,
                  [addCurLang]: { def: "", extra: "", read: "", text: "" },
                },
              }));
            }}
          >
            Add Translation
          </button>
        </div>
      </div>
    </div>
  );
};
