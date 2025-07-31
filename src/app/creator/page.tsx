"use client";

import { api } from "@/trpc/react";
import { useCallback, useState } from "react";
import { SFXCardEditable } from "../_components/editableSFX";
import { SFXTLEditor } from "../_components/sfxTLEdit.";
import { useDarkMode } from "../hooks/darkmode";
import DarkModeSwitch from "../_components/darkModeSwitch";
import { EditableSelect } from "../_components/editableSelect";
import { useSFXLangs } from "../hooks/langs";
import { useRouter } from "next/navigation";
import type { SFXData } from "@/utils";
import { cn } from "@/utils";

const SFXListPanel = () => {
  const sfx = api.sfx.listSFX.useQuery({});
  const utils = api.useUtils();

  return (
    <div>
      {sfx.data?.map((sfx) => (
        <SFXCardEditable
          key={sfx.id}
          sfx={sfx}
          onSave={async () => {
            await utils.sfx.listSFX.invalidate();
          }}
        />
      ))}
    </div>
  );
};

// SFX creator page
const CreatorPage = () => {
  const createSFX = api.sfx.createSFX.useMutation();

  const [sfx, setSFX] = useState<string>("");
  const [def, setDef] = useState<string>("");
  const [extra, setExtra] = useState<string>("");
  const [read, setRead] = useState<string>("");

  const [tls, setTLs] = useState<SFXData["tls"]>({});

  const router = useRouter();

  const [lang, setLang] = useState<string>("");

  const { langs } = useSFXLangs();

  const { mode } = useDarkMode();

  const updateSFX = useCallback((sfx: SFXData) => {
    setSFX(sfx.text);
    setDef(sfx.def);
    setExtra(sfx.extra ?? "");
    setRead(sfx.read);
    setTLs(sfx.tls ?? {});
  }, []);

  return (
    <div
      className={cn(
        "flex h-[100vh] w-full basis-1/2 flex-row gap-8 bg-blue-50 p-4 dark:bg-slate-900",
        mode,
      )}
    >
      {/* Main creator form */}
      <div className={cn("flex flex-1 flex-col gap-4")}>
        <h1
          className={cn("text-4xl font-bold text-blue-900 dark:text-blue-100")}
        >
          <div className={cn("flex w-full items-center justify-between")}>
            <button
              className={cn(
                "mr-4 cursor-pointer rounded bg-blue-100 px-3 py-1 text-blue-700 transition hover:bg-blue-200 dark:bg-slate-700 dark:text-blue-200 dark:hover:bg-slate-600",
              )}
              title="Back"
              onClick={() => {
                router.back();
              }}
            >
              &lt;
            </button>
            <span
              className={cn(
                "flex-1 text-center text-4xl font-bold text-blue-900 dark:text-blue-100",
              )}
            >
              Creator
            </span>
            <div className={cn("ml-auto")}>
              <DarkModeSwitch />
            </div>
          </div>
        </h1>
        <div
          className={cn(
            "flex flex-col gap-2 rounded-xl border-2 border-blue-300 bg-blue-50 p-2 shadow-sm dark:border-blue-600 dark:bg-slate-800",
          )}
        >
          <h2
            className={cn(
              "flex items-center justify-center border-b border-blue-200 pb-2 text-center text-2xl font-semibold text-blue-800 dark:border-blue-700 dark:text-blue-200",
            )}
          >
            New SFX
            <EditableSelect
              classNames={{
                main: "ml-2 text-sm",
              }}
              values={langs.map(({ code, name }) => ({
                label: name,
                value: code,
              }))}
              value={lang}
              onChange={(e) => {
                if (typeof e === "string") setLang(e);
                else setLang(e.target.value);
              }}
            />
          </h2>
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
              value={sfx}
              onChange={(e) => setSFX(e.target.value)}
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
            <label
              htmlFor="read"
              className={cn(
                "flex-1 font-medium whitespace-nowrap text-blue-700 dark:text-blue-300",
              )}
            >
              Reading
            </label>
            <input
              className={cn(
                "ml-auto flex-3 rounded border border-blue-300 bg-white px-2 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-blue-600 dark:bg-slate-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-400",
              )}
              placeholder="Reading"
              type="text"
              value={read}
              onChange={(e) => setRead(e.target.value)}
            />
          </div>
        </div>
        <SFXTLEditor
          sfx={{ text: sfx, def, extra, read, tls }}
          updateSFX={(sfx_) => {
            if (typeof sfx_ === "function") {
              const updated = sfx_({
                text: sfx,
                def,
                extra,
                read,
                tls,
              });
              updateSFX(updated);
            } else {
              updateSFX(sfx_);
            }
          }}
        />
        <button
          className={cn(
            "rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-blue-400 dark:focus:ring-offset-slate-800",
          )}
          onClick={() =>
            createSFX.mutate({
              text: sfx,
              def,
              extra: extra ?? null,
              read,
              tls: tls ?? {},
            })
          }
        >
          Create
        </button>
      </div>
      {/* Side panel with SFX list */}
      <div
        className={cn(
          "flex min-w-[20rem] flex-1 flex-col gap-4 border-l border-blue-200 bg-blue-100 px-2 dark:border-blue-700 dark:bg-slate-800",
        )}
      >
        <h2
          className={cn(
            "mb-2 text-xl font-semibold text-blue-800 dark:text-blue-200",
          )}
        >
          Past Created SFX
        </h2>
        <SFXListPanel />
      </div>
    </div>
  );
};

export default CreatorPage;
