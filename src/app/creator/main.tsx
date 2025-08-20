"use client";

import { api } from "@/trpc/react";
import { useEffect, useState } from "react";
import { useDarkMode } from "../hooks/darkmode";
import DarkModeSwitch from "../_components/darkModeSwitch";
import { SFXLangSelect } from "../_components/sfxLangSelect";
import { useRouter } from "next/navigation";
import { cn, type CollapsedOnomatopoeia, type CollapsedTL } from "@/utils";
import { useValidation } from "../hooks/validation";
import { ValidationErrorDisplay } from "../_components/validationError";
import { TLEditorDirect } from "../_components/TLEditor";
import type { SFXLang } from "../hooks/langs";
import { useUser, type UserSessionData } from "../hooks/userlogin";
import { SFXListPanel } from "../_components/sfxList.";

// SFX creator page
const CreatorPage = () => {
  const auth = useUser();

  const createSFX = api.sfx.createSFX.useMutation();
  const removeSFX = api.sfx.removeSFX.useMutation();
  const updateSFX = api.sfx.updateSFX.useMutation();

  const utils = api.useUtils();

  const [sfx, setSFX] = useState<string>("");
  const [def, setDef] = useState<string>("");
  const [extra, setExtra] = useState<string>("");
  const [read, setRead] = useState<string | null>("");
  const [lang, setLang] = useState<SFXLang["code"]>("");

  const [lastReadState, setLastReadState] = useState(false);

  const [tls, setTLs] = useState<CollapsedTL[]>([]);

  const router = useRouter();

  const { mode } = useDarkMode();

  const [firstRun, setFirstRun] = useState(false);

  // Initialize validation hook
  const validation = useValidation();

  // persist
  useEffect(() => {
    const memoryStr = localStorage.getItem("creatememory");
    if (memoryStr) {
      const memory: unknown = JSON.parse(memoryStr);
      console.log(memory);
      if (typeof memory !== "object" || !memory) return;
      if ("sfx" in memory && typeof memory.sfx === "string") setSFX(memory.sfx);
      if ("def" in memory && typeof memory.def === "string") setDef(memory.def);
      if ("read" in memory && typeof memory.read === "string")
        setRead(memory.read);
      if ("lang" in memory && typeof memory.lang === "string")
        setLang(memory.lang);
      if ("extra" in memory && typeof memory.extra === "string")
        setExtra(memory.extra);
      if ("tls" in memory && Array.isArray(memory.tls)) {
        const denullifyIds = (tl: CollapsedTL): CollapsedTL => {
          return {
            ...tl,
            id: tl.id ?? Infinity,
            sfx1Id: tl.sfx1Id ?? Infinity,
            sfx2Id: tl.sfx2Id ?? Infinity,
            sfx: {
              ...tl.sfx,
              id: tl.sfx.id ?? Infinity,
              tls: tl.sfx.tls?.map((q) => denullifyIds(q)) ?? [],
            } as CollapsedOnomatopoeia,
          };
        };

        const denullified = memory.tls.map((tl: CollapsedTL) => {
          return denullifyIds(tl);
        });

        setTLs(denullified);
      }
    }
    setFirstRun(true);
  }, []);
  useEffect(() => {
    if (!firstRun) return;
    const memory = { sfx, def, extra, lang, read, tls };
    localStorage.setItem("creatememory", JSON.stringify(memory));
  }, [sfx, def, extra, lang, read, tls, firstRun]);

  if (!auth) return <>Loading...</>;

  const handleCreate = async () => {
    const sfxData = {
      text: sfx,
      def,
      extra: extra ?? null,
      read: read,
      language: lang ?? "en",
      tls: tls ?? {},
    };

    setLastReadState(read !== null);

    const validationResult = validation.validateSFXData(sfxData);
    if (validationResult.isValid) {
      const validSFX = {
        text: sfx,
        def,
        extra: extra ?? null,
        read: read,
        language: lang ?? "en",
        tls: tls ?? [],
        auth,
      } satisfies Omit<CollapsedOnomatopoeia, "id"> & { auth: UserSessionData };

      await createSFX.mutateAsync(validSFX);

      // reset the sfx list
      await utils.sfx.invalidate();

      // reset form
      setSFX("");
      setRead(lastReadState ? "" : null);
      setDef("");
      setExtra("");
      setTLs([]);
    }
  };

  // Simple change handlers
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSFX(e.target.value);
    validation.clearError("text");
  };

  const handleDefChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDef(e.target.value);
    validation.clearError("def");
  };

  const handleExtraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExtra(e.target.value);
    validation.clearError("extra");
  };

  const handleReadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRead(e.target.value);
    validation.clearError("read");
  };

  const handleLanguageChange = (lang: string) => {
    setLang(lang);
  };

  return (
    <div
      className={cn(
        "flex h-[100vh] w-full basis-1/2 flex-row",
        "gap-8 bg-blue-50 p-4 dark:bg-slate-900",
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
                "mr-4 cursor-pointer rounded bg-blue-100 px-3 py-1",
                "text-blue-700 transition hover:bg-blue-200",
                "dark:bg-slate-700 dark:text-blue-200 dark:hover:bg-slate-600",
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
                "flex-1 text-center text-4xl font-bold",
                "text-blue-900 dark:text-blue-100",
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
            "flex flex-col gap-2 rounded-xl border-2 border-blue-300",
            "bg-blue-50 p-2 shadow-sm",
            "dark:border-blue-600 dark:bg-slate-800",
          )}
        >
          <h2
            className={cn(
              "flex items-center justify-center border-b border-blue-200",
              "pb-2 text-center text-2xl font-semibold text-blue-800",
              "dark:border-blue-700 dark:text-blue-200",
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
                "mt-1 flex-1 font-medium whitespace-nowrap",
                "text-blue-700 dark:text-blue-300",
                validation.hasFieldError("text") &&
                  "text-red-600 dark:text-red-400",
              )}
            >
              SFX
            </label>
            <div className={cn("ml-auto flex flex-3 flex-col gap-2")}>
              <input
                className={cn(
                  "rounded border bg-white px-2 py-1",
                  "focus:ring-1 focus:outline-none dark:bg-slate-700 dark:text-white",
                  "dark:placeholder-gray-400",
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
                "mt-1 flex-1 font-medium whitespace-nowrap",
                "text-blue-700 dark:text-blue-300",
                validation.hasFieldError("def") &&
                  "text-red-600 dark:text-red-400",
              )}
            >
              Definition
            </label>
            <div className={cn("ml-auto flex flex-3 flex-col gap-2")}>
              <input
                className={cn(
                  "flex-3 rounded border bg-white px-2 py-1",
                  "focus:ring-1 focus:outline-none dark:bg-slate-700 dark:text-white",
                  "dark:placeholder-gray-400",
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
                "flex-1 font-medium whitespace-nowrap",
                "text-blue-700 dark:text-blue-300",
                validation.hasFieldError("extra") &&
                  "text-red-600 dark:text-red-400",
              )}
            >
              Extra
            </label>
            <div className={cn("ml-auto flex w-full flex-3 flex-col gap-2")}>
              <input
                className={cn(
                  "ml-auto w-full rounded border bg-white px-2 py-1",
                  "focus:ring-1 focus:outline-none dark:bg-slate-700 dark:text-white",
                  "dark:placeholder-gray-400",
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
                  "font-medium whitespace-nowrap",
                  "text-blue-700 dark:text-blue-300",
                  validation.hasFieldError("read") &&
                    "text-red-600 dark:text-red-400",
                )}
              >
                Reading
              </label>
              <label
                className={cn(
                  "flex items-center gap-1 text-sm",
                  "text-blue-600 dark:text-blue-400",
                )}
              >
                <input
                  type="checkbox"
                  checked={read !== null}
                  onChange={() => setRead(read === null ? "" : null)}
                  className={cn(
                    "h-4 w-4 rounded border-blue-300 text-blue-600",
                    "focus:ring-blue-500 dark:border-blue-600 dark:bg-slate-700",
                    "dark:focus:ring-blue-400",
                  )}
                />
              </label>
            </div>
            <div className={cn("ml-auto flex flex-3 flex-col gap-2")}>
              <input
                className={cn(
                  "ml-auto w-full rounded border bg-white px-2 py-1",
                  "focus:ring-1 focus:outline-none dark:bg-slate-700 dark:text-white",
                  "dark:placeholder-gray-400",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  validation.hasFieldError("read")
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400"
                    : "border-blue-300 focus:border-blue-500 focus:ring-blue-500 dark:border-blue-600 dark:focus:border-blue-400 dark:focus:ring-blue-400",
                )}
                placeholder="Reading"
                type="text"
                value={read ?? ""}
                onChange={handleReadChange}
                disabled={read === null}
              />
            </div>
          </div>
          <ValidationErrorDisplay
            errors={validation.errors}
            field="read"
            compact
          />
        </div>
        <TLEditorDirect
          tls={tls}
          onChange={(tls) => setTLs(tls)}
          removeOnCancel
          sfx={{
            def,
            extra,
            id: Infinity,
            language: lang,
            read: null,
            text: sfx,
            tls: tls,
          }}
        />
        <button
          className={cn(
            "cursor-pointer rounded bg-blue-600 px-4 py-2 text-white",
            "transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500",
            "focus:ring-offset-2 focus:outline-none dark:bg-blue-700 dark:hover:bg-blue-600",
            "dark:focus:ring-blue-400 dark:focus:ring-offset-slate-800",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
          onClick={handleCreate}
          disabled={!validation.isValid}
        >
          {createSFX.isPending ? "Creating..." : "Create"}
        </button>
      </div>
      {/* Side panel with SFX list */}
      <div className={cn("flex flex-1 flex-col gap-4")}>
        <h2
          className={cn(
            "py-2 text-center text-2xl font-bold text-blue-900 dark:text-blue-100",
          )}
        >
          Past Created SFX
        </h2>
        <div
          className={cn(
            "flex flex-col gap-2 rounded-xl border-2 border-blue-300",
            "bg-blue-50 p-2 shadow-sm",
            "h-full overflow-auto",
            "dark:border-blue-600 dark:bg-slate-800",
          )}
        >
          <SFXListPanel
            editable
            classNames={{
              sfxs: {
                default: {
                  tls: {
                    sfx: {
                      default: {
                        container: `basis-[45%] grow`,
                      },
                    },
                  },
                },
              },
            }}
            onRemove={async (sfx) => {
              if (auth) {
                await removeSFX.mutateAsync({ id: sfx.id, auth });
                await utils.sfx.listSFX.invalidate();
              }
            }}
            onSave={async (old, sfx) => {
              if (auth) {
                await updateSFX.mutateAsync({ id: old.id, sfx, auth });
                await utils.sfx.listSFX.invalidate();
              }
            }}
          />
        </div>
        <div className={cn("flex justify-around gap-3")}>
          <button
            className={cn(
              "flex-1 cursor-pointer rounded bg-blue-600 px-4 py-2 text-white",
              "transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500",
              "focus:ring-offset-2 focus:outline-none dark:bg-blue-700 dark:hover:bg-blue-600",
              "dark:focus:ring-blue-400 dark:focus:ring-offset-slate-800",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
            onClick={handleCreate}
            disabled
          >
            Prev page
          </button>
          <button
            className={cn(
              "flex-1 cursor-pointer rounded bg-blue-600 px-4 py-2 text-white",
              "transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500",
              "focus:ring-offset-2 focus:outline-none dark:bg-blue-700 dark:hover:bg-blue-600",
              "dark:focus:ring-blue-400 dark:focus:ring-offset-slate-800",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
            onClick={handleCreate}
            disabled
          >
            Next page
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatorPage;
