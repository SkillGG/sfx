import { useDarkMode } from "../hooks/darkmode";
import { cn } from "@/utils";

const DarkModeSwitch = ({ className }: { className?: string }) => {
  const { mode, setMode } = useDarkMode();
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

export default DarkModeSwitch;
