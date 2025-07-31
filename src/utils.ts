import type { SFX, Translation } from "@prisma/client";
import type { SFXLang } from "./app/hooks/langs";
import { twMerge } from "tailwind-merge";
import clsx, { type ClassValue } from "clsx";

type SFXTranslationObject = Record<SFXLang["code"], SFXData>;

export type SFXData = Omit<SFX, "id" | "createdAt" | "updatedAt"> & {
  tls?: SFXTranslationObject;
};

export type TranslationData = Omit<
  Translation,
  "id" | "createdAt" | "updatedAt"
>;

/**
 *
 * @param {HTMLDialogElement} dialog
 * @param {()=>void} [closeCallback]
 */
export const makeDialogBackdropExitable = (
  dialog: HTMLDialogElement,
  closeCallback?: () => void,
  closeCallbackOnly?: boolean,
) => {
  dialog.addEventListener("click", function (event) {
    const rect = dialog.getBoundingClientRect();
    const isInDialog =
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width;
    console.log("isInDialog", isInDialog);
    if (!isInDialog) {
      if (!closeCallbackOnly) dialog.close();
      closeCallback?.();
    }
  });
};

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};
