import "@testing-library/jest-dom";
// import { getByAltText, render, screen } from "@testing-library/react";
import { parseSFXFields, type SFXField, type SFXFieldsData } from "./sfxParse";

const sF = (index: number, value: string, hidden = false): SFXField => {
  return { hidden, index, type: "string", value };
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
      parseSFXFields({ ...fieldData("", "", "", `-${q}(1)`), [q]: `a;b` }),
    ).toEqual<SFXFieldsData>({
      ...emptyFieldResult,
      [q]: [sF(1, "a", true), sF(2, "b")],
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
  ])("$from => $to", ({ from, to }) => {
    const failObj = {
      ...fieldData(),
      [to]: `[_${to}(1)]a;b`,
    };
    const successObj = {
      ...fieldData(),
      [from]: `[_${to}(1)]a`,
      [to]: `b`,
    };

    expect(
      parseSFXFields(from === to ? failObj : successObj),
    ).toEqual<SFXFieldsData>(
      from === to
        ? {
            ...emptyFieldResult,
            // fail
            [to]: [sF(1, `[_${to}(1)]a`), sF(2, "b")],
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
        read: "a;b;[_d(1)]c",
        def: "d;e;f",
        extra: "g;[_d(2)]h;i",
      }),
    ).toEqual<SFXFieldsData>({
      ...emptyFieldResult,
      read: [sF(1, "a"), sF(2, "b")],
      def: [sF(3, "d"), sF(3.5, "c"), sF(4, "e"), sF(4.5, "h"), sF(5, "f")],
      extra: [sF(6, "g"), sF(7, "i")],
    });
  });

  it("jump single fail", () => {
    expect(
      parseSFXFields(fieldData("[_def(4)]a", "b;c")),
    ).toEqual<SFXFieldsData>({
      ...emptyFieldResult,
      read: [sF(1, "[_def(4)]a")],
      def: [sF(2, "b"), sF(3, "c")],
    });
  });

  it("jump multi fail", () => {
    console.log("=== Multiple fails ===");
    expect(
      parseSFXFields(
        fieldData(
          "[_e(12)]a;[_d(1)]b;c",
          "d;[_e(12)]e;[_r(12)]f",
          "g;[_e(1)]h;i",
        ),
      ),
    ).toEqual<SFXFieldsData>({
      ...emptyFieldResult,
      read: [sF(1, "[_e(12)]a"), sF(2, `c`)],
      def: [sF(3, "d"), sF(3.5, `b`), sF(4, "[_e(12)]e"), sF(5, "[_r(12)]f")],
      extra: [sF(6, "g"), sF(7, "[_e(1)]h"), sF(8, "i")],
    });
  }, 1000);
});

describe("String parse - jump & hide", () => {
  it("hide jumped field", () => {
    expect(
      parseSFXFields(fieldData("a;c;d", "[_r(1)]b;e;f", "", "-read(2)")),
    ).toEqual<SFXFieldsData>({
      ...emptyFieldResult,
      read: [sF(1, "a"), sF(1.5, "b", true), sF(2, "c"), sF(3, "d")],
      def: [sF(4, "e"), sF(5, "f")],
    });
  });
});
