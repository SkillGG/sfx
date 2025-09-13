import React, { Suspense, type ReactNode } from "react";
import { Spinner } from "../spinner";
import { cn, type CollapsedOnomatopoeia } from "@/utils/utils";
import SFXLink from "./sfxLink";
import { LocalImg } from "./localImg";
import type { ClassValue } from "clsx";
import type { SFXClasses } from "./index";

export type SaveState = "default" | "done" | "waiting";

export type SFXTLDiscriminator = { sfx: CollapsedOnomatopoeia };

export type SFXCardClasses = {
  container?: ClassValue;
  topinfo?: {
    container?: ClassValue;
    text?: ClassValue;
    reading?: ClassValue;
    language?: ClassValue;
  };
  bottominfo?: {
    container?: ClassValue;
    def?: ClassValue;
    extra?: ClassValue;
  };
  tls?: {
    container?: ClassValue;
    sfx?: SFXClasses;
  };
  tlExtras?: {
    container?: ClassValue;
    field?: ClassValue;
  }
};

export type SFXField =
  | {
      type: "string";
      data: string;
    }
  | { type: "img"; data: string }
  | { type: "sfxlink"; data: number }
  | { type: "link"; data: string };

const isSFXFieldType = (str: string): str is SFXField["type"] => {
  return (
    str === "string" || str === "img" || str === "sfxlink" || str === "link"
  );
};

export type SFXFieldData<T extends SFXField["type"]> = T extends "sfxlink"
  ? number
  : string;

export type Arrayable<T> = T | T[];

export function getEvery<T = string>(
  regx: RegExp,
  str: string,
  customParse?:
    | { loop: (rxr: RegExpExecArray) => Arrayable<T> }
    | { data: (str: string) => T },
) {
  const ret: (T | string)[] = [];
  const mStr = `${str}`;
  let result = regx.exec(mStr);
  do {
    if (!result) break;
    if (customParse && "loop" in customParse) {
      const pRes = customParse.loop(result);
      if (Array.isArray(pRes)) ret.push(...pRes);
      else ret.push(pRes);
      result = regx.exec(str);
      continue;
    }
    if (!!result[1]) {
      ret.push(
        customParse && "data" in customParse
          ? customParse.data(result[1])
          : result[1],
      );
    }
    result = regx.exec(str);
  } while (!!result);

  return ret;
}

export const getEveryField = <T extends SFXField["type"]>(
  regx: RegExp,
  str: string,
  field: T,
  customParse?:
    | { loop: (rxr: RegExpExecArray) => Arrayable<SFXField> }
    | { data: (str: string) => SFXFieldData<T> },
): SFXField[] => {
  const ret: SFXField[] = [];
  const mStr = `${str}`;
  let result = regx.exec(mStr);
  do {
    if (!result) break;
    if (customParse && "loop" in customParse) {
      const pRes = customParse.loop(result);
      if (Array.isArray(pRes)) ret.push(...pRes);
      else ret.push(pRes);
      result = regx.exec(str);
      continue;
    }
    if (!!result[1]) {
      ret.push({
        type: field,
        data:
          customParse && "data" in customParse
            ? customParse.data(result[1])
            : result[1],
      } as SFXField);
    }
    result = regx.exec(str);
  } while (!!result);

  return ret;
};

export const sfxFieldFromString = (str: string): Arrayable<SFXField | null> => {
  const imgArray: SFXField[] = getEveryField(
    /(img:(?<img>.+))|(imgs:\[(?<imgs>[^,]+,?(?:[^,]+,?)+)\])/gi,
    str,
    "img",
    {
      loop(imgRegexResult) {
        if (!!imgRegexResult.groups?.img) {
          return { type: "img", data: imgRegexResult.groups.img };
        }
        if (!!imgRegexResult.groups?.imgs) {
          return imgRegexResult.groups.imgs.split(",").map<SFXField>((data) => {
            return { data, type: "img" };
          });
        }
        return [];
      },
    },
  );

  if (imgArray.length > 0) {
    return imgArray;
  }

  const sfxArray: SFXField[] = getEveryField(/sfx:(\d+)/gi, str, "sfxlink", {
    data: Number,
  });

  if (sfxArray.length > 0) {
    return sfxArray;
  }

  return { type: "string", data: str };
};

type ExtraFieldData = Record<
  string,
  {
    raw: string;
    hide: { type: SFXField["type"]; index: number[] }[];
  }
>;

export const parseExtraFieldData = (str: string): ExtraFieldData | null => {
  if (!str) return null;

  const hides = getEvery(
    /\-(?<type>.+?):\[(?<field>.+?)\](?<ids>(?:\d+,?)+);?/gi,
    str,
    {
      loop(res) {
        const ret = [];

        const r1 = res.groups?.type;
        if (!r1) return [];
        const r2 = res.groups?.field;
        if (!r2) return [];
        const r3 = res.groups?.ids;
        if (!r3) return [];

        const ids = r3
          .split(",")
          .map(Number)
          .filter((z) => !isNaN(z) && isFinite(z));

        if (ids.length > 0 && isSFXFieldType(r2)) {
          ret.push({
            type: r1,
            raw: res[0] ?? "",
            hide: [{ type: r2, index: ids }],
          });
        }

        return ret;
      },
    },
  );
  const obj = hides.reduce<ExtraFieldData>((prev, next) => {
    if (typeof next === "string") return prev;

    return { ...prev, [next.type]: { raw: next.raw, hide: next.hide } };
  }, {});

  const extraData = {
    tlExtra: {
      raw: hides.reduce<string>((p, n) => {
        if (typeof n === "string") return p;
        return p.replace(n.raw, "").trim();
      }, str),
      hide: [],
    },
    ...obj,
  };

  return extraData;
};

export const parseSFXText = (
  key: string,
  str?: string | null,
  extra?: { field: string; data: ExtraFieldData },
): ReactNode => {
  if (!str) {
    if (extra) {
      return extra.data[extra.field]?.raw;
    }
    return null;
  }

  const thisExtra = extra?.data[extra.field];

  const fields: SFXField[] =
    str
      ?.split(";")
      .map((fieldstr) => {
        return sfxFieldFromString(fieldstr);
      })
      .flat(1)
      .filter((q) => !!q) ?? [];

  const sfxLinkFields = fields.filter((q) => q.type == "sfxlink");

  return (
    <React.Fragment key={key}>
      {fields
        .filter((q) => q.type === "string")
        .filter(
          (_, i) =>
            !thisExtra?.hide.some(
              (q) => q.type === "string" && q.index.includes(i),
            ),
        )
        .map((q, i, arr) => {
          return (
            <React.Fragment key={`${key}_${q.data}`}>
              {arr[0]?.data.startsWith("- ") && `${i + 1}. `}
              {i === 0 && q.data.startsWith("- ")
                ? q.data.substring(1)
                : q.data}
              {"\n"}
            </React.Fragment>
          );
        })}
      {sfxLinkFields.length > 0 && (
        <>
          See also:
          {sfxLinkFields
            .reduce<number[]>((arr, q) => [...arr, q.data], [])
            .map((q) => {
              return (
                <SFXLink
                  key={`${key}_sfx_link_${q}`}
                  id={q}
                  className={cn("mx-1")}
                />
              );
            })}
        </>
      )}
      <div className={cn("mt-1 flex justify-around gap-2")}>
        {fields
          .filter((q) => q.type === "img")
          .map((q, i) => {
            const alt = `Example #${i + 1}`;
            const img = (
              <Suspense
                key={`${key}_img_${q.data}`}
                fallback={<Spinner className={cn("h-[75px] w-[75px]")} />}
              >
                {q.data.startsWith("@") ? (
                  <LocalImg alt={alt} filename={q.data.substring(1)} />
                ) : (
                  <LocalImg
                    alt={alt}
                    filename={q.data}
                    nonDB={<Spinner className={cn("h-[75px] w-[75px]")} />}
                  />
                )}
              </Suspense>
            );

            return img;
          })}
      </div>
    </React.Fragment>
  );
};
