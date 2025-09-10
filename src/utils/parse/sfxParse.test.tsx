import "@testing-library/jest-dom";
// import { getByAltText, render, screen } from "@testing-library/react";
import {
  parseSFXFields,
  type FieldBase,
  type SFXField,
  type SFXFieldsData,
  type StringField,
} from "./sfxParse";

const sF = (
  index: number,
  value: string,
  hidden = false,
  counter?: number,
): FieldBase & StringField => {
  return { hidden, index, type: "string", value, counter };
};

const imgF = (
  index: number,
  { url, local }: { url: string; local: boolean },
  hidden = false,
): SFXField => {
  return { hidden, type: "img", index, local, url };
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
      [q]: [sF(1, "a", true), sF(2, "b")],
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
        ).toEqual({ ...emptyFieldResult, [key]: [sF(1, "a", true)] });
      }
    });
  });

  it("hide same multiple times", () => {
    expect(
      parseSFXFields(fieldData("a;b", "-read1", "-read1", "-read1")),
    ).toEqual({
      ...emptyFieldResult,
      read: [sF(1, "a", true), sF(2, "b", false)],
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
            [to]: [sF(1, "b"), sF(1.5, "a")],
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
      def: [sF(3, "d"), sF(3.5, "c"), sF(4, "e"), sF(4.5, "h"), sF(5, "f")],
      extra: [sF(6, "g"), sF(7, "i")],
    });
  });

  it("two jump to the same place", () => {
    expect(parseSFXFields(fieldData("a", "_r1:b", "_r1:c", "_r1:d"))).toEqual({
      ...emptyFieldResult,
      read: [sF(1, "a"), sF(1.5, "b"), sF(1.5, "c"), sF(1.5, "d")],
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
      def: [sF(3, "d"), sF(3.5, `b`), sF(4, "_e12:e"), sF(5, "_r12:f")],
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
          [key]: [sF(1, "a"), sF(1.5, "jump")],
        });
      }
    });
  });

  it("double jump", () => {
    expect(parseSFXFields(fieldData("a;b", "_r1:_r2:c"))).toEqual({
      ...emptyFieldResult,
      read: [sF(1, "a"), sF(1.5, "_r2:c"), sF(2, "b")],
    });
  });
});

describe("String parse - jump & hide", () => {
  it("hide jumped field", () => {
    expect(
      parseSFXFields(fieldData("a;c;d", "_r1:b;e;f", "", "-read2")),
    ).toEqual<SFXFieldsData>({
      ...emptyFieldResult,
      read: [sF(1, "a"), sF(1.5, "b", true), sF(2, "c"), sF(3, "d")],
      def: [sF(4, "e"), sF(5, "f")],
    });
  });

  it("hide children after jump", () => {
    expect(parseSFXFields(fieldData("a;c", "_r1:b", "", "-read1"))).toEqual({
      ...emptyFieldResult,
      read: [sF(1, "a", true), sF(1.5, "b", true), sF(2, "c")],
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
      read: [imgF(1, { url: "test.png", local: true }, true)],
    });
  });

  it("moved img", () => {
    expect(parseSFXFields(fieldData("_d1:img:@test.png", "a"))).toEqual({
      ...emptyFieldResult,
      def: [sF(1, "a"), imgF(1.5, { url: "test.png", local: true })],
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
        },
      ],
    });
  });

  it("sfx link", async () => {
    const parsed = parseSFXFields(fieldData("sfx:1"));

    expect(parsed).toMatchObject<Omit<SFXFieldsData, "data">>({
      ...emptyFieldResult,
      read: [
        {
          type: "sfxlink",
          hidden: false,
          id: 1,
          index: 1,
        },
      ],
    });
    expect(parsed?.read?.[0]?.type).toBe("sfxlink");
    if (parsed?.read?.[0]?.type === "sfxlink") {
      expect(parsed?.read?.[0]?.consume).toEqual(expect.any(Function));
    }
  });
});

describe("String parse - counted strings", () => {
  it.each(["read", "def", "extra"] as const)("from start - in %s", (key) => {
    expect(parseSFXFields({ ...fieldData(), [key]: "- a;b;c" })).toEqual({
      ...emptyFieldResult,
      [key]: [sF(1, "a", false, 1), sF(2, "b", false, 2), sF(3, "c", false, 3)],
    });
  });

  it("no leaking", () => {
    expect(parseSFXFields(fieldData("- a;b", "- a;b"))).toEqual({
      ...emptyFieldResult,
      read: [sF(1, "a", false, 1), sF(2, "b", false, 2)],
      def: [sF(3, "a", false, 1), sF(4, "b", false, 2)],
    });
  });

  it("skip others", () => {
    expect(
      parseSFXFields(fieldData("- a;b;img:@test.png;c", "- a;sfx:1;c")),
    ).toMatchObject({
      ...emptyFieldResult,
      read: [
        sF(1, "a", false, 1),
        sF(2, "b", false, 2),
        imgF(3, { url: "test.png", local: true }),
        sF(4, "c", false, 3),
      ],
      def: [
        sF(5, "a", false, 1),
        { type: "sfxlink", id: 1, hidden: false, index: 6 },
        sF(7, "c", false, 2),
      ],
    });
  });

  it("counted jumps", () => {
    expect(parseSFXFields(fieldData("- a;b;c", "- d;e;_r1:f;g"))).toEqual({
      ...emptyFieldResult,
      read: [
        sF(1, "a", false, 1),
        sF(1.5, "f"),
        sF(2, "b", false, 2),
        sF(3, "c", false, 3),
      ],
      def: [sF(4, "d", false, 1), sF(5, "e", false, 2), sF(6, "g", false, 3)],
    });
  });

  it("inner jump counters", () => {
    expect(parseSFXFields(fieldData("- a;b", "- d;e;_r1:- f;_r1:g;h"))).toEqual(
      {
        ...emptyFieldResult,
        read: [
          sF(1, "a", false, 1),
          sF(1.5, "f", false, 1),
          sF(1.5, "g", false, 2),
          sF(2, "b", false, 2),
        ],
        def: [sF(3, "d", false, 1), sF(4, "e", false, 2), sF(5, "h", false, 3)],
      },
    );
  });

  it("counted multi jump", () => {
    expect(parseSFXFields(fieldData("- a;b;c", "- a;b;_r1:c;_r1:d"))).toEqual({
      ...emptyFieldResult,
      read: [
        sF(1, "a", false, 1),
        sF(1.5, "c"),
        sF(1.5, "d"),
        sF(2, "b", false, 2),
        sF(3, "c", false, 3),
      ],
      def: [sF(4, "a", false, 1), sF(5, "b", false, 2)],
    });
  });

  it("counting forwards jump", () => {
    expect(parseSFXFields(fieldData("- a;b;_d1:c;d", "- a;b;c"))).toEqual({
      ...emptyFieldResult,
      read: [sF(1, "a", false, 1), sF(2, "b", false, 2), sF(3, "d", false, 3)],
      def: [
        sF(4, "a", false, 1),
        sF(4.5, "c"),
        sF(5, "b", false, 2),
        sF(6, "c", false, 3),
      ],
    });
  });
});
