"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type LightMode = "light" | "dark";
export type AccentName =
  | "blue"
  | "green"
  | "purple"
  | "rose"
  | "amber"
  | "pink";

type ThemeContextValue = {
  mode: LightMode;
  setMode: (mode: LightMode) => void;
  accent: AccentName;
  setAccent: (accent: AccentName) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<LightMode>("light");
  const [accent, setAccent] = useState<AccentName>("blue");

  // hydrate from storage and system preference
  useEffect(() => {
    const lsMode = localStorage.getItem("darkMode") as LightMode | null;
    if (lsMode) setMode(lsMode);
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setMode("dark");
    }
    const lsAccent = localStorage.getItem("accentName") as AccentName | null;
    if (lsAccent) setAccent(lsAccent);
  }, []);

  // persist and reflect to DOM
  useEffect(() => {
    localStorage.setItem("darkMode", mode);
    // apply class for dark mode
    document.documentElement.classList.toggle("dark", mode === "dark");
  }, [mode]);

  useEffect(() => {
    localStorage.setItem("accentName", accent);
    document.documentElement.dataset.accent = accent;
  }, [accent]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
};
