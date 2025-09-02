import { type CollapsedOnomatopoeia } from "@/utils";

type FieldBase = { index: number; hidden: boolean };

export type SFXField = FieldBase &
  (
    | {
        type: "string";
        value: string;
        counter?: number;
        classNames?: string;
      }
    | { type: "img"; url: string }
  );

export type SFXFieldsData = {
  def?: SFXField[];
  extra?: SFXField[];
  tlExtra?: SFXField[];
  read?: SFXField[];
};

type RemoveLineData = {
  index: number;
  key: keyof SFXFieldsData;
};

type JumpLineData = {
  index: number;
  to: keyof SFXFieldsData;
};

export const stringToSFXFieldKey = (k: string): keyof SFXFieldsData | null => {
  switch (k) {
    case "d":
    case "def":
    case "definition":
      return "def";
    case "e":
    case "extra":
    case "ex":
      return "extra";
    case "r":
    case "read":
      return "read";
  }
  return null;
};

export const parseLineAsJump = (str: string): JumpLineData | null => {
  const rx = /^\[_(?<to>[a-z]+)\((?<index>\d+)\)\]$/.exec(str);
  if (!rx) return null;
  const toStr = rx.groups?.to;
  if (!toStr) return null;
  const to = stringToSFXFieldKey(toStr);
  if (!to) return null;
  const idx = rx.groups?.index;
  if (!idx) return null;
  const index = Number(idx);
  if (isNaN(index) || index < 0 || !isFinite(index)) return null;
  return { index, to };
};

export const parseRemoveLine = (str: string): RemoveLineData | null => {
  const rx = /^\-(?<key>[a-z]+)\((?<index>\d+)\)$/i.exec(str);
  if (!rx) return null;
  const key = rx.groups?.key;
  if (!key) return null;
  const index = rx.groups?.index;
  if (!index) return null;
  const i = Number(index);
  if (i <= 0 || !isFinite(i) || isNaN(i)) return null;
  const kKey = stringToSFXFieldKey(key);
  if (!kKey) return null;
  return { index: i, key: kKey };
};

export const parseLineAsSFXField = (str: string): SFXField => {
  return { type: "string", value: str, index: -1, hidden: false };
};

export const parseSFXFields = (
  data: Pick<CollapsedOnomatopoeia, "def" | "extra" | "read"> & {
    tlExtra?: string;
  },
): SFXFieldsData => {
  const fieldsData: SFXFieldsData = {};

  let index = 0;

  const specialIndices: {
    key: keyof SFXFieldsData;
    index: number;
    newIndex: number;
  }[] = [];

  fieldsData.read =
    data.read
      ?.split(";")
      .map<SFXField | null>((line) => {
        if (!line) return null;

        const jump = parseLineAsJump(line);

        if (jump) {
          // TODO: figure this out
          return null;
        }

        const parsed = parseLineAsSFXField(line);
        return { ...parsed, index: parsed.index < 0 ? ++index : parsed.index };
      })
      .filter((q) => !!q) ?? [];

  fieldsData.def = data.def
    .split(";")
    .map<SFXField | null>((line) => {
      if (!line) return null;
      const parsed = parseLineAsSFXField(line);
      return { ...parsed, index: parsed.index < 0 ? ++index : parsed.index };
    })
    .filter((q) => !!q);

  fieldsData.extra =
    data.extra
      ?.split(";")
      .map<SFXField | null>((line) => {
        if (!line) return null;
        const parsed = parseLineAsSFXField(line);
        return { ...parsed, index: parsed.index < 0 ? ++index : parsed.index };
      })
      .filter((q) => !!q) ?? [];

  fieldsData.tlExtra =
    data.tlExtra
      ?.split(";")
      .map<SFXField | null>((line) => {
        if (!line) return null;
        const isRemoveLine = parseRemoveLine(line);
        if (isRemoveLine) {
          const data = fieldsData[isRemoveLine.key]?.find(
            (_, i) => i + 1 === isRemoveLine.index,
          );
          if (data) data.hidden = true;
          return null;
        }
        const parsed = parseLineAsSFXField(line);
        return {
          ...parsed,
          index: parsed.index < 0 ? ++index : parsed.index,
        };
      })
      .filter((q) => !!q) ?? [];

  return fieldsData;
};
