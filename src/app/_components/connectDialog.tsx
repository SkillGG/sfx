import { api } from "@/trpc/react";
import {
  cn,
  type CollapsedOnomatopoeia,
  type CollapsedTL,
  type Promisable,
} from "@/utils/utils";
import type { RefObject } from "react";
import { SFX } from "./sfx";

export const ConnectSFXDialog = ({
  onChange,
  sfx,
  illegibleSFX,
  ref,
}: {
  onChange?: (
    change: (prev: CollapsedTL[]) => CollapsedTL[],
  ) => Promisable<void>;
  ref?: RefObject<HTMLDialogElement | null>;
  illegibleSFX?: (() => number[]) | number[];
  sfx: CollapsedOnomatopoeia;
}) => {
  const sfxs = api.sfx.listSFX.useQuery("list");

  const illegible =
    typeof illegibleSFX === "function" ? illegibleSFX() : (illegibleSFX ?? []);

  const SFXDialogID = `connectSFXDialog_${sfx.id}`;

  return (
    <dialog
      popover={"auto"}
      id={SFXDialogID}
      ref={ref}
      className={cn(
        "m-auto min-w-[50%] rounded-xl border border-(--regular-border)",
        "bg-(--dialog-bg)/50 p-6 shadow-lg backdrop-blur-sm",
      )}
    >
      <button
        className={cn(
          "absolute top-5 right-4 z-10 rounded-full bg-(--button-neutral-bg) px-2",
          "cursor-pointer text-(--button-neutral-text) hover:inset-ring-1",
          "block hover:bg-(--button-neutral-hover-bg)",
          "hover:inset-ring-(color:--button-neutral-inset-ring)",
        )}
        type="button"
        popoverTarget={SFXDialogID}
        popoverTargetAction="hide"
        aria-label="Close"
      >
        ×
      </button>
      {sfxs.isFetching && (
        <div className={cn("py-4 text-center text-(color:--label-text)")}>
          Loading...
        </div>
      )}
      {!sfxs.isFetching && sfxs.isFetched && (
        <div tabIndex={-1}>
          <div
            className={cn(
              "mb-4 text-2xl font-semibold text-(color:--header-text)",
            )}
          >
            Connect to another SFX:
          </div>
          <div
            className={cn(
              "max-h-[400px] overflow-y-auto rounded-xl",
              "border-(--regular-border) focus:border-1 focus:outline-0",
            )}
          >
            <ul className={cn("flex flex-col gap-4 p-4")}>
              {sfxs.data
                ?.filter((s) => !illegible.includes(s.id))
                .map((connSFX) => {
                  return (
                    <li
                      key={connSFX.id}
                      className={cn(
                        "flex flex-row rounded-lg",
                        "mr-2 border-0",
                        "group/conn hover:cursor-pointer",
                        "outline-0 focus:ring-0",
                      )}
                      tabIndex={0}
                      onClick={async () => {
                        // console.log("Adding translation!");
                        await onChange?.((prev) => [
                          ...prev,
                          {
                            id: -prev.length - 1,
                            sfx1Id: sfx.id,
                            sfx2Id: connSFX.id,
                            sfx: connSFX,
                            additionalInfo: "",
                          },
                        ]);
                      }}
                    >
                      <div className={cn("flex-1")}>
                        <SFX
                          sfx={connSFX}
                          classNames={{
                            default: {
                              container: cn(
                                "rounded-r-none shadow-none ",
                                "ring-r-0 group-hover/conn:ring-dashed",
                                "group-hover/conn:ring-2",
                                "group-hover/conn:border-transparent",
                                "group-hover/conn:ring-r-0",
                                "group-hover/conn:ring-(--complement-600)",
                                "group-focus/conn:ring-2",
                                "group-focus/conn:border-transparent",
                                "group-focus/conn:ring-r-0",
                                "group-focus/conn:ring-(--complement-600)",
                              ),
                            },
                          }}
                        />
                      </div>
                      <div>
                        <button
                          tabIndex={-1}
                          className={cn(
                            "h-full cursor-pointer rounded rounded-l-none",
                            "bg-(color:--button-submit-bg) px-3 py-1 text-sm text-white",
                            "transition-colors group-hover/conn:bg-(color:--button-submit-hover-bg)",
                            "group-hover/conn:ring-2",
                            "group-hover/conn:ring-l-0",
                            "group-focus/conn:ring-2",
                            "group-focus/conn:ring-l-0",
                            "ring-(--complement-600)",
                          )}
                          popoverTargetAction="hide"
                          popoverTarget={SFXDialogID}
                        >
                          Connect
                        </button>
                      </div>
                    </li>
                  );
                })}
            </ul>
          </div>
        </div>
      )}
    </dialog>
  );
};
