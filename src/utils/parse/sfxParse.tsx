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
 *    -<field><index>/<revIndex> // hide <index> element from <field>. (index is relative)
 *   <Jump> // create SFXData under other SFXData group as if it was part of the original group
 *    _<field><index>:<text> // create <text> under <field>
 */

const noop = () => void 0;

export type FieldBase = {
  /** Final absolute index */
  index: number;
  hidden: boolean | number[];
  jumpedFrom?: keyof SFXFieldsData;
};

export type StringField = {
  type: "string";
  value: string;
  counter?: number;
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
  revIndices?: number[];
};

type JumpFieldData = {
  /** Relative index */
  index: number;
  to: keyof SFXFieldsData;
  data: string;
  raw: string;
};

export const stringToSFXFieldKey = (k: string): keyof SFXFieldsData => {
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
    default:
      return "tlExtra";
  }
};

type ParseResult = SFXField | HideFieldData | JumpFieldData;

type Log = Partial<Record<"LOG" | "WARN" | "ERROR", boolean>>;

const __print = (
  l: keyof Log,
  q: Log,
  inSTR: string,
  functionOverride?: typeof console.log,
) => {
  return (...r: Parameters<(typeof console)["log"]>) => {
    if (q[l]) (functionOverride ?? console.log)(...r, `in ${inSTR}`);
  };
};

/**
 * Parser for SFX Data
 */
export const Parser = {
  /** Strip all non-text data (e.g. jumps `[_d(2)]`, hide patterns `-d(1)` , images, etc.)
   *
   * Used for search purposes */
  strip(
    str?: string | null,
    leave?: (SFXField["type"] | "jump" | "jump_field" | "hide")[],
    log?: Log,
  ): string {
    const print = log ? __print("LOG", log, "Parser.strip") : noop;

    if (!str) return "";

    const arr = str.split(";");

    return arr
      .map((str) => {
        const parsed = this.parse(str.trim());

        print("Stripping!", str);

        if (this.isJump(parsed)) {
          print("jump");
          return leave?.includes("jump")
            ? str
            : leave?.includes("jump_field")
              ? parsed.data
              : "";
        }

        if (this.isHide(parsed)) {
          print("hide");
          return leave?.includes("hide") ? str : "";
        }

        if (this.isField(parsed)) {
          if (
            (["link", "sfxlink", "img"] as SFXField["type"][]).includes(
              parsed.type,
            )
          ) {
            print("non-str field");
            return leave?.includes(parsed.type) ? str : "";
          }
          if (parsed.type === "string") {
            return leave?.includes("string") ? str : parsed.value;
          }
        }

        return str;
      })
      .filter(Boolean)
      .join(";");
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
  asJump(str: string, log?: Log): JumpFieldData | null {
    const print = log ? __print("LOG", log, "asJump") : noop;
    const printErr = log
      ? __print("ERROR", log, "asJump", console.error)
      : noop;
    const rx = /^_(?<to>[a-z]+)(?<index>\d+):(?<data>.*)$/.exec(str.trim());
    if (!rx) {
      printErr(`'${str}'`, "no RX");
      return null;
    }
    const toStr = rx.groups?.to;
    if (!toStr) {
      printErr(`'${str}'`, "no to field");
      return null;
    }
    const to = stringToSFXFieldKey(toStr);
    if (!to) {
      printErr(`'${str}'`, "wrong to field");
      return null;
    }
    const idx = rx.groups?.index;
    if (!idx) {
      printErr(`'${str}'`, "no idx");
      return null;
    }
    const index = Number(idx);
    if (isNaN(index) || index < 0 || !isFinite(index)) {
      printErr(`'${str}'`, "NaN");
      return null;
    }
    const data = rx.groups?.data;
    if (!data) {
      printErr(`'${str}'`, "no data");
      return null;
    }
    print(`'${str}'`, { index: index - 1, to, data, raw: str });
    return { index: index - 1, to, data, raw: str };
  },
  /** Parse string as a {@link HideFieldData}.
   * @returns {HideFieldData} {@link HideFieldData} if parsed successfully
   * @returns {null} {@link null} if string was not a hide clause
   */
  asHide(str: string, log?: Log): HideFieldData | null {
    const print = log ? __print("LOG", log, "asHide") : noop;
    const printErr = log
      ? __print("ERROR", log, "asHide", console.error)
      : noop;
    const rx =
      /^\-(?<key>[a-z]+)(?<index>\d+)(?<revIndex>\/(?:\d+,?)*)?$/i.exec(
        str.trim(),
      );
    if (!rx) {
      printErr(`'${str}'`, "no RX");
      return null;
    }
    const key = rx.groups?.key;
    if (!key) {
      printErr(`'${str}'`, "No key");
      return null;
    }
    const index = rx.groups?.index;
    if (!index) {
      printErr(`'${str}'`, "No index");
      return null;
    }
    const i = Number(index);
    if (i <= 0 || !isFinite(i) || isNaN(i)) {
      printErr(`'${str}'`, "index NaN");
      return null;
    }
    const kKey = stringToSFXFieldKey(key);
    if (!kKey) {
      printErr(`'${str}'`, "invalid key");
      return null;
    }

    const revIndex = rx.groups?.revIndex;
    if (revIndex) {
      const revIndices = revIndex
        .substring(1)
        .split(",")
        .map(Number)
        .filter((q) => !!q)
        .map((q) => q - 1);
      print(`'${str}'`, {
        index: i - 1,
        key: kKey,
        revIndices: revIndices.length > 0 ? revIndices : [i - 1],
      });
      return {
        index: i - 1,
        key: kKey,
        revIndices: revIndices.length > 0 ? revIndices : [i - 1],
      };
    }
    print(`'${str}'`, { index: i - 1, key: kKey });
    return { index: i - 1, key: kKey };
  },
  /** Parse string as a {@link ImageField}.
   * @returns {ImageField} {@link ImageField} if parsed successfully
   * @returns {null} {@link null} if string was not a hide clause
   */
  asImage(str: string, log?: Log): ImageField | null {
    const print = log ? __print("LOG", log, "asImage") : noop;
    const printErr = log
      ? __print("ERROR", log, "asImage", console.error)
      : noop;

    const rx = /^img:(?<url>.*)$/gi.exec(str.trim());
    if (!rx?.groups?.url) {
      printErr(`${str}`, "not img syntax");
      return null;
    }

    const field: ImageField = {
      type: "img",
      url: rx.groups.url.replace(/^\@/gi, ""),
      local: rx.groups.url.startsWith("@"),
    };
    print(`${str}`, field);
    return field;
  },
  /** Parse string as a {@link LinkField}.
   * @returns {LinkField} {@link LinkField} if parsed successfully
   * @returns {null} {@link null} if string was not a hide clause
   */
  asLink(str: string, log?: Log): LinkField | null {
    const print = log ? __print("LOG", log, "asLink") : noop;
    const printErr = log
      ? __print("ERROR", log, "asLink", console.error)
      : noop;
    const rx = /^\[(?<url>https?:\/\/[^\)]*)\]\((?<label>.*?)\)/.exec(
      str.trim(),
    );

    if (!rx) {
      printErr(`'${str}'`, "no RX");
      return null;
    }

    if (!rx?.groups?.url || !rx?.groups?.label) {
      printErr(`'${str}'`, "no label or link");
      return null;
    }

    if (!z.string().url().safeParse(rx.groups.url).success) {
      printErr(`'${str}'`, "invalid url");
      return null;
    }
    const { label, url } = rx.groups;
    const field: LinkField = { type: "link", label, url };
    print(`${str}`, field);
    return field;
  },
  /** Parse string as a {@link SFXLinkField}.
   * @returns {SFXLinkField} {@link SFXLinkField} if parsed successfully
   * @returns {null} {@link null} if string was not a hide clause
   */
  asSFXLink(str: string, log?: Log): SFXLinkField | null {
    const print = log ? __print("LOG", log, "asSFXLink") : noop;
    const printErr = log
      ? __print("ERROR", log, "asSFXLink", console.error)
      : noop;
    const rx = /^sfx:(?<id>\d+)$/gi.exec(str.trim());

    if (!rx) {
      printErr(`${str}`, "no RX");
      return null;
    }

    if (!rx.groups?.id) {
      printErr(`${str}`, "no id");
      return null;
    }

    const intID = Number(rx.groups.id);

    if (isNaN(intID) || !isFinite(intID) || !Number.isInteger(intID)) {
      printErr(`${str}`, "invalid number");
      return null;
    }

    const field: SFXLinkField = {
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

    print(`${str}`, field);

    return field;
  },
  stringCounter: 0,
  asString(str: string, log?: Log): StringField {
    const print = log ? __print("LOG", log, "asString") : noop;
    const printWarn = log
      ? __print("WARN", log, "asString", console.warn)
      : noop;
    if (str.startsWith("- ") || this.stringCounter > 0) {
      printWarn(`${str}`, "counted string: ", this.stringCounter);
      this.stringCounter++;
    }

    const field: StringField = {
      type: "string",
      value: str.startsWith("- ") ? str.substring(2) : str,
      ...(this.stringCounter > 0 ? { counter: this.stringCounter } : {}),
    };

    print(`${str}`, field);

    return field;
  },
  /**
   * Parse the string as either a command ({@link JumpFieldData}/{@link HideFieldData}) or as a {@link SFXField}
   * @param str string to parse
   * @param log Log errors with console.log?
   * @returns {ParseResult} {@link ParseResult} -- A result of the parse
   */
  parse(str: string, log?: Log): ParseResult {
    const jump = this.asJump(str, log);
    if (jump) return jump;
    const hide = this.asHide(str, log);
    if (hide) return hide;
    return this.asField(str, log);
  },
  parseMultiple(str: string, separator = ";", log?: Log): ParseResult[] {
    return str.split(separator)?.map((q) => this.parse(q, log));
  },
  get fieldParsers() {
    // Use arrow functions to avoid unbound method issues
    return [
      (str: string, log?: Log) => this.asImage(str, log),
      (str: string, log?: Log) => this.asLink(str, log),
      (str: string, log?: Log) => this.asSFXLink(str, log),
    ] as const;
  },
  asField(str: string, log?: Log): SFXField {
    for (const parser of this.fieldParsers) {
      const result = parser(str, log);
      if (result) return { ...result, index: -1, hidden: false };
    }
    return { ...this.asString(str, log), index: -1, hidden: false };
  },
};

export const parseSFXFields = (
  data: Pick<CollapsedOnomatopoeia, "def" | "extra" | "read"> & {
    tlExtra?: string;
  },
  log?: Log,
): SFXFieldsData => {
  const print = log ? __print("LOG", log, "parseSFXFields") : noop;
  const printErr = log
    ? __print("ERROR", log, "parseSFXFields", console.error)
    : noop;
  const printWarn = log
    ? __print("ERROR", log, "parseSFXFields", console.warn)
    : noop;

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
    revIndices?: number[];
  }[] = [];

  forEachField((fieldKey) => {
    print("Parsing data from field: ", fieldKey);
    const dataQ = data[fieldKey];
    if (!dataQ) {
      printErr("No dataQ", fieldKey);
      return (fieldsData[fieldKey] = []);
    }

    const parseFieldData = (line: string): SFXField | null => {
      if (!line) {
        printErr("No line!", line);
        return null;
      }

      const field = Parser.parse(line, log);
      print("Parser value", field);

      if (Parser.isJump(field)) {
        if (field.to === fieldKey) {
          const parsed = Parser.asString(line, log);
          printWarn(`Same field jump error!`, line);
          return {
            ...parsed,
            index: ++index,
            hidden: false,
          };
        }
        const curCount = Parser.stringCounter;
        Parser.stringCounter = 0;
        const specialField: (typeof specialFields)[number] = {
          data: { ...Parser.asField(field.data, log), jumpedFrom: fieldKey },
          relIndex: field.index,
          key: field.to,
          onFail: {
            index: index + 1,
            key: fieldKey,
            raw: field.raw,
          },
        };
        Parser.stringCounter = curCount;
        print("Adding special field field:", specialField);
        specialFields.push(specialField);
        return null;
      }
      if (Parser.isHide(field)) {
        hideCalls.push({
          key: field.key,
          relIndex: field.index,
          revIndices: field.revIndices,
        });
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
  print(
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
        const halves = fieldData.filter((q) => q.index === obj.index); // move to the end of queues queue
        print("Halves", halves);
        fieldData.splice(i + skip + halves.length + 1, 0, obj);
        fieldData.sort((a, b) => a.index - b.index);
        if (obj.type === "string") {
          const countered = halves.filter(
            (q): q is StringField & FieldBase =>
              q.type === "string" && !!q.counter,
          );
          if (countered.length > 0) {
            const prevCounter = countered[countered.length - 1]?.counter;
            if (prevCounter) obj.counter = prevCounter + 1;
          }
        }
        print("Added obj", obj, "into field", q.key);
        print("Result: ", fieldsData);
        return;
      }
      i++;
    }
    printErr(`Failed!`);

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
      printErr(
        `Did not find any field withh index ${q.onFail.index}! Pushing `,
        obj,
      );
      failedField.push(obj);
      reindex(q.onFail.index);
    }
  });

  // hide
  for (const hideCall of hideCalls) {
    const { key, relIndex } = hideCall;
    const f = fieldsData[key];
    if (!f) continue;

    const obj = f.find((_, i) => i === relIndex);
    if (obj) {
      const hideValue = hideCall.revIndices ?? true;
      const children = f.filter((q) =>
        obj.index % 1 === 0 ? q.index === obj.index + 0.5 : false,
      );
      children.forEach((c) => (c.hidden = hideValue));
      obj.hidden = hideValue;
    }
  }

  return fieldsData;
};
