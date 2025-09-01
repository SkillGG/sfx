import { type CollapsedOnomatopoeia } from "@/utils";

type FieldBase = { index: number };

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

export const parseLineAsSFXField = (str: string): SFXField => {
  return { type: "string", value: str, index: -1 };
};

export const parseSFXFields = (
  data: Pick<CollapsedOnomatopoeia, "def" | "extra" | "read"> & {
    tlExtra?: string;
  },
): SFXFieldsData => {
  const fieldsData: SFXFieldsData = {};

  fieldsData.def = data.def
    .split(";")
    .map<SFXField | null>((line, i) => {
      if (!line) return null;
      return { ...parseLineAsSFXField(line), index: i + 1 };
    })
    .filter((q) => !!q);

  fieldsData.extra =
    data.extra
      ?.split(";")
      .map<SFXField | null>((line, i) => {
        if (!line) return null;
        return { ...parseLineAsSFXField(line), index: i + 1 };
      })
      .filter((q) => !!q) ?? [];

  fieldsData.read =
    data.read
      ?.split(";")
      .map<SFXField | null>((line, i) => {
        if (!line) return null;
        return { ...parseLineAsSFXField(line), index: i + 1 };
      })
      .filter((q) => !!q) ?? [];

  return fieldsData;
};
