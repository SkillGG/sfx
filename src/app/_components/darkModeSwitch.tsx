import { ACCENTS, useTheme } from "../hooks/theme";
import { cn } from "@/utils";

export const DarkModeSwitch = ({ className }: { className?: string }) => {
  const { mode, setMode } = useTheme();
  return (
    <button
      className={cn("cursor-pointer", className)}
      onClick={() => setMode(mode === "light" ? "dark" : "light")}
      type={"button"}
    >
      {mode === "light" ? "🌙" : "☀️"}
    </button>
  );
};

const AccentSwitch = ({ className }: { className?: string }) => {
  const { accent, setAccent } = useTheme();
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center",
        "h-5 w-5 rounded-full border-2 border-(color:--neutral-300)",
        "cursor-pointer transition-colors",
        "bg-(color:--accent-500)",
        "hover:bg-(color:--accent-600)",
        "focus:ring-2 focus:ring-(color:--accent-400) focus:outline-none",
        "dark:border-(color:--neutral-600)",
        className,
      )}
      aria-label="Switch accent color"
      onClick={() => {
        const idx = ACCENTS.indexOf(accent);
        setAccent(ACCENTS[(idx + 1) % ACCENTS.length] ?? "blue");
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        const idx = ACCENTS.indexOf(accent) - 1;
        setAccent(ACCENTS[idx < 0 ? ACCENTS.length - 1 : idx] ?? "blue");
      }}
    />
  );
};

export default DarkModeSwitch;
export { AccentSwitch };
