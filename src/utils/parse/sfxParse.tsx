import { type api as serverApi } from "@/trpc/server";
import { type api as clientApi } from "@/trpc/react";
import { type CollapsedOnomatopoeia } from "@/utils/utils";
import z from "zod";
/**
 * Syntax:
 *
 *   (<SFXData> | <Jump> | <Hide>)
 *
 * where:
 *   <SFXData> may be:
 *     sfx:<number>         // SFX link node, e.g. sfx:1
 *     <text>               // plain string node, e.g. Hello!
 *
 *   <Hide>                 // hides element
 *     -<field><index>/<revIndex>
 *       // hide the <index>th element from <field> (indexing starts at 1, calculated AFTER jumps)
 *       // The value after the slash (`/<n>`) specifies which element in the *translated* field
 *       // (i.e., the bottom SFX after reversal) should also be hidden.
 *       // If no slash `/` is present, only original SFX's field is hidden. (e.g. `1` is the same as `1/0`)
 *       // If the slash is present but no value is given copy the index value (e.g. `1/` is the same as `1/1`).
 *       // If `/0` is given, it is equivalent to just `<index>`.
 *       // If the left index is `0`, nothing is hidden in the original; `0/<n>` hides ONLY in the
 *       // reversed/translated list, while `0/` is the same as `0/0` (no-op).
 *       // Examples:
 *       //   -read2      (hide the 2nd element in the "read" field; does not hide any in the translated field)
 *       //   -read2/     (hide the 2nd element in the "read" field; in the translated field, also hide the 2nd child)
 *       //   -read2/2    (hide the 2nd element in the "read" field; in the translated field, also hide the 2nd child)
 *       //   -read2/0    (hide the 2nd element in the "read" field; `/0` is the same as just `2`, so no effect in translated)
 *       //   -read0/2    (hide ONLY in the reversed/translated view: hide the 2nd child there; original is unchanged)
 *       //   -read0/     (no-op; same as `-read0/0`)
 *
 *
 *   <Jump>                 // create SFXData under other SFXData group as if it was part of the original group
 *     _<field><index>:<SFXData>
 *       // create <SFXData> under <field> as if it was from other field
 *       // e.g. _def2:sfx:5  (put sfx:5 as if it was the 2nd element in the "def" field)
 *
 * Examples:
 *
 *   // 1. Simple SFX link
 *   sfx:1
 *
 *   // 2. Multiple SFX links (default label)
 *   sfx:1,2,3
 *
 *   // 3. SFX link with custom label and multiple ids
 *   sfx[See also:]:2,3
 *
 *   // 4. SFX link with custom label and multiple ids
 *   sfx[Related]:4,5,6
 *
 *   // 5. Plain string node
 *   Hello world!
 *
 *   // 6. Hide the second element in the "read" field (original only)
 *   -read2
 *
 *   // 6b. Hide the second element in the "read" field in BOTH original and reversed
 *   -read2/2
 *
 *   // 6c. Hide ONLY in the reversed one (do not hide in original); hide the 2nd in reversed
 *   -read0/2
 *
 *   // 6d. No-op example; hides nothing (same as `-read0/0`)
 *   -read0/
 *
 *   // 6e. Hide the second element in the "read" field; same as `-read2`
 *   -read2/0
 *
 *   // 7. Jump: put "sfx:7" as if it was the 3rd element in the "def" field
 *   _def3:sfx:7
 *
 *   // 8. Jump with string node
 *   _read2:Extra info
 *
 *   // 9. Image field (local and external)
 *   img:@cat.png
 *   img:https://example.com/cat.png
 *
 *   // 10. Link field
 *   [https://example.com](Example Site)
 *
 *   // 11. Mixed example
 *   Hello; sfx:1; _def2:sfx:3; -read1/2
 */

const noop = () => void 0;

/** {@link SFXField} base properties */
export type FieldBase = {
  /** Final absolute index */
  index: number;
  /** Should be displayed, if an array: saved the reverseIndexes to hide  */
  hidden: boolean | number[];
  jumpedFrom?: keyof SFXFieldsData;
  key: string;
};

/** Standard string field. If first string in line starts with `- ` every subsequent string will be prepended with `#. ` */
export type StringField = {
  type: "string";
  value: string;
  counter?: number;
};

/** A field showing an image
 *
 * local img syntax: `img:@FILENAME`
 * external img syntax: `img:link/to/img`
 */
export type ImageField = { type: "img"; url: string; local: boolean };

/** A field showing a link to an external site
 *
 * syntax: `[link](label)`
 */
export type LinkField = { type: "link"; url: string; label: string };

type Api = typeof clientApi | typeof serverApi;

/** A link to another sfx within the app (with default label: `See also: `)
 *
 * syntax: `sfx[<label>]:<sfxList>`
 *
 * sfxlist - a `,` separated list of IDS
 *
 *  label - (optional) a label shhown before the list of ids
 */
export type SFXLinkField = {
  type: "sfxlink";
  /** ID of the link */
  ids: number[];
  /** A function to get the SFX from the API */
  consume?: (api: Api) => Promise<{ id: number; label: string }[] | null>;
  /** A custom label before the sfx list */
  label?: string;
};

/** A SFXField is a single SFX data line. It can either contain a link, text or an image */
export type SFXField = FieldBase &
  (StringField | ImageField | LinkField | SFXLinkField);

/** And SFXField that can have multilpe Images. Used to reduce multiple {@link ImageField}s next to each other into one field */
export type SFXFieldWithMultiIMG =
  | (FieldBase & (StringField | ImageField | LinkField | SFXLinkField))
  | (FieldBase & ImageField)[];

/** SFXField data for all 4 of SFX's data types */
export type SFXFieldsData = {
  def?: SFXField[];
  extra?: SFXField[];
  tlExtra?: SFXField[];
  read?: SFXField[];
};

export const SFXDataTypeKeys: (keyof SFXFieldsData)[] = [
  "read",
  "def",
  "extra",
  "tlExtra",
];
const forEachType = (cb: (o: keyof SFXFieldsData) => void) =>
  SFXDataTypeKeys.forEach(cb);

/** Hide Field */
type HideFieldData = {
  /** Relative index */
  index: number[];
  /** Key of the field type to hide */
  fieldKey: keyof SFXFieldsData;
  /** reverse indices to hide */
  revIndices?: number[];
};

type JumpFieldData = {
  /** Relative index */
  index: number;
  /** Which field type to jump to */
  to: keyof SFXFieldsData;
  /** The SFXField's text */
  data: string;
  /** Raw data shown when jump fails */
  raw: string;
};

/** Get field type key from (possibly abbreviated) string */
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

/** Result of a single SFX data line */
type ParseResult = SFXField | HideFieldData | JumpFieldData;

/** {@link Parser}'s Log status. Decides which logs to show.
 *
 * @example { LOG: true, WARN: true } - console.logs LOGs and WARNs.
 * @default {}
 */
type Log = Partial<Record<"LOG" | "WARN" | "ERROR", boolean>>;

/** Console.log function that logs only if {@link Log} of the type is turned on
 *
 * @example const print = log ? __print("LOG", log, "in <funtion>") : noop;
 * const printErr = log ? __print("ERROR", log, "in <function>", console.error) : noop;
 */
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
  /** Strip all non-text data (e.g. jumps `[_d(2)]`, hide patterns `-d(1)` , images, etc.) */
  strip(
    str?: string | null,
    /** Which field types to OMMIT */
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
    return "fieldKey" in o;
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
      /^\-(?<key>[a-z]+)(?<index>(?:\d+,?)+)(?<revIndex>\/(?:\d+,?)*)?$/i.exec(
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
    const indices = index?.split(",").map(Number).filter(i=>{
      return !(i <= 0 || !isFinite(i) || isNaN(i));
    });

    if(indices.length === 0){
      printErr(`'${str}'`, "no valid indices to hide!");
    }

    const reducedIndices = indices.map(q=>q-1);

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
        index: reducedIndices,
        key: kKey,
        revIndices: revIndices.length > 0 ? revIndices : reducedIndices,
      });
      return {
        index: reducedIndices,
        fieldKey: kKey,
        revIndices: revIndices.length > 0 ? revIndices : reducedIndices,
      };
    }
    print(`'${str}'`, { index: reducedIndices, key: kKey });
    return { index: reducedIndices, fieldKey: kKey };
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
    const rx = /^sfx(?:\[(?<label>[^\]]+)\])?:(?<id>(?:\d+,?)+)$/gi.exec(
      str.trim(),
    );

    if (!rx) {
      printErr(`${str}`, "no RX");
      return null;
    }

    if (!rx.groups?.id) {
      printErr(`${str}`, "no id");
      return null;
    }

    const intID = rx.groups.id
      .split(",")
      .map(Number)
      .filter((q) => !(isNaN(q) || !isFinite(q) || !Number.isInteger(q)));

    if (intID.length === 0) {
      printErr(`${str}`, "no valid ID in the list!");
      return null;
    }

    const label = rx.groups.label;

    const field: SFXLinkField = {
      ids: intID,
      type: "sfxlink",
      label,
      consume: async (api) => {
        let result: CollapsedOnomatopoeia[] = [];
        if ("useUtils" in api) {
          // clientApi
          result = await api.useUtils().sfx.listSFX.fetch({ ids: intID });
        } else {
          //serverApi;
          result = await api.sfx.listSFX({ ids: intID });
        }

        if (result.length > 0) {
          return result
            .filter((q) => !!q)
            .map((q) => ({ id: q.id, label: q.text }));
        }

        return null;
      },
    };

    print(`${str}`, field);

    return field;
  },
  /** String counter. Started with `- `. */
  stringCounter: 0,
  /** Parse as {@link StringField} */
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
  /** Same as `str.split(separator).map(q=>`{@link Parser.parse}`)` */
  parseMultiple(str: string, separator = ";", log?: Log): ParseResult[] {
    return str.split(separator)?.map((q) => this.parse(q, log));
  },
  /** A list of all used field parsers. (Apllied from top to bottom, AFTER jump and hide parsers). If nothing matches, always returns {@link Parser.asString} */
  get fieldParsers() {
    // Use arrow functions to avoid unbound method issues
    return [
      (str: string, log?: Log) => this.asImage(str, log),
      (str: string, log?: Log) => this.asLink(str, log),
      (str: string, log?: Log) => this.asSFXLink(str, log),
    ] as const;
  },
  /** Parse string as a SFXField (not Jump or Hide) */
  asField(str: string, log?: Log): SFXField {
    for (const parser of this.fieldParsers) {
      const result = parser(str, log);
      if (result) return { ...result, index: -1, hidden: false, key: "" };
    }
    return { ...this.asString(str, log), index: -1, hidden: false, key: "" };
  },
};

/** Parse SFX fields */
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
    ? __print("WARN", log, "parseSFXFields", console.warn)
    : noop;

  const typeData: SFXFieldsData = {};

  let index = 0;

  /** Fields to be applied after the main fields. (e.g. jump fields) */
  const jumpFields: {
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

  /** All the hide calls from the entire data */
  const hideCalls: {
    key: keyof SFXFieldsData;
    relIndices: number[];
    revIndices?: number[];
  }[] = [];

  /** Parse all fields of a given type */
  forEachType((typeKey) => {
    print("Parsing data from field: ", typeKey);
    const dataQ = data[typeKey];
    if (!dataQ) {
      printErr("No dataQ", typeKey);
      return (typeData[typeKey] = []);
    }

    /** Parse a single field's data */
    const parseFieldData = (line: string): SFXField | null => {
      if (!line) {
        printErr("No line!", line);
        return null;
      }

      const field = Parser.parse(line, log);
      print("Parser value", field);

      if (Parser.isJump(field)) {
        if (field.to === typeKey) {
          const parsed = Parser.asString(line, log);
          printWarn(`Same field jump error!`, line);
          return {
            ...parsed,
            index: ++index,
            key: `${index}`,
            hidden: false,
          };
        }

        // restart stringCounter so that jumped-fields have their own counter
        const curCount = Parser.stringCounter;
        Parser.stringCounter = 0;
        // Parse the new field that will be making the jump
        const specialField: (typeof jumpFields)[number] = {
          data: { ...Parser.asField(field.data, log), jumpedFrom: typeKey },
          relIndex: field.index,
          key: field.to,
          onFail: {
            index: index + 1,
            key: typeKey,
            raw: field.raw,
          },
        };
        // restore the original stringCounter
        Parser.stringCounter = curCount;
        print("Adding jump field:", specialField);
        jumpFields.push(specialField);
        return null;
      }
      if (Parser.isHide(field)) {
        hideCalls.push({
          key: field.fieldKey,
          relIndices: field.index,
          revIndices: field.revIndices,
        });
        return null;
      }
      return { ...field, index: ++index, key: `${index}` };
    };

    typeData[typeKey] = data[typeKey]
      ?.split(";")
      .map<SFXField | null>(parseFieldData)
      .filter((q) => !!q);
    Parser.stringCounter = 0; // restart stringCounter
  });
  print(
    "Going into special field sorting:\n",
    "fields:",
    typeData,
    "\n",
    "special:",
    jumpFields,
    hideCalls,
  );

  // process jump fields
  jumpFields.forEach((q) => {
    print("Sorting out special field: ", q);
    const fieldData = typeData[q.key];
    if (!fieldData) return;

    let i = 0;
    /** Number of skipped half-indexes to correctly splice the array */
    let skip = 0;
    print(`Looking in ${q.key}`);
    for (const field of fieldData) {
      if (field.index % 1 !== 0) {
        skip++;
        // this is a half-step field. cannot jump under it
        continue;
      }
      if (i === q.relIndex) {
        // define field object that will be inserted
        const fieldObj = {
          ...q.data,
          index: field.index + 0.5,
          key: `${field.index + 0.5}`,
        };
        // X.5 should be ordered by te order they come in
        const halves = fieldData.filter((q) => q.index === fieldObj.index);
        print("Halves", halves);

        // if string - increment and add counter number
        if (fieldObj.type === "string") {
          const isCounted = halves.filter(
            (q): q is StringField & FieldBase =>
              q.type === "string" && !!q.counter,
          );
          if (isCounted.length > 0) {
            const prevCounter = isCounted[isCounted.length - 1]?.counter; // get the last element's counter
            if (prevCounter) fieldObj.counter = prevCounter + 1;
          }
        }
        fieldData.splice(i + skip + halves.length + 1, 0, {
          ...fieldObj,
          key: `${fieldObj.key}.${halves.length}`, // add a key for react
        });
        fieldData.sort((a, b) => a.index - b.index); // possibly unnecesarry?
        print("Added obj", fieldObj, "into field", q.key);
        print("Result: ", typeData);
        return;
      }
      i++;
    }
    printErr(`Failed!`);

    // jump failed, add back as StringField

    const failedType = typeData[q.onFail.key];
    if (!failedType) return;

    /** Change indexes of every field that comes AFTER the one pushed. */
    const reindex = (n: number) => {
      print("Reindexing everything above or equal", n);
      forEachType((fieldKey) => {
        const dataQ = typeData[fieldKey];
        if (!dataQ) return;
        dataQ.forEach((field) => {
          const newIndex = Math.abs(
            // Math.abs to change the negative index of the field that was just inserted to the correct one
            field.index >= n ? field.index + 1 : field.index,
          );
          if (field.index !== newIndex) {
            field.key = `${newIndex}`;
          }
          field.index = newIndex;
        });
      });
      jumpFields.forEach((q) => q.onFail.index++);
      print("After reindex", typeData, jumpFields);
    };

    i = -1;
    let found = false;
    const obj: SFXField = {
      hidden: q.data.hidden,
      type: "string",
      value: q.onFail.raw,
      index: -q.onFail.index, // index is negative so the reindexing don't change its index value, but sets it correctly
      key: `fail_${q.onFail.raw}`,
    };

    // find where to splice the array with the new field
    for (const field of failedType) {
      i++;
      if (found) continue;
      if (field.index === q.onFail.index) {
        failedType.splice(i, 1, ...[obj, field]);
        print(`Added `, obj, ` before `, field);
        reindex(q.onFail.index);
        found = true;
        break;
      }
    }

    if (!found) {
      printErr(
        `Did not find any field withh index ${q.onFail.index}! Pushing `,
        obj,
      );
      failedType.push(obj);
      reindex(q.onFail.index);
    }
  });

  // hide
  for (const hideCall of hideCalls) {
    const { key, relIndices } = hideCall;
    const f = typeData[key];
    if (!f) continue;

    for(const relIndex of relIndices){
      const obj = f[relIndex];
      if (obj) {
        const hideValue = hideCall.revIndices ?? true;
        const children = f.filter((q) =>
          obj.index % 1 === 0 ? q.index === obj.index + 0.5 : false,
      );
      children.forEach((c) => (c.hidden = hideValue));
      obj.hidden = hideValue;
    }
  }
}
  
  return typeData;
};
