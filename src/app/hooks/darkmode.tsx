"use client";

// darkmode hook, provider and context

import React, { createContext, useContext, useEffect, useState } from "react";

export type LightMode = "light" | "dark";

const DarkModeContext = createContext<{
  mode: LightMode;
  setMode: (mode: LightMode) => void;
} | null>(null);

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context)
    throw new Error("useDarkMode must be used within a DarkModeProvider");
  return context;
};

export const DarkModeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [mode, setMode] = useState<LightMode>("light");

  useEffect(() => {
    const lsDarkMode = localStorage.getItem("darkMode");
    if (lsDarkMode) {
      setMode(lsDarkMode as LightMode);
    } else {
      // Only set mode if user prefers dark, otherwise leave as default ("light")
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      if (prefersDark) {
        setMode("dark");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", mode);
  }, [mode]);

  return (
    <DarkModeContext.Provider value={{ mode, setMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

// Accent hook, provider and context
export type AccentName =
  | "blue"
  | "green"
  | "purple"
  | "rose"
  | "amber"
  | "pink";

const AccentContext = createContext<{
  accent: AccentName;
  setAccent: (accent: AccentName) => void;
} | null>(null);

export const useAccent = () => {
  const ctx = useContext(AccentContext);
  if (!ctx) throw new Error("useAccent must be used within an AccentProvider");
  return ctx;
};

export const AccentProvider = ({ children }: { children: React.ReactNode }) => {
  const [accent, setAccent] = useState<AccentName>("blue");

  useEffect(() => {
    const lsAccent = localStorage.getItem("accentName");
    if (lsAccent) setAccent(lsAccent as AccentName);
  }, []);

  useEffect(() => {
    localStorage.setItem("accentName", accent);
    document.documentElement.dataset.accent = accent;
  }, [accent]);

  return (
    <AccentContext.Provider value={{ accent, setAccent }}>
      {children}
    </AccentContext.Provider>
  );
};
