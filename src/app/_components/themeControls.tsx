"use client";

import { cn } from "@/utils";
import DarkModeSwitch, { AccentSwitch } from "./darkModeSwitch";

export const ThemeControls = ({ className }: { className?: string }) => {
  return (
    <nav
      className={cn("flex items-center gap-2", className)}
      aria-label="Theme"
    >
      <AccentSwitch />
      <DarkModeSwitch />
    </nav>
  );
};

export default ThemeControls;
