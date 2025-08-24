import type { ClassValue } from "clsx";
import {
  DEFAULT_SFX_INPUT_STYLES,
  DEFAULT_SFX_LABEL_STYLES,
  SFX,
  SFXEdit,
  type SFXClasses,
  type SFXEditClassNames,
} from "./sfx";
import {
  cn,
  type CollapsedOnomatopoeia,
  type CollapsedTL,
  type Promisable,
} from "@/utils";
import { useSFXLangs } from "../hooks/langs";
import { useState } from "react";
import { Validation } from "../hooks/validation";

export type TLClassNames = SFXClasses & {
  container?: ClassValue;
  tlNum?: ClassValue;
  sfxedit?: SFXEditClassNames;
};

export const TLCard = ({
  tl,

  editable = true,

  removeLangs,

  removeOnCancel,

  noTLs,
  allowDeeperTLs,

  classNames,

  onChange,
  onSave,
}: {
  tl: CollapsedTL;

  editable?: boolean;

  removeLangs?: string[];
  removeOnCancel?: boolean;

  noTLs?: boolean;
  allowDeeperTLs?: boolean;

  classNames?: TLClassNames;

  onSave?: (tl: CollapsedTL | null) => Promisable<void>;
  onChange?: (tl: CollapsedTL) => Promisable<void>;
}) => {
  const { langs } = useSFXLangs();

  const [mode, setMode] = useState<"view" | "edit">(
    !tl.sfx.text || !tl.sfx.def ? "edit" : "view",
  );

  const [onceSaved, setOnceSaved] = useState(!!tl.sfx.text);

  const [cancelData, setCancelData] = useState<CollapsedOnomatopoeia | null>(
    null,
  );

  const isReversed = tl.additionalInfo?.startsWith("⏉");

  if (mode === "edit" && !isReversed && editable) {
    return (
      <>
        <SFXEdit
          noTLs={noTLs}
          allowDeeperTLs={allowDeeperTLs}
          removeLangs={removeLangs}
          classNames={{
            ...classNames?.sfxedit,
            btns: {
              ...classNames?.sfxedit?.btns,
              cancel: cn(
                classNames?.sfxedit?.btns?.cancel,
                removeOnCancel &&
                  !onceSaved &&
                  `bg-(--sfx-button-remove-bg) text-(--sfx-button-remove-text)
                  hover:bg-(--sfx-button-remove-hover-bg)`,
              ),
            },
          }}
          labels={{
            main: `New ${langs.find((l) => l.code === tl.sfx.language)?.name ?? "unknown"} TL (${tl.id})`,
            btns: {
              cancel: removeOnCancel && !onceSaved ? "Remove" : "Cancel",
            },
          }}
          onValidate={(sfx) => {
            return new Validation().validateSFXData(sfx);
          }}
          sfx={tl.sfx}
          onCancel={async () => {
            if (removeOnCancel && !onceSaved) {
              await onSave?.(null);
              return;
            }

            await onChange?.({ ...tl, sfx: cancelData ?? tl.sfx });
            setMode("view");
          }}
          onChange={async (action) => {
            await onChange?.({ ...tl, sfx: action(tl.sfx) });
          }}
          onSaveClicked={async () => {
            await onSave?.(tl);
            setOnceSaved(true);
            setCancelData(tl.sfx);
            setMode("view");
          }}
          tlAddInfoElem={
            <div className={cn("flex flex-row items-center gap-2")}>
              <div className={cn(DEFAULT_SFX_LABEL_STYLES)}>TL info</div>
              <div className={cn("ml-auto flex flex-3 flex-col gap-2")}>
                <input
                  id={`tl-additional-info-${tl.id}`}
                  className={cn(DEFAULT_SFX_INPUT_STYLES())}
                  type="text"
                  value={tl.additionalInfo ?? ""}
                  onChange={({ currentTarget: { value: additionalInfo } }) =>
                    onChange?.({ ...tl, additionalInfo })
                  }
                  placeholder="TL info"
                />
              </div>
            </div>
          }
        />
      </>
    );
  }

  return (
    <div className={cn("relative", classNames?.container)}>
      <div
        className={cn(
          "absolute right-2 bottom-11 dark:text-white",
          classNames?.tlNum,
        )}
      >
        {tl.id}
      </div>
      <SFX
        sfx={tl.sfx}
        key={`tl_${tl.id}:${tl.sfx.id}_${tl.forDeletion}`}
        editable={false}
        tlExtra={tl.additionalInfo?.replace("⏉", "") ?? ""}
        classNames={{
          ...classNames,
          default: {
            ...classNames?.default,
            container: cn(
              classNames?.default?.container,
              tl.forDeletion && "border-(--sfx-tlfordeletion-border)",
            ),
            topinfo: {
              ...classNames?.default?.topinfo,
              text: tl.forDeletion && "text-(--sfx-tlfordeletion-text)",
            },
          },
        }}
      />
      {editable && (
        <div className={cn("flex flex-row gap-2")}>
          <button
            className={cn(
              "flex-1 cursor-pointer rounded bg-(--button-submit-bg) px-4 py-2 text-(--button-submit-text)",
              "transition-colors",
              "hover:bg-(--button-submit-hover-bg)",
              "focus:ring-2 focus:ring-(--input-focus-border) focus:ring-offset-2",
              "focus:ring-offset-(color:--main-bg) focus:outline-none",
              "disabled:bg-(--button-submit-disabled-bg) disabled:text-(--button-submit-disabled-text)",
            )}
            onClick={() => {
              if (!tl.forDeletion) setMode("edit");
            }}
            disabled={tl.forDeletion}
          >
            Edit
          </button>
          <button
            className={cn(
              "flex-1 cursor-pointer rounded bg-(--sfx-button-remove-bg) px-4 py-2 text-(--sfx-button-remove-text)",
              "transition-colors",
              "hover:bg-(--sfx-button-remove-hover-bg)",
              "focus:ring-2 focus:ring-(--input-focus-border) focus:ring-offset-2",
              "focus:ring-offset-(color:--main-bg) focus:outline-none",
              "disabled:bg-(--sfx-button-remove-disabled-bg) disabled:text-(--sfx-button-remove-disabled-text)",
            )}
            onClick={async () => {
              await onSave?.(null);
            }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
};
