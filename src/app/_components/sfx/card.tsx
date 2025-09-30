import {
  Parser,
  parseSFXFields,
  type SFXField,
  type SFXFieldWithMultiIMG,
} from "@/utils/parse/sfxParse";
import type { SFXCardClasses, SFXTLDiscriminator } from "./utils";
import { useSFXLangs } from "@/app/hooks/langs";
import { useMemo } from "react";
import { REVERSE_MARK } from ".";
import { cn } from "@/utils/utils";
import { MultiIMGField, SFXFieldDiv } from "./fields";
import { TLCard } from "../tlCard";
import { SFXInfoButton } from "./info";

const reversedTL = (str?: string): string => {
  if (!str) return "";

  const hides = Parser.parseMultiple(str)?.filter((q) => Parser.isHide(q));

  return `${Parser.strip(str)};${hides
    .map((q) => q.revIndices?.map((ri) => `-${q.fieldKey}${ri + 1}`))
    .flat(2)
    .filter(Boolean)
    .join(";")}`;
};

const allowedFields: SFXField["type"][] = ["sfxlink", "string", "link", "img"];

const reduceMultiIMGs = (
  p: SFXFieldWithMultiIMG[],
  n: SFXField,
): SFXFieldWithMultiIMG[] => {
  if (n.type === "img" && p.length > 0) {
    const lastP = p[p.length - 1];
    if (Array.isArray(lastP)) {
      lastP.push(n);
      return p;
    } else if (lastP?.type === "img") {
      return [...p.slice(0, -1), [lastP, n]];
    }
  }

  return [...p, n];
};

export const SFXCard = ({
  sfx,
  classNames,
  tlExtra,
  dev,
}: SFXTLDiscriminator & {
  classNames?: SFXCardClasses;
  tlExtra?: string;
  dev?: boolean;
}) => {
  const { langs } = useSFXLangs();

  const usedSFX = useMemo(() => ({ ...sfx }), [sfx]);
  const titleId = `sfx_${usedSFX.id}_title`;

  /*   const curTLExtra = useMemo(() => {
      const reversedTLs = sfx.tls
        .filter((q) => q.additionalInfo?.startsWith(REVERSE_MARK))
        .map((q) => q.additionalInfo?.substring(1) ?? "")
        .filter<string>((q): q is string => !!q)
        .filter((q) => !Parser.asHide(q));
  
      return `${tlExtra ?? ""}${tlExtra ? ";" : ""}${reversedTLs.join(";")}`;
    }, [tlExtra, sfx.tls]); */

  const parsed = useMemo(
    () =>
      parseSFXFields({
        def: sfx.def,
        extra: sfx.extra,
        read: sfx.read,
        tlExtra: tlExtra,
      }),
    [sfx.def, sfx.extra, sfx.read, tlExtra],
  );

  console.log(`SFXID: ${sfx.id}, parsedData: `, parsed, `from:`, sfx, tlExtra);

  return (
    <article
      className={cn(
        "flex flex-col gap-2 rounded-lg border",
        "border-dashed border-(--regular-border)",
        "min-w-44 bg-(--sfx-card-bg)/50 px-4 py-3 shadow-sm shadow-(color:--accent-900)",
        sfx.featured && "border-3",
        dev && sfx.featured && "border-4 border-(--complement-500)",
        classNames?.container,
      )}
      aria-labelledby={titleId}
      aria-label="SFX entry"
    >
      <header
        className={cn(
          "flex-rowitems-baseline flex gap-2",
          classNames?.topinfo?.container,
        )}
      >
        <div
          className={cn(
            "self-center pr-2 text-lg font-bold",
            "text-(--sfx-text-text)",
            classNames?.topinfo?.text,
          )}
          id={titleId}
        >
          {usedSFX.text}{" "}
          {sfx.info && (
            <div className="relative -top-2 inline">
              <SFXInfoButton sfx={sfx} />
            </div>
          )}
        </div>

        {usedSFX.read && (
          <div className={cn(classNames?.topinfo?.reading)}>
            {parsed.read
              ?.filter((q) => allowedFields.includes(q.type))
              .filter((q) => !q.hidden)
              .reduce(reduceMultiIMGs, [])
              .map((read) => {
                if (Array.isArray(read)) {
                  return (
                    <MultiIMGField
                      fields={read}
                      key={`${usedSFX.id}_multiIMG_read_${read.map((q) => q.key).join("_")}`}
                    />
                  );
                }
                return (
                  <SFXFieldDiv
                    key={`${usedSFX.id}_read_${read.key}`}
                    field={read}
                    type="read"
                  />
                );
              })}
          </div>
        )}

        <div
          className={cn(
            "flex-1 text-right text-sm",
            "text-(--sfx-lang-text)",
            !Number.isFinite(sfx.id) && "text-(--sfx-lang-new-text)",
            classNames?.topinfo?.language,
          )}
        >
          {langs.find((l) => l.code === usedSFX.language)?.name}{" "}
          {dev && `[${isFinite(sfx.id) && sfx.id > 0 ? sfx.id : "NEW"}]`}
        </div>
      </header>

      {!!parsed.tlExtra?.length && (
        <section
          className={cn(
            "flex w-fit border-2 border-x-0 border-t-0 border-dashed",
            "border-(--sfx-tlextra-underline) px-1",
            "flex-col",
            classNames?.tlExtras?.container,
          )}
          aria-labelledby={titleId}
          aria-label="SFX translation info"
        >
          {parsed.tlExtra
            .filter((q) => allowedFields.includes(q.type))
            .filter((q) => !q.hidden)
            .reduce(reduceMultiIMGs, [])
            .map((field) =>
              Array.isArray(field) ? (
                <MultiIMGField
                  fields={field}
                  key={`${usedSFX.id}_multiIMG_read_${field.map((q) => q.key).join("_")}`}
                />
              ) : (
                <SFXFieldDiv
                  key={`${sfx.id}_tl_${field.key}`}
                  field={field}
                  type="tlExtra"
                  className={classNames?.tlExtras?.field}
                />
              ),
            )}
        </section>
      )}

      <section
        className={cn(classNames?.bottominfo?.container)}
        aria-labelledby={titleId}
        aria-label="SFX definition"
      >
        <div className={cn(classNames?.bottominfo?.def)}>
          {parsed.def
            ?.filter((q) => allowedFields.includes(q.type))
            .filter((q) => !q.hidden)
            .reduce(reduceMultiIMGs, [])
            .map((field) =>
              Array.isArray(field) ? (
                <MultiIMGField
                  fields={field}
                  key={`${usedSFX.id}_multiIMG_read_${field.map((q) => q.key).join("_")}`}
                />
              ) : (
                <SFXFieldDiv
                  key={`${usedSFX.id}_def_${field.key}`}
                  field={field}
                  type="def"
                />
              ),
            )}
        </div>
      </section>
      <section
        className={cn(classNames?.bottominfo?.container)}
        aria-labelledby={titleId}
        aria-label="SFX extras"
      >
        <div className={cn("pl-8", classNames?.bottominfo?.extra)}>
          {parsed.extra
            ?.filter((q) => allowedFields.includes(q.type))
            .filter((q) => !q.hidden)
            .reduce(reduceMultiIMGs, [])
            .map((field) =>
              Array.isArray(field) ? (
                <MultiIMGField
                  fields={field}
                  key={`${usedSFX.id}_multiIMG_read_${field.map((q) => q.key).join("_")}`}
                />
              ) : (
                <SFXFieldDiv
                  key={`${usedSFX.id}_extra_${field.key}`}
                  field={field}
                  type="extra"
                />
              ),
            )}
        </div>
      </section>

      {usedSFX.tls.length > 0 && (
        <>
          <section
            className={cn(
              "flex flex-wrap justify-center gap-2",
              classNames?.tls?.container,
            )}
            aria-labelledby={titleId}
            aria-label="SFX translation list"
          >
            {usedSFX.tls.map((tl) => {
              const isReversed = tl.additionalInfo?.startsWith(REVERSE_MARK);
              return (
                <TLCard
                  key={tl.sfx1Id + "." + tl.sfx2Id}
                  tl={
                    isReversed
                      ? {
                          ...tl,
                          additionalInfo: reversedTL(
                            tl.additionalInfo?.substring(1),
                          ),
                        }
                      : tl
                  }
                  dev={dev}
                  classNames={{
                    ...classNames?.tls?.sfx,
                    container: cn(
                      "flex flex-col gap-2 min-w-44 basis-[45%] grow",
                    ),
                    tlNum: "hidden",
                    default: {
                      ...classNames?.tls?.sfx?.default,
                      container: cn(
                        "border-2",
                        classNames?.tls?.sfx?.default?.container,
                        isReversed && "border-4 border-(--sfx-reversed-border)",
                      ),
                    },
                  }}
                  editable={false}
                />
              );
            })}
          </section>
        </>
      )}
    </article>
  );
};
