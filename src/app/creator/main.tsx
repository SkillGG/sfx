"use client";

import { api } from "@/trpc/react";
import { Suspense, useEffect, useState } from "react";
import { useTheme } from "../hooks/theme";
import DarkModeSwitch, { AccentSwitch } from "../_components/darkModeSwitch";
import { SFXLangSelect } from "../_components/sfx/sfxLangSelect";
import { useRouter, useSearchParams } from "next/navigation";
import {
  cn,
  parseMemoryData,
  type CollapsedOnomatopoeia,
  type CollapsedTL,
} from "@/utils/utils";
import { TLEditorDirect } from "../_components/TLEditor";
import type { SFXLang } from "../hooks/langs";
import { useUser, type UserSessionData } from "../hooks/userlogin";
import { SFXListPanel } from "../_components/sfx/sfxList";
import { LoadPageSpinner } from "../_components/loadPage";
import { SFXEditPanel } from "../_components/sfxEditPanel";
import { useValidation, type Validation } from "../hooks/validation";
import { useSearch } from "../hooks/search";
import SearchBar from "../_components/searchBar";
import { Spinner } from "../_components/spinner";

// SFX creator page
const CreatorPage = () => {
  const params = useSearchParams();
  const auth = useUser();
  const search = useSearch(
    {
      id: params.get("id") ?? "",
      q: params.get("q") ?? "",
      l: params.get("l") ?? "",
    },
    { history: "replace" },
  );

  const createSFX = api.sfx.createSFX.useMutation();
  const removeSFX = api.sfx.removeSFX.useMutation();
  const updateSFX = api.sfx.updateSFX.useMutation();

  const utils = api.useUtils();

  const [sfx, setSFX] = useState<string>("");
  const [def, setDef] = useState<string>("");
  const [extra, setExtra] = useState<string>("");
  const [read, setRead] = useState<string | null>("");
  const [lang, setLang] = useState<SFXLang["code"]>("");

  const [tempRead, setTempRead] = useState<string>("");

  const [tls, setTLs] = useState<CollapsedTL[]>([]);

  const router = useRouter();

  const { mode, accent } = useTheme();

  const [firstRun, setFirstRun] = useState(false);

  // Initialize validation hook
  const validation: Validation = useValidation();

  useEffect(() => {
    // parse create data from LocalStorage to not lose it on refresh
    const memoryData = parseMemoryData(localStorage.getItem("memory"));
    if (memoryData) {
      setSFX(memoryData.text ?? "");
      setDef(memoryData.def ?? "");
      setExtra(memoryData.extra ?? "");
      setLang(memoryData.lang ?? "en");
      setRead(memoryData.read ?? null);
      setTempRead(memoryData.tempRead ?? "");
      setTLs(memoryData.tls ?? []);
    }
    setFirstRun(true);
  }, []);

  useEffect(() => {
    // save to localStorage
    if (!firstRun) return;
    const memory = { text: sfx, def, extra, lang, read, tls, tempRead };
    localStorage.setItem("memory", JSON.stringify(memory));
  }, [sfx, def, extra, lang, read, tls, firstRun, tempRead]);

  if (!auth)
    // loading and checking whether user is logged in
    return (
      <>
        <LoadPageSpinner key={"lps"} />
      </>
    );

  const handleCreate = async () => {
    const sfxData = {
      text: sfx,
      def,
      extra: extra ?? null,
      read: read,
      language: lang ?? "en",
      tls: tls ?? {},
    };

    setTempRead(read ?? "");

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
      setRead(!!read ? "" : null);
      setDef("");
      setExtra("");
      setTLs([]);
    }
  };

  return (
    <div
      className={cn(
        "flex h-[100vh] w-full basis-1/2 lg:flex-row",
        "flex-col bg-(--main-bg) p-4 lg:gap-8",
        mode,
      )}
      data-accent={accent}
    >
      {/* Main creator form */}
      <div
        className={cn("flex max-h-screen flex-1 flex-col gap-4 lg:max-h-none")}
      >
        <h1 className={cn("text-4xl font-bold text-(--header-text)")}>
          <div className={cn("flex w-full items-center justify-between")}>
            <button
              className={cn(
                "mr-4 cursor-pointer rounded-lg bg-(--back-bg) px-2 pb-1",
                "text-(--back-text) transition-colors hover:bg-(--back-hover-bg)",
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
                "text-(--header-text)",
              )}
            >
              Creator
            </span>
            <div className={cn("ml-auto")}>
              <div className={cn("flex items-center gap-2")}>
                <AccentSwitch className={cn("w-8")} />
                <DarkModeSwitch className={cn("h-8 text-2xl")} />
              </div>
            </div>
          </div>
        </h1>
        <div
          className={cn(
            "flex flex-col gap-2 rounded-xl border-2 border-(--regular-border)",
            "bg-(--sfx-card-bg)/50 p-2 shadow-sm",
          )}
        >
          <h2
            className={cn(
              "flex items-center justify-center border-b border-(--regular-border)",
              "pb-2 text-center text-2xl font-semibold text-(--header-text)",
            )}
          >
            New SFX
            <SFXLangSelect
              classNames={{
                main: "ml-2 text-sm",
              }}
              hideValues={[lang]}
              value={lang}
              onChange={setLang}
            />
          </h2>

          <SFXEditPanel
            validation={validation}
            onChange={({
              def: ndef,
              extra: nextra,
              read: nread,
              text: ntext,
            }) => {
              setRead(nread.value);
              setTempRead(nread.temp);
              setDef(ndef.value);
              setSFX(ntext.value);
              setExtra(nextra.value);
            }}
            className={"max-h-[30vh] overflow-scroll"}
            value={{
              text: {
                label: "SFX",
                type: "normal",
                value: sfx,
                placeholder: "SFX",
                key: "newtext",
              },
              def: {
                label: "Definition",
                type: "normal",
                value: def,
                placeholder: "Definition",
                key: "newdef",
                long: true,
              },
              read: {
                label: "Reading",
                type: "toggle",
                temp: tempRead,
                value: read,
                placeholder: "Reading",
                key: "newread",
                long: true,
              },
              extra: {
                label: "Extra",
                type: "normal",
                value: extra,
                placeholder: "Extra",
                key: "newextra",
                long: true,
              },
            }}
          />
        </div>
        <TLEditorDirect
          tls={tls}
          allowDeeperTLs
          onChange={(tls) => {
            setTLs(tls);
          }}
          classNames={{
            container: "bg-(--sfx-card-bg)/50",
          }}
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
            "cursor-pointer rounded bg-(--button-submit-bg) px-4 py-2",
            "text-(--button-submit-text) transition-colors",
            "hover:bg-(--button-submit-hover-bg)",
            "focus:ring-2 focus:ring-(--input-focus-border) focus:ring-offset-2 focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
          onClick={handleCreate}
          disabled={!validation.isValid || createSFX.isPending}
        >
          {createSFX.isPending ? "Creating..." : "Create"}
        </button>
      </div>

      {/* Side panel with SFX list */}
      <hr className="my-2 border-(--regular-border) lg:hidden" />
      <div
        className={cn(
          "grid max-h-[50lvh] flex-1 gap-4 pb-2 lg:flex lg:max-h-none lg:flex-col lg:pb-0",
        )}
      >
        <h2
          className={cn(
            "pb-1 text-center text-4xl font-bold",
            "text-(--header-text)",
          )}
        >
          Past Created SFX
        </h2>
        <div
          className={cn(
            "flex flex-col gap-2 rounded-xl border-2 border-(--regular-border)",
            "bg-(--sfx-card-bg)/50 p-2 shadow-sm",
            "h-full overflow-auto",
          )}
        >
          <Suspense fallback={<Spinner className={"m-auto"} />}>
            <SFXListPanel
              customQuery={search.query}
              allowSeparate
              editable
              useNewSFX
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
                  if ("separated" in sfx) {
                    return;
                  }
                  await removeSFX.mutateAsync({ id: sfx.id, auth });
                  await utils.sfx.listSFX.invalidate();
                }
              }}
              onSave={async (old, sfx) => {
                if (auth) {
                  console.log("Updating SFX", sfx);
                  await updateSFX.mutateAsync({ id: old.id, sfx, auth });
                  await utils.sfx.listSFX.invalidate();
                }
              }}
            />
          </Suspense>
        </div>
        <div className={cn("row-start-2 flex justify-center gap-3")}>
          <SearchBar
            setSearch={search.onChange}
            value={search.curValue}
            classNames={{
              container: "mx-auto w-full gap-4",
              input: "w-full",
              label:
                "not-sr-only text-nowrap flex justify-center items-center text-(--label-text)",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CreatorPage;
