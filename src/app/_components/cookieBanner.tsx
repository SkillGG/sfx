"use client";

import { useState, useEffect } from "react";
import { cn } from "@/utils/utils";
import { QuestionMarkSVG } from "./questionMark";
import CookiesDialog from "./cookiesDialog";

// Version tracking for banner content changes
const BANNER_VERSION = 2;
const BANNER_VERSION_KEY = "cookieBannerVersion";

export const CookieBanner = () => {
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  useEffect(() => {
    // Check if banner should be shown
    const savedVersion = localStorage.getItem(BANNER_VERSION_KEY);

    if (savedVersion && parseInt(savedVersion) === BANNER_VERSION) {
      // Banner was dismissed and version matches - don't show
      setShowCookieBanner(false);
    } else {
      // First time or version changed - show banner
      setShowCookieBanner(true);
    }
  }, []);

  const handleDismiss = (dontAskAgain = false) => {
    if (dontAskAgain) {
      // Save current version
      localStorage.setItem(BANNER_VERSION_KEY, BANNER_VERSION.toString());
    }
    setShowCookieBanner(false);
  };

  if (!showCookieBanner) return null;

  return (
    <aside
      role="complementary"
      aria-label="Cookies notice"
      className={cn(
        "fixed right-0 bottom-0 left-0 z-50 border-t",
        "border-(--banner-border) bg-(--banner-bg)/70 p-4 bg-blend-saturation",
        "shadow-[var(--banner-shadow)]",
      )}
    >
      <CookiesDialog
        id="cookiesDialog"
        classNames={{ container: "max-w-sm" }}
      />
      <div
        className={cn(
          "mx-auto flex max-w-2xl items-center justify-center gap-4",
        )}
      >
        <div className={cn("flex w-full flex-row justify-center gap-2")}>
          <div
            className={cn(
              "flex w-fit flex-1 items-center text-sm text-(--banner-text)",
            )}
          >
            <p className={cn("text-center text-balance")}>
              This website uses necessary cookies to function properly. By using
              this site, you agree to our use of cookies.
            </p>
            <button
              type="button"
              aria-label="Open cookies notice"
              popoverTarget="cookiesDialog"
              popoverTargetAction="show"
              className={cn(
                "block rounded-full",
                "h-8 w-8 cursor-pointer p-[3px]",
                "focus:ring-2 focus:ring-(color:--input-focus-border)",
                "focus:ring-offset-2 focus:ring-offset-(color:--dialog-bg) focus:outline-none",
              )}
            >
              <QuestionMarkSVG classNames={{ svg: cn("bg-transparent") }} />
            </button>
          </div>
          <button
            onClick={() => handleDismiss()}
            className={cn(
              "cursor-pointer rounded-lg px-4 py-2 text-sm font-medium",
              "bg-(--button-submit-bg) text-(--button-submit-text)",
              "hover:bg-(--button-submit-hover-bg)",
              "focus:ring-2 focus:ring-(color:--input-focus-border) focus:outline-none",
              "focus:ring-offset-2 focus:ring-offset-(--dialog-bg)",
            )}
          >
            OK
          </button>

          <button
            type="button"
            onClick={() => {
              handleDismiss(true);
            }}
            className={cn(
              "cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium",
              "border border-(--button-submit-bg)",
              "bg-(--button-submit-bg) text-(--button-submit-text)",
              "hover:border-(--button-submit-hover-bg) hover:bg-(--button-submit-hover-bg)",
              "focus:ring-2 focus:ring-(color:--input-focus-border) focus:outline-none",
              "focus:ring-offset-2 focus:ring-offset-(--dialog-bg)",
              "transition-colors duration-200",
            )}
          >
            Don&apos;t show again
          </button>
        </div>
      </div>
    </aside>
  );
};
