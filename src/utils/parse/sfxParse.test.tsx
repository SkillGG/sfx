import "@testing-library/jest-dom";
// import { getByAltText, render, screen } from "@testing-library/react";
import {
  parseSFXFields,
  stringToSFXFieldKey,
  type FieldBase,
  type SFXField,
  type SFXFieldsData,
  type StringField,
} from "./sfxParse";

const sF = (
  index: number,
  value: string,
  key?: string,
): FieldBase & StringField => {
  return {
    hidden: false,
    index,
    type: "string",
    value,
    key: key ?? `${index}`,
  };
};

const count = <T extends StringField>(q: T, c: number): T => ({
  ...q,
  counter: c,
});

const jumped = <T extends FieldBase>(q: T, j: string, n = 0): T => ({
  ...q,
  jumpedFrom: stringToSFXFieldKey(j),
  key: `${q.key}.${n}`,
});

const hide = <T extends FieldBase>(q: T, hI?: number[]): T => ({
  ...q,
  hidden: hI ?? true,
});

const imgF = (
  index: number,
  { url, local }: { url: string; local: boolean },
  key?: string,
): SFXField => {
  return {
    hidden: false,
    type: "img",
    index,
    local,
    url,
    key: key ?? `${index}`,
  };
};

export const fieldData = (
  read = "",
  def = "",
  extra = "",
  tlExtra?: string,
): Parameters<typeof parseSFXFields>[0] => {
  return { read, def, extra, tlExtra };
};

const emptyFieldResult: SFXFieldsData = {
  read: [],
  def: [],
  extra: [],
  tlExtra: [],
};

it("String parse - empty", () => {
  expect(parseSFXFields(fieldData())).toEqual<SFXFieldsData>(emptyFieldResult);
});

describe("String parse - singular", () => {
  it.each([
    { ...fieldData("testV"), key: "read" },
    { ...fieldData("", "testV"), key: "def" },
    { ...fieldData("", "", "testV"), key: "extra" },
  ])(`$key`, (val) => {
    expect(parseSFXFields(val)).toEqual<SFXFieldsData>({
      ...emptyFieldResult,
      [val.key]: [sF(1, "testV")],
    });
  });
});

describe("String parse - multiple", () => {
  it(`every`, () => {
    expect(
      parseSFXFields(fieldData("testRead", "testDef", "testExtra")),
    ).toEqual<SFXFieldsData>({
      ...emptyFieldResult,
      read: [sF(1, "testRead")],
      def: [sF(2, "testDef")],
      extra: [sF(3, "testExtra")],
    });
  });
});

describe("String parse - hide", () => {
  it.each(["def", "read", "extra"])(`%s`, (q) => {
    expect(
      parseSFXFields({ ...fieldData("", "", "", `-${q}1`), [q]: `a;b` }),
    ).toEqual<SFXFieldsData>({
      ...emptyFieldResult,
      [q]: [hide(sF(1, "a")), sF(2, "b")],
    });
  });

  it(`hide using keywords`, () => {
    [
      { key: "read", abbrs: ["r", "read"] } as const,
      { key: "def", abbrs: ["d", "def"] } as const,
      { key: "extra", abbrs: ["e", "ex", "extra"] } as const,
    ].forEach(({ key, abbrs }) => {
      for (const abbr of abbrs) {
        expect(
          parseSFXFields(
            fieldData(
              key === "read" ? "a" : "",
              key === "def" ? "a" : "",
              key === "extra" ? "a" : "",
              `-${abbr}1`,
            ),
          ),
        ).toEqual({ ...emptyFieldResult, [key]: [hide(sF(1, "a"))] });
      }
    });
  });

  it("hide same multiple times", () => {
    expect(
      parseSFXFields(fieldData("a;b", "-read1", "-read1", "-read1")),
    ).toEqual({
      ...emptyFieldResult,
      read: [hide(sF(1, "a")), sF(2, "b")],
    });
  });

  it("hide with reverse indices", () => {
    expect(parseSFXFields(fieldData("a;b", "", "", "-r1/1,2"))).toEqual({
      ...emptyFieldResult,
      read: [hide(sF(1, "a"), [0, 1]), sF(2, "b")],
    });
  });

  it("hide same with reverse", () => {
    expect(parseSFXFields(fieldData("a;b", "", "", "-r1/"))).toEqual({
      ...emptyFieldResult,
      read: [hide(sF(1, "a"), [0]), sF(2, "b")],
    });
  });
});

describe("String parse - jump", () => {
  it.each([
    { from: "read", to: "read" } as const,
    { from: "read", to: "extra" } as const,
    { from: "read", to: "def" } as const,
    { from: "def", to: "read" } as const,
    { from: "def", to: "def" } as const,
    { from: "def", to: "extra" } as const,
    { from: "extra", to: "read" } as const,
    { from: "extra", to: "def" } as const,
    { from: "extra", to: "extra" } as const,
    { from: "tlExtra", to: "read" } as const,
    { from: "tlExtra", to: "def" } as const,
    { from: "tlExtra", to: "extra" } as const,
    { from: "tlExtra", to: "tlExtra" } as const,
  ])("$from => $to", ({ from, to }) => {
    const failObj = {
      ...fieldData(),
      [to]: `_${to}1:a;b`,
    };
    const successObj = {
      ...fieldData(),
      [from]: `_${to}1:a`,
      [to]: `b`,
    };

    expect(
      parseSFXFields(from === to ? failObj : successObj),
    ).toEqual<SFXFieldsData>(
      from === to
        ? {
            ...emptyFieldResult,
            // fail
            [to]: [sF(1, `_${to}1:a`), sF(2, "b")],
          }
        : {
            ...emptyFieldResult,
            [from]: [],
            [to]: [sF(1, "b"), jumped(sF(1.5, "a"), from)],
          },
    );
  });

  it("multiple jumps", () => {
    expect(
      parseSFXFields({
        read: "a;b;_d1:c",
        def: "d;e;f",
        extra: "g;_d2:h;i",
      }),
    ).toEqual<SFXFieldsData>({
      ...emptyFieldResult,
      read: [sF(1, "a"), sF(2, "b")],
      def: [
        sF(3, "d"),
        jumped(sF(3.5, "c"), "r"),
        sF(4, "e"),
        jumped(sF(4.5, "h"), "e"),
        sF(5, "f"),
      ],
      extra: [sF(6, "g"), sF(7, "i")],
    });
  });

  it("two jump to the same place", () => {
    expect(parseSFXFields(fieldData("a", "_r1:b", "_r1:c", "_r1:d"))).toEqual({
      ...emptyFieldResult,
      read: [
        sF(1, "a"),
        jumped(sF(1.5, "b"), "d"),
        jumped(sF(1.5, "c"), "e", 1),
        jumped(sF(1.5, "d"), "t", 2),
      ],
    });
  });

  it("jump single fail", () => {
    expect(parseSFXFields(fieldData("_def4:a", "b;c"))).toEqual<SFXFieldsData>({
      ...emptyFieldResult,
      read: [sF(1, "_def4:a")],
      def: [sF(2, "b"), sF(3, "c")],
    });
  });

  it("jump multi fail", () => {
    expect(
      parseSFXFields(
        fieldData("_e12:a;_d1:b;c", "d;_e12:e;_r12:f", "g;_e1:h;i"),
      ),
    ).toEqual<SFXFieldsData>({
      ...emptyFieldResult,
      read: [sF(1, "_e12:a"), sF(2, `c`)],
      def: [
        sF(3, "d"),
        jumped(sF(3.5, `b`), "r"),
        sF(4, "_e12:e"),
        sF(5, "_r12:f"),
      ],
      extra: [sF(6, "g"), sF(7, "_e1:h"), sF(8, "i")],
    });
  }, 1000);

  it(`jump using keywords`, () => {
    [
      { key: "read", abbrs: ["r", "read"] } as const,
      { key: "def", abbrs: ["d", "def"] } as const,
      { key: "extra", abbrs: ["e", "ex", "extra"] } as const,
    ].forEach(({ key, abbrs }) => {
      for (const abbr of abbrs) {
        const jump = `_${abbr}1:jump`;
        expect(
          parseSFXFields(
            fieldData(
              key === "read" ? "a" : "",
              key === "def" ? "a" : "",
              key === "extra" ? "a" : "",
              jump,
            ),
          ),
        ).toEqual({
          ...emptyFieldResult,
          [key]: [sF(1, "a"), jumped(sF(1.5, "jump"), "tl")],
        });
      }
    });
  });

  it("double jump", () => {
    expect(parseSFXFields(fieldData("a;b", "_r1:_r2:c"))).toEqual({
      ...emptyFieldResult,
      read: [sF(1, "a"), jumped(sF(1.5, "_r2:c"), "d"), sF(2, "b")],
    });
  });
});

describe("String parse - jump & hide", () => {
  it("hide jumped field", () => {
    expect(
      parseSFXFields(fieldData("a;c;d", "_r1:b;e;f", "", "-read2")),
    ).toEqual<SFXFieldsData>({
      ...emptyFieldResult,
      read: [
        sF(1, "a"),
        hide(jumped(sF(1.5, "b"), "d")),
        sF(2, "c"),
        sF(3, "d"),
      ],
      def: [sF(4, "e"), sF(5, "f")],
    });
  });

  it("hide children after jump", () => {
    expect(parseSFXFields(fieldData("a;c", "_r1:b", "", "-read1"))).toEqual({
      ...emptyFieldResult,
      read: [hide(sF(1, "a")), hide(jumped(sF(1.5, "b"), "d")), sF(2, "c")],
    });
  });
});

describe("String parse - img", () => {
  it("local img", () => {
    expect(parseSFXFields(fieldData("img:@test.png"))).toEqual({
      ...emptyFieldResult,
      read: [imgF(1, { local: true, url: "test.png" })],
    });
  });

  it("nonlocal img", () => {
    expect(
      parseSFXFields(fieldData("img:https://example.com/test.png")),
    ).toEqual({
      ...emptyFieldResult,
      read: [imgF(1, { url: "https://example.com/test.png", local: false })],
    });
  });

  it("hidden img", () => {
    expect(
      parseSFXFields(fieldData("img:@test.png", "", "", "-read1")),
    ).toEqual({
      ...emptyFieldResult,
      read: [hide(imgF(1, { url: "test.png", local: true }))],
    });
  });

  it("moved img", () => {
    expect(parseSFXFields(fieldData("_d1:img:@test.png", "a"))).toEqual({
      ...emptyFieldResult,
      def: [
        sF(1, "a"),
        jumped(imgF(1.5, { url: "test.png", local: true }), "r"),
      ],
    });
  });
});

describe("String parse - links", () => {
  it("site link", () => {
    expect(
      parseSFXFields(fieldData("[https://google.com](Test)")),
    ).toEqual<SFXFieldsData>({
      ...emptyFieldResult,
      read: [
        {
          hidden: false,
          index: 1,
          type: "link",
          url: "https://google.com",
          label: "Test",
          key: "1",
        },
      ],
    });
  });

  it("sfx link", () => {
    const parsed = parseSFXFields(fieldData("sfx:1"));

    expect(parsed).toMatchObject<Omit<SFXFieldsData, "data">>({
      ...emptyFieldResult,
      read: [
        {
          type: "sfxlink",
          hidden: false,
          ids: [1],
          index: 1,
          key: "1",
        },
      ],
    });
    if (parsed?.read?.[0]?.type === "sfxlink") {
      expect(parsed?.read?.[0]?.consume).toEqual(expect.any(Function));
    }
  });

  it("multi sfx link", () => {
    const parsed = parseSFXFields(fieldData("sfx:1,2,3"));

    expect(parsed).toMatchObject<Omit<SFXFieldsData, "data">>({
      ...emptyFieldResult,
      read: [
        {
          type: "sfxlink",
          hidden: false,
          ids: [1, 2, 3],
          index: 1,
          key: "1",
        },
      ],
    });
  });

  it("labeled sfx", () => {
    const parsed = parseSFXFields(fieldData("sfx[This is the label__:P]:1"));

    expect(parsed).toMatchObject<SFXFieldsData>({
      ...emptyFieldResult,
      read: [
        {
          type: "sfxlink",
          hidden: false,
          ids: [1],
          preLabel: "This is the label__:P",
          index: 1,
          key: "1",
        },
      ],
    });
  });

  it("post-labeled sfx", () => {
    const parsed = parseSFXFields(fieldData("sfx< - also this>:1"));

    expect(parsed).toMatchObject<SFXFieldsData>({
      ...emptyFieldResult,
      read: [
        {
          type: "sfxlink",
          hidden: false,
          ids: [1],
          postLabel: "post",
          key: "1",
          index: 1,
        },
      ],
    });
  });
});

describe("String parse - counted strings", () => {
  it.each(["read", "def", "extra"] as const)("from start - in %s", (key) => {
    expect(parseSFXFields({ ...fieldData(), [key]: "- a;b;c" })).toEqual({
      ...emptyFieldResult,
      [key]: [count(sF(1, "a"), 1), count(sF(2, "b"), 2), count(sF(3, "c"), 3)],
    });
  });

  it("no leaking", () => {
    expect(parseSFXFields(fieldData("- a;b", "- a;b"))).toEqual({
      ...emptyFieldResult,
      read: [count(sF(1, "a"), 1), count(sF(2, "b"), 2)],
      def: [count(sF(3, "a"), 1), count(sF(4, "b"), 2)],
    });
  });

  it("skip others", () => {
    expect(
      parseSFXFields(fieldData("- a;b;img:@test.png;c", "- a;sfx:1;c")),
    ).toMatchObject({
      ...emptyFieldResult,
      read: [
        count(sF(1, "a"), 1),
        count(sF(2, "b"), 2),
        imgF(3, { url: "test.png", local: true }),
        count(sF(4, "c"), 3),
      ],
      def: [
        count(sF(5, "a"), 1),
        { type: "sfxlink", ids: [1], hidden: false, index: 6 },
        count(sF(7, "c"), 2),
      ],
    });
  });

  it("counted jumps", () => {
    expect(parseSFXFields(fieldData("- a;b;c", "- d;e;_r1:f;g"))).toEqual({
      ...emptyFieldResult,
      read: [
        count(sF(1, "a"), 1),
        jumped(sF(1.5, "f"), "d"),
        count(sF(2, "b"), 2),
        count(sF(3, "c"), 3),
      ],
      def: [count(sF(4, "d"), 1), count(sF(5, "e"), 2), count(sF(6, "g"), 3)],
    });
  });

  it("inner jump counters", () => {
    expect(parseSFXFields(fieldData("- a;b", "- d;e;_r1:- f;_r1:g;h"))).toEqual(
      {
        ...emptyFieldResult,
        read: [
          count(sF(1, "a"), 1),
          jumped(count(sF(1.5, "f"), 1), "d"),
          jumped(count(sF(1.5, "g"), 2), "d", 1),
          count(sF(2, "b"), 2),
        ],
        def: [count(sF(3, "d"), 1), count(sF(4, "e"), 2), count(sF(5, "h"), 3)],
      },
    );
  });

  it("counted multi jump", () => {
    expect(parseSFXFields(fieldData("- a;b;c", "- a;b;_r1:c;_r1:d"))).toEqual({
      ...emptyFieldResult,
      read: [
        count(sF(1, "a"), 1),
        jumped(sF(1.5, "c"), "d"),
        jumped(sF(1.5, "d"), "d", 1),
        count(sF(2, "b"), 2),
        count(sF(3, "c"), 3),
      ],
      def: [count(sF(4, "a"), 1), count(sF(5, "b"), 2)],
    });
  });

  it("counting forwards jump", () => {
    expect(parseSFXFields(fieldData("- a;b;_d1:c;d", "- a;b;c"))).toEqual({
      ...emptyFieldResult,
      read: [count(sF(1, "a"), 1), count(sF(2, "b"), 2), count(sF(3, "d"), 3)],
      def: [
        count(sF(4, "a"), 1),
        jumped(sF(4.5, "c"), "r"),
        count(sF(5, "b"), 2),
        count(sF(6, "c"), 3),
      ],
    });
  });
});
