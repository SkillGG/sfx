"use client";

// darkmode hook, provider and context

import { createContext, useContext, useEffect, useState } from "react";

type LightMode = "light" | "dark";

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
