import { type CollapsedOnomatopoeia } from "@/utils/utils";
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

type FieldBase = {
  /** Final absolute index */
  index: number;
  hidden: boolean;
};

type StringField = {
  type: "string";
  value: string;
  counter?: number;
  classNames?: string;
};
type ImageField = { type: "img"; url: string; local: boolean };

export type SFXField = FieldBase & (StringField | ImageField);

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

type RemoveLineData = {
  /** Relative index */
  index: number;
  key: keyof SFXFieldsData;
};

type JumpLineData = {
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

type ParseResult = SFXField | RemoveLineData | JumpLineData;

export const Parser = {
  strip(str?: string | null): string {
    if (!str) return "";

    const parsed = this.parse(str);

    if (this.isJump(parsed)) {
      return parsed.data;
    }

    if (this.isHide(parsed)) return "";

    return str;
  },
  isJump(o: ParseResult): o is JumpLineData {
    return "to" in o;
  },
  isHide(o: ParseResult): o is RemoveLineData {
    return "key" in o;
  },
  isField(o: ParseResult): o is SFXField {
    return "type" in o;
  },
  asJump(str: string, log = false): JumpLineData | null {
    const print = log ? console.log : noop;
    const rx = /^\[_(?<to>[a-z]+)\((?<index>\d+)\)\](?<data>.*)$/.exec(str);
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
  asHide(str: string, log = false): RemoveLineData | null {
    const print = log ? console.log : noop;
    const rx = /^\-(?<key>[a-z]+)\((?<index>\d+)\)$/i.exec(str);
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
  asImage(str: string, log?: boolean): ImageField | null {
    const print = log ? console.log : noop;

    const rx = /^img:(?<url>.*)$/gi.exec(str);
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
  asString(str: string): StringField {
    return { type: "string", value: str };
  },
  parse(str: string, log = false): ParseResult {
    const jump = this.asJump(str, log);
    if (jump) return jump;
    const hide = this.asHide(str, log);
    if (hide) return hide;
    return this.asField(str);
  },
  asField(str: string, log = false): SFXField {
    const img = this.asImage(str, log);

    if (img) return { ...img, index: -1, hidden: false };

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

  print("Result:", fieldsData);

  return fieldsData;
};
