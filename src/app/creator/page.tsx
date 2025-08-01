"use client";

import { api } from "@/trpc/react";
import { useCallback, useState } from "react";
import { SFXCardEditable } from "../_components/editableSFX";
import { SFXTLEditor } from "../_components/sfxTLEdit.";
import { useDarkMode } from "../hooks/darkmode";
import DarkModeSwitch from "../_components/darkModeSwitch";
import { SFXLangSelect } from "../_components/sfxLangSelect";
import { useRouter } from "next/navigation";
import type { SFXData } from "@/utils";
import { cn } from "@/utils";
import { useValidation } from "../hooks/validation";
import { ValidationErrorDisplay } from "../_components/validationError";

const SFXListPanel = () => {
  const sfx = api.sfx.listSFX.useQuery();
  const utils = api.useUtils();

  const updateSFX = api.sfx.updateSFX.useMutation();

  if (sfx.isLoading) {
    return <div>Loading SFX List</div>;
  }

  return (
    <div>
      {sfx.data?.map((sfx) => (
        <SFXCardEditable
          key={sfx.id}
          sfx={sfx}
          disableTLEdition
          onSave={async (newSFX) => {
            await updateSFX.mutateAsync({
              id: sfx.id,
              text: newSFX.text,
              def: newSFX.def,
              extra: newSFX.extra,
              read: newSFX.read,
              language: newSFX.language,
            });
            await utils.sfx.listSFX.invalidate();
            await utils.sfx.getSFX.invalidate();
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
  const [readingEnabled, setReadingEnabled] = useState<boolean>(true);

  const [tls, setTLs] = useState<SFXData["tls"]>({});

  const router = useRouter();

  const [lang, setLang] = useState<string>("");

  const { mode } = useDarkMode();

  // Initialize validation hook
  const validation = useValidation();

  const updateSFX = useCallback((sfx: SFXData) => {
    setSFX(sfx.text);
    setDef(sfx.def);
    setExtra(sfx.extra ?? "");
    setRead(sfx.read ?? "");
    setTLs(sfx.tls ?? {});
    setLang(sfx.language);
  }, []);

  // Validate form data before submission
  const handleCreate = () => {
    const sfxData = {
      text: sfx,
      def,
      extra: extra ?? null,
      read: readingEnabled ? (read ?? null) : null,
      language: lang ?? "en",
      tls: tls ?? {},
    };

    const validationResult = validation.validateSFXData(sfxData);

    if (validationResult.isValid) {
      createSFX.mutate({
        text: sfx,
        def,
        extra: extra ?? null,
        read: readingEnabled ? read : null,
        language: lang ?? "en",
        tls: tls ?? {},
      });
    }
  };

  // Simple change handlers
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSFX(e.target.value);
  };

  const handleDefChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDef(e.target.value);
  };

  const handleExtraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExtra(e.target.value);
  };

  const handleReadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRead(e.target.value);
  };

  const handleLanguageChange = (lang: string) => {
    setLang(lang);
  };

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
            <SFXLangSelect
              classNames={{
                main: "ml-2 text-sm",
              }}
              hideValues={[lang]}
              value={lang}
              onChange={handleLanguageChange}
            />
          </h2>

          <div className={cn("flex flex-row items-start gap-2")}>
            <label
              htmlFor="sfx"
              className={cn(
                "mt-1 flex-1 font-medium whitespace-nowrap text-blue-700 dark:text-blue-300",
                validation.hasFieldError("text") &&
                  "text-red-600 dark:text-red-400",
              )}
            >
              SFX
            </label>
            <div className={cn("ml-auto flex flex-3 flex-col gap-2")}>
              <input
                className={cn(
                  "rounded border bg-white px-2 py-1 focus:ring-1 focus:outline-none dark:bg-slate-700 dark:text-white dark:placeholder-gray-400",
                  validation.hasFieldError("text")
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400"
                    : "border-blue-300 focus:border-blue-500 focus:ring-blue-500 dark:border-blue-600 dark:focus:border-blue-400 dark:focus:ring-blue-400",
                )}
                placeholder="SFX"
                type="text"
                value={sfx}
                onChange={handleTextChange}
              />
              <ValidationErrorDisplay
                className="self-end"
                errors={validation.errors}
                field="text"
                compact
              />
            </div>
          </div>

          <div className={cn("items-top flex flex-row gap-2")}>
            <label
              htmlFor="def"
              className={cn(
                "mt-1 flex-1 font-medium whitespace-nowrap text-blue-700 dark:text-blue-300",
                validation.hasFieldError("def") &&
                  "text-red-600 dark:text-red-400",
              )}
            >
              Definition
            </label>
            <div className={cn("ml-auto flex flex-3 flex-col gap-2")}>
              <input
                className={cn(
                  "flex-3 rounded border bg-white px-2 py-1 focus:ring-1 focus:outline-none dark:bg-slate-700 dark:text-white dark:placeholder-gray-400",
                  validation.hasFieldError("def")
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400"
                    : "border-blue-300 focus:border-blue-500 focus:ring-blue-500 dark:border-blue-600 dark:focus:border-blue-400 dark:focus:ring-blue-400",
                )}
                placeholder="Definition"
                type="text"
                value={def}
                onChange={handleDefChange}
              />
              <ValidationErrorDisplay
                className="self-end"
                errors={validation.errors}
                field="def"
                compact
              />
            </div>
          </div>

          <div className={cn("flex flex-row items-center gap-2")}>
            <label
              htmlFor="extra"
              className={cn(
                "flex-1 font-medium whitespace-nowrap text-blue-700 dark:text-blue-300",
                validation.hasFieldError("extra") &&
                  "text-red-600 dark:text-red-400",
              )}
            >
              Extra
            </label>
            <div className={cn("ml-auto flex w-full flex-3 flex-col gap-2")}>
              <input
                className={cn(
                  "ml-auto w-full rounded border bg-white px-2 py-1 focus:ring-1 focus:outline-none dark:bg-slate-700 dark:text-white dark:placeholder-gray-400",
                  validation.hasFieldError("extra")
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400"
                    : "border-blue-300 focus:border-blue-500 focus:ring-blue-500 dark:border-blue-600 dark:focus:border-blue-400 dark:focus:ring-blue-400",
                )}
                placeholder="Extra"
                type="text"
                value={extra}
                onChange={handleExtraChange}
              />
            </div>
          </div>
          <ValidationErrorDisplay
            errors={validation.errors}
            field="extra"
            compact
          />

          <div className={cn("flex flex-row items-center gap-2")}>
            <div className={cn("flex flex-1 items-center gap-2")}>
              <label
                htmlFor="read"
                className={cn(
                  "font-medium whitespace-nowrap text-blue-700 dark:text-blue-300",
                  validation.hasFieldError("read") &&
                    "text-red-600 dark:text-red-400",
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
            <div className={cn("ml-auto flex flex-3 flex-col gap-2")}>
              <input
                className={cn(
                  "ml-auto w-full rounded border bg-white px-2 py-1 focus:ring-1 focus:outline-none dark:bg-slate-700 dark:text-white dark:placeholder-gray-400",
                  !readingEnabled && "cursor-not-allowed opacity-50",
                  validation.hasFieldError("read")
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400"
                    : "border-blue-300 focus:border-blue-500 focus:ring-blue-500 dark:border-blue-600 dark:focus:border-blue-400 dark:focus:ring-blue-400",
                )}
                placeholder="Reading"
                type="text"
                value={read}
                onChange={handleReadChange}
                disabled={!readingEnabled}
              />
            </div>
          </div>
          <ValidationErrorDisplay
            errors={validation.errors}
            field="read"
            compact
          />
        </div>
        <SFXTLEditor
          sfx={{ text: sfx, def, extra, read, tls, language: lang ?? "en" }}
          updateSFX={(sfx_) => {
            if (typeof sfx_ === "function") {
              const updated = sfx_({
                text: sfx,
                def,
                extra,
                read,
                tls,
                language: lang ?? "en",
              });
              updateSFX(updated);
            } else {
              updateSFX(sfx_);
            }
          }}
        />
        <button
          className={cn(
            "cursor-pointer rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-blue-400 dark:focus:ring-offset-slate-800",
            !validation.isValid && "cursor-not-allowed opacity-50",
          )}
          onClick={handleCreate}
        >
          {createSFX.isPending ? "Creating..." : "Creates"}
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
