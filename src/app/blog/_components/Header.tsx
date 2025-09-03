"use client";

import { cn } from "@/utils/utils";
import ThemeControls from "../../_components/themeControls";

export const BlogHeader = ({ title }: { title: React.ReactNode }) => {
  return (
    <header className={cn("mb-6 flex items-center justify-between")}>
      {title}
      <div className={cn("flex items-center gap-3")}>
        <ThemeControls />
      </div>
    </header>
  );
};

export default BlogHeader;
