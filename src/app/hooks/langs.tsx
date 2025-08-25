"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type SFXLang = { name: string; code: string };

const DEFAULT_LANGUAGES = [
  { name: "English", code: "en" },
  { name: "Polish", code: "pl" },
  { name: "Chinese", code: "zh" },
  { name: "Japanese", code: "ja" },
  { name: "Korean", code: "ko" },
  { name: "French", code: "fr" },
  { name: "German", code: "de" },
  { name: "Spanish", code: "es" },
  { name: "Italian", code: "it" },
];

const SFXLangs = createContext<{
  langs: SFXLang[];
  setLangs: (langs: SFXLang[] | ((prev: SFXLang[]) => SFXLang[])) => void;
}>({
  langs: [],
  setLangs: (a) => a,
});

export const useSFXLangs = () => {
  const { langs, setLangs } = useContext(SFXLangs);
  if (!langs) throw new Error("Not in a SFXLangProvider!");
  return { langs, setLangs };
};

export const SFXLangProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [langs, setLangs] = useState<SFXLang[]>(DEFAULT_LANGUAGES);

  useEffect(() => {
    const lsLangs = localStorage.getItem("langs");
    if (lsLangs) {
      // check typing
      const parsedLangs: unknown = JSON.parse(lsLangs);
      if (
        Array.isArray(parsedLangs) &&
        parsedLangs.every(
          (q: unknown): q is SFXLang =>
            typeof q === "object" &&
            !!q &&
            "name" in q &&
            "code" in q &&
            typeof q.name === "string" &&
            typeof q.code === "string",
        )
      ) {
        if (parsedLangs.length === 0) return;
        setLangs(parsedLangs);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("langs", JSON.stringify(langs));
  }, [langs]);

  return (
    <SFXLangs.Provider
      value={{
        langs,
        setLangs: (ls) => {
          if (typeof ls === "function") setLangs(ls(langs));
          else setLangs(ls);
        },
      }}
    >
      {children}
    </SFXLangs.Provider>
  );
};
