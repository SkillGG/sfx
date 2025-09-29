import {
  cn,
  SFXObj,
  type CollapsedOnomatopoeia,
  type CollapsedTL,
  type Promisable,
} from "@/utils/utils";
import {
  SFXLangSelect,
  type SFXLangSelectClassNames,
} from "./sfx/sfxLangSelect";
import React, { useRef, useState } from "react";
import type { ClassValue } from "clsx";
import { TLCard, type TLClassNames } from "./tlCard";
import { ConnectSFXDialog } from "./connectDialog";

type TLEditorClassNames = {
  container?: ClassValue;
  header?: ClassValue;
  tls?: {
    container?: ClassValue;
    tl?: TLClassNames;
  };
  add?: {
    container?: ClassValue;
    langSelect?: SFXLangSelectClassNames;
    addTL?: ClassValue;
    connTL?: ClassValue;
  };
};

export const TLEditorDirect = ({
  tls,

  sfx,
  removeOnCancel,

  noTLs,
  allowDeeperTLs,

  separate,
  separateLabel,

  classNames,

  dev,

  onChange,
}: {
  tls: CollapsedTL[];
  sfx?: CollapsedOnomatopoeia;
  removeOnCancel?: boolean;
  noTLs?: boolean;
  allowDeeperTLs?: boolean;
  separate?: (sfx: CollapsedOnomatopoeia) => void;
  separateLabel?: string;
  classNames?: TLEditorClassNames;
  onChange: (tls: CollapsedTL[]) => Promisable<void>;
  dev?: boolean;
}) => {
  const [newTL, setNewTL] = useState<CollapsedTL>({
    additionalInfo: "",
    sfx1Id: sfx?.id ?? Infinity,
    sfx2Id: Infinity,
    id: -(tls.length + 1),
    sfx: SFXObj({ id: -(tls.length + 1) }),
    // },
  });

  const connSFXDialog = useRef<HTMLDialogElement>(null);

  const [freshTLs, setFreshTLs] = useState<number[]>([]);

  const handleAddTL = async () => {
    const newTLs = [...tls, newTL];
    await onChange?.(newTLs);
    setFreshTLs((prev) => [...prev, newTL.id]);
    setNewTL((p) => ({
      ...p,
      id: p.id - 1,
      sfx: { ...p.sfx, id: p.id - 1 },
    }));
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border-2",
        "border-(--regular-border) p-2 shadow-sm",
        "h-full max-h-[100dvh] min-h-0",
        "select-none",
        classNames?.container,
      )}
    >
      <div
        className={cn(
          "border-b border-(color:--regular-border)",
          "dark:text-(color:--accent-100)",
          "text-center text-xl font-bold",
          "text-(color:--accent-900)",
          classNames?.header,
        )}
      >
        Translations
      </div>
      <div
        className={cn(
          "flex min-h-0 flex-col",
          "overflow-y-auto",
          classNames?.tls?.container,
        )}
      >
        {tls.map((tl) => (
          <TLCard
            dev={dev}
            tl={tl}
            removeLangs={[sfx?.language ?? ""]}
            separate={separate}
            separateLabel={separateLabel}
            key={tl.id}
            noTLs={noTLs}
            classNames={classNames?.tls?.tl}
            allowDeeperTLs={allowDeeperTLs}
            removeOnCancel={freshTLs.includes(tl.id) ? true : removeOnCancel}
            onChange={async (tl) => {
              const newTLs = tls.map((t) => (t.id === tl.id ? tl : t));
              await onChange?.(newTLs);
            }}
            onSave={async (ntl) => {
              setFreshTLs((prev) => prev.filter((q) => q !== ntl?.sfx.id));
              if (!ntl) {
                if (removeOnCancel || freshTLs.includes(tl.id)) {
                  await onChange?.(tls.filter((t) => t.id !== tl.id));
                } else {
                  await onChange?.(
                    tls.map((t) =>
                      t.id === tl.id
                        ? {
                            ...t,
                            forDeletion: !t.forDeletion,
                          }
                        : t,
                    ),
                  );
                }
              }
            }}
          />
        ))}
      </div>
      <div className={cn("flex flex-row gap-2", classNames?.add?.container)}>
        <SFXLangSelect
          hideValues={[newTL.sfx.language]}
          removeValues={[...(sfx?.language ? [sfx.language] : [])]}
          value={newTL.sfx.language}
          onChange={(lang) =>
            setNewTL((p) => ({ ...p, sfx: { ...p.sfx, language: lang } }))
          }
          classNames={classNames?.add?.langSelect}
        />
        <button
          className={cn(
            "flex-1 cursor-pointer rounded bg-(--button-submit-bg) px-4 py-2 text-(--button-submit-text)",
            "transition-colors",
            "hover:bg-(--button-submit-hover-bg)",
            "focus:ring-2 focus:ring-(--input-focus-border) focus:ring-offset-2",
            "focus:ring-offset-(color:--main-bg) focus:outline-none",
            "disabled:bg-(--button-disabled-bg) disabled:text-(--button-disabled-text)",

            classNames?.add?.addTL,
          )}
          onClick={handleAddTL}
        >
          Add Translation
        </button>
        {sfx && (
          <ConnectSFXDialog
            sfx={sfx}
            ref={connSFXDialog}
            illegibleSFX={[...tls.map((t) => t.sfx.id), sfx.id]}
            onChange={async (change) => {
              await onChange?.(change(tls));
            }}
          />
        )}
        <button
          className={cn(
            "flex-1 cursor-pointer rounded bg-(--button-submit-bg) px-4 py-2 text-(--button-submit-text)",
            "transition-colors",
            "hover:bg-(--button-submit-hover-bg)",
            "focus:ring-2 focus:ring-(--input-focus-border) focus:ring-offset-2",
            "focus:ring-offset-(color:--main-bg) focus:outline-none",
            "disabled:bg-(--button-disabled-bg) disabled:text-(--button-disabled-text)",
            classNames?.add?.connTL,
          )}
          onClick={() => {
            connSFXDialog.current?.showPopover();
          }}
        >
          Connect SFX
        </button>
      </div>
    </div>
  );
};
