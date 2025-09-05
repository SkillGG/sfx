import { type api as serverApi } from "@/trpc/server";
import { type api as clientApi } from "@/trpc/react";
import { type CollapsedOnomatopoeia } from "@/utils/utils";
import z from "zod";
/**
 * Syntax:
 *
 *  (<SFXData> | <Jump> | <Hide>)
 * where:
 *  <SFXData> may be:
 *    sfx:<number> //
 *    <text> // string node
 *  <Hide> // hides element
 *    -<field>(<index>) // hide <index> element from <field>. (index is relative)
 *   <Jump> // create SFXData under other SFXData group as if it was part of the original group
 *    [_<field>(<index>)]<text> // create <text> under <field>
 */

const noop = () => void 0;

export type FieldBase = {
  /** Final absolute index */
  index: number;
  hidden: boolean;
};

export type StringField = {
  type: "string";
  value: string;
  counter?: number;
  classNames?: string;
};
export type ImageField = { type: "img"; url: string; local: boolean };

export type LinkField = { type: "link"; url: string; label: string };

type Api = typeof clientApi | typeof serverApi;

export type SFXLinkField = {
  type: "sfxlink";
  id: number;
  consume?: (api: Api) => Promise<{ id: number; label: string } | null>;
};

export type SFXField = FieldBase &
  (StringField | ImageField | LinkField | SFXLinkField);

export type SFXFieldsData = {
  def?: SFXField[];
  extra?: SFXField[];
  tlExtra?: SFXField[];
  read?: SFXField[];
};

export const SFXFieldsKeys: (keyof SFXFieldsData)[] = [
  "read",
  "def",
  "extra",
  "tlExtra",
];
const forEachField = (cb: (o: keyof SFXFieldsData) => void) =>
  SFXFieldsKeys.forEach(cb);

type HideFieldData = {
  /** Relative index */
  index: number;
  key: keyof SFXFieldsData;
};

type JumpFieldData = {
  /** Relative index */
  index: number;
  to: keyof SFXFieldsData;
  data: string;
  raw: string;
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

type ParseResult = SFXField | HideFieldData | JumpFieldData;

/**
 * Parser for SFX Data
 */
export const Parser = {
  /** Strip all non-text data (e.g. jumps `[_d(2)]`, hide patterns `-d(1)` , images, etc.)
   *
   * Used for search purposes */
  strip(str?: string | null): string {
    if (!str) return "";

    const parsed = this.parse(str.trim());

    if (this.isJump(parsed)) {
      return parsed.data;
    }

    if (this.isHide(parsed)) return "";

    if (this.isField(parsed)) {
      if (
        (["link", "sfxlink", "img"] as SFXField["type"][]).includes(parsed.type)
      )
        return "";
    }

    return str;
  },
  /** Tests if {@link Parser.parse} resulted in a {@link JumpFieldData} */
  isJump(o: ParseResult): o is JumpFieldData {
    return "to" in o;
  },
  /** Tests if {@link Parser.parse} resulted in a {@link HideFieldData} */
  isHide(o: ParseResult): o is HideFieldData {
    return "key" in o;
  },
  /** Tests if {@link Parser.parse} resulted in a {@link SFXField} */
  isField(o: ParseResult): o is SFXField {
    return "type" in o;
  },
  /** Parse string as a {@link JumpFieldData}.
   * @returns {JumpFieldData} {@link JumpFieldData} if parsed successfully
   * @returns {null} {@link null} if string was not a jump clause
   */
  asJump(str: string, log = false): JumpFieldData | null {
    const print = log ? console.log : noop;
    const rx = /^\[_(?<to>[a-z]+)\((?<index>\d+)\)\](?<data>.*)$/.exec(
      str.trim(),
    );
    if (!rx) {
      print(`'${str}'`, "no RX", " in asJump");
      return null;
    }
    const toStr = rx.groups?.to;
    if (!toStr) {
      print(`'${str}'`, "no to field", " in asJump");
      return null;
    }
    const to = stringToSFXFieldKey(toStr);
    if (!to) {
      print(`'${str}'`, "wrong to field", " in asJump");
      return null;
    }
    const idx = rx.groups?.index;
    if (!idx) {
      print(`'${str}'`, "no idx", " in asJump");
      return null;
    }
    const index = Number(idx);
    if (isNaN(index) || index < 0 || !isFinite(index)) {
      print(`'${str}'`, "NaN", " in asJump");
      return null;
    }
    const data = rx.groups?.data;
    if (!data) {
      print(`'${str}'`, "no data", " in asJump");
      return null;
    }
    return { index: index - 1, to, data, raw: str };
  },
  /** Parse string as a {@link HideFieldData}.
   * @returns {HideFieldData} {@link HideFieldData} if parsed successfully
   * @returns {null} {@link null} if string was not a hide clause
   */
  asHide(str: string, log = false): HideFieldData | null {
    const print = log ? console.log : noop;
    const rx = /^\-(?<key>[a-z]+)\((?<index>\d+)\)$/i.exec(str.trim());
    if (!rx) {
      print(`'${str}'`, "no RX", " in asHide");
      return null;
    }
    const key = rx.groups?.key;
    if (!key) {
      print(`'${str}'`, "No key", " in asHide");
      return null;
    }
    const index = rx.groups?.index;
    if (!index) {
      print(`'${str}'`, "No index", " in asHide");
      return null;
    }
    const i = Number(index);
    if (i <= 0 || !isFinite(i) || isNaN(i)) {
      print(`'${str}'`, "index NaN", " in asHide");
      return null;
    }
    const kKey = stringToSFXFieldKey(key);
    if (!kKey) {
      print(`'${str}'`, "invalid key", " in asHide");
      return null;
    }
    print(`'${str}'`, { index: i - 1, key: kKey }, " in asHide");
    return { index: i - 1, key: kKey };
  },
  /** Parse string as a {@link ImageField}.
   * @returns {ImageField} {@link ImageField} if parsed successfully
   * @returns {null} {@link null} if string was not a hide clause
   */
  asImage(str: string, log?: boolean): ImageField | null {
    const print = log ? console.log : noop;

    const rx = /^img:(?<url>.*)$/gi.exec(str.trim());
    if (!rx?.groups?.url) {
      print(`${str}`, "not img syntax", `in asImage`);
      return null;
    }

    return {
      type: "img",
      url: rx.groups.url.replace(/^\@/gi, ""),
      local: rx.groups.url.startsWith("@"),
    };
  },
  /** Parse string as a {@link LinkField}.
   * @returns {LinkField} {@link LinkField} if parsed successfully
   * @returns {null} {@link null} if string was not a hide clause
   */
  asLink(str: string, log = false): LinkField | null {
    const print = log ? console.log : noop;
    const rx = /^\[(?<url>https?:\/\/[^\)]*)\]\((?<label>.*?)\)/.exec(
      str.trim(),
    );

    if (!rx) {
      print(`'${str}'`, "no RX", " in asLink");
      return null;
    }

    if (!rx?.groups?.url || !rx?.groups?.label) {
      print(`'${str}'`, "no label or link", " in asLink");
      return null;
    }

    if (!z.string().url().safeParse(rx.groups.url).success) {
      print(`'${str}'`, "invalid url", " in asLink");
      return null;
    }
    const { label, url } = rx.groups;
    return { type: "link", label, url };
  },
  /** Parse string as a {@link SFXLinkField}.
   * @returns {SFXLinkField} {@link SFXLinkField} if parsed successfully
   * @returns {null} {@link null} if string was not a hide clause
   */
  asSFXLink(str: string, log = false): SFXLinkField | null {
    const print = log ? console.log : noop;
    const rx = /^sfx:(?<id>\d+)$/gi.exec(str.trim());

    if (!rx) {
      print(`${str}`, "no RX", " in asSFXLink");
      return null;
    }

    if (!rx.groups?.id) {
      print(`${str}`, "no id", " in asSFXLink");
      return null;
    }

    const intID = Number(rx.groups.id);

    if (isNaN(intID) || !isFinite(intID) || !Number.isInteger(intID)) {
      print(`${str}`, "invalid number", " in asSFXLink");
      return null;
    }

    return {
      id: intID,
      type: "sfxlink",
      consume: async (api) => {
        let result: CollapsedOnomatopoeia[] = [];
        if ("useUtils" in api) {
          // clientApi
          result = await api.useUtils().sfx.listSFX.fetch({ id: intID });
        } else {
          //serverApi;
          result = await api.sfx.listSFX({ id: intID });
        }

        if (result.length > 0 && result[0]) {
          return { id: result[0].id, label: result[0].text };
        }

        return null;
      },
    };
  },
  stringCounter: 0,
  asString(str: string): StringField {
    if (str.startsWith("- ")) {
      this.stringCounter++;
    }

    return {
      type: "string",
      value: str,
      ...(this.stringCounter > 0 ? { counter: this.stringCounter } : {}),
    };
  },
  /**
   * Parse the string as either a command ({@link JumpFieldData}/{@link HideFieldData}) or as a {@link SFXField}
   * @param str string to parse
   * @param log Log errors with console.log?
   * @returns {ParseResult} {@link ParseResult} -- A result of the parse
   */
  parse(str: string, log = false): ParseResult {
    const jump = this.asJump(str, log);
    if (jump) return jump;
    const hide = this.asHide(str, log);
    if (hide) return hide;
    return this.asField(str, log);
  },
  get fieldParsers() {
    // Use arrow functions to avoid unbound method issues
    return [
      (str: string, log?: boolean) => this.asImage(str, log),
      (str: string, log?: boolean) => this.asLink(str, log),
      (str: string, log?: boolean) => this.asSFXLink(str, log),
    ] as const;
  },
  asField(str: string, log = false): SFXField {
    for (const parser of this.fieldParsers) {
      const result = parser(str, log);
      if (result) return { ...result, index: -1, hidden: false };
    }
    return { ...this.asString(str), index: -1, hidden: false };
  },
};

export const parseSFXFields = (
  data: Pick<CollapsedOnomatopoeia, "def" | "extra" | "read"> & {
    tlExtra?: string;
  },
  log?: boolean,
): SFXFieldsData => {
  const print = log ? console.log : noop;

  const fieldsData: SFXFieldsData = {};

  let index = 0;

  const specialFields: {
    key: keyof SFXFieldsData;
    data: SFXField;
    /** Relative index of parent field  */
    relIndex: number;

    onFail: {
      index: number;
      raw: string;
      key: keyof SFXFieldsData;
    };
  }[] = [];

  const hideCalls: {
    key: keyof SFXFieldsData;
    relIndex: number;
  }[] = [];

  forEachField((fieldKey) => {
    print("Parsing data from field: ", fieldKey);
    const dataQ = data[fieldKey];
    if (!dataQ) {
      print("No dataQ", fieldKey);
      return (fieldsData[fieldKey] = []);
    }

    const parseFieldData = (line: string): SFXField | null => {
      if (!line) {
        print("No line!", line);
        return null;
      }

      const field = Parser.parse(line, log);
      print("Parser value", field);

      if (Parser.isJump(field)) {
        if (field.to === fieldKey) {
          const parsed = Parser.asString(line);
          print(`Same field jump error!`, line);
          return {
            ...parsed,
            index: ++index,
            hidden: false,
          };
        }
        const specialField: (typeof specialFields)[number] = {
          data: Parser.asField(field.data),
          relIndex: field.index,
          key: field.to,
          onFail: {
            index: index + 1,
            key: fieldKey,
            raw: field.raw,
          },
        };
        print("Adding special field field:", specialField);
        specialFields.push(specialField);
        return null;
      }
      if (Parser.isHide(field)) {
        hideCalls.push({ key: field.key, relIndex: field.index });
        return null;
      }
      return { ...field, index: ++index };
    };

    fieldsData[fieldKey] = data[fieldKey]
      ?.split(";")
      .map<SFXField | null>(parseFieldData)
      .filter((q) => !!q);
    Parser.stringCounter = 0;
  });

  if (log)
    console.log(
      "Going into special field sorting:\n",
      "fields:",
      fieldsData,
      "\n",
      "special:",
      specialFields,
    );

  specialFields.forEach((q) => {
    print("Sorting out special field: ", q);
    const fieldData = fieldsData[q.key];
    if (!fieldData) return;

    let i = 0;
    let skip = 0;
    print(`Looking in ${q.key}`);
    for (const field of fieldData) {
      if (field.index % 1 !== 0) {
        skip++;
        continue;
      }
      if (i === q.relIndex) {
        const obj = { ...q.data, index: field.index + 0.5 };
        fieldData.splice(i + skip + 1, 0, obj);
        fieldData.sort((a, b) => a.index - b.index);
        print("Added obj", obj, "into field", q.key);
        print("Result: ", fieldsData);
        return;
      }
      i++;
    }
    print(`Failed!`);

    // fail crunch, add back to field

    const failedField = fieldsData[q.onFail.key];
    if (!failedField) return;

    const reindex = (n: number) => {
      print("Reindexing everything above or equal", n);
      forEachField((fieldKey) => {
        const dataQ = fieldsData[fieldKey];
        if (!dataQ) return;
        dataQ.forEach((field) => {
          field.index = Math.abs(
            field.index >= n ? field.index + 1 : field.index,
          );
        });
      });
      specialFields.forEach((q) => q.onFail.index++);
      print("After reindex", fieldsData, specialFields);
    };

    i = -1;
    let found = false;
    const obj: SFXField = {
      hidden: q.data.hidden,
      type: "string",
      value: q.onFail.raw,
      index: -q.onFail.index,
    };
    for (const field of failedField) {
      i++;
      if (found) continue;
      if (field.index === q.onFail.index) {
        failedField.splice(i, 1, ...[obj, field]);
        print(`Added `, obj, ` before `, field);
        reindex(q.onFail.index);
        found = true;
      }
    }

    if (!found) {
      print(
        `Did not find any field withh index ${q.onFail.index}! Pushing `,
        obj,
      );
      failedField.push(obj);
      reindex(q.onFail.index);
    }
  });

  // hide
  for (const { key, relIndex } of hideCalls) {
    const f = fieldsData[key];
    if (!f) continue;

    const obj = f.find((_, i) => i === relIndex);
    if (obj) {
      const children = f.filter((q) =>
        obj.index % 1 === 0 ? q.index === obj.index + 0.5 : false,
      );
      children.forEach((c) => (c.hidden = true));
      obj.hidden = true;
    }
  }

  return fieldsData;
};
