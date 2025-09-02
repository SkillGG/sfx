import "@testing-library/jest-dom";
// import { getByAltText, render, screen } from "@testing-library/react";
import { parseSFXFields, type SFXFieldsData } from "./parse";

const emptyFieldData = {
  def: "",
  extra: "",
  read: "",
};

const emptyFieldResult: SFXFieldsData = {
  read: [],
  def: [],
  extra: [],
  tlExtra: [],
};

it("String parse - empty", () => {
  expect(
    parseSFXFields({
      def: "",
      extra: "",
      read: "",
      tlExtra: "",
    }),
  ).toEqual<SFXFieldsData>(emptyFieldResult);
});

describe("String parse - singular", () => {
  it.each([
    { ...emptyFieldData, def: "testV", key: "def" },
    { ...emptyFieldData, extra: "testV", key: "extra" },
    { ...emptyFieldData, read: "testV", key: "read" },
  ])(`$key`, (val) => {
    expect(parseSFXFields(val)).toEqual<SFXFieldsData>({
      ...emptyFieldResult,
      [val.key]: [{ type: "string", value: "testV", index: 1, hidden: false }],
    });
  });
});

describe("String parse - multiple", () => {
  it(`every`, () => {
    expect(
      parseSFXFields({
        ...emptyFieldData,
        def: "testDef",
        extra: "testExtra",
        read: "testRead",
      }),
    ).toEqual<SFXFieldsData>({
      ...emptyFieldResult,
      read: [{ type: "string", value: "testRead", index: 1, hidden: false }],
      def: [{ type: "string", value: "testDef", index: 2, hidden: false }],
      extra: [{ type: "string", value: "testExtra", index: 3, hidden: false }],
    });
  });
});

describe("String parse - hide", () => {
  it.each(["def", "read", "extra"])(`%s`, (q) => {
    expect(
      parseSFXFields({ ...emptyFieldData, [q]: `a;b`, tlExtra: `-${q}(1)` }),
    ).toEqual<SFXFieldsData>({
      ...emptyFieldResult,
      [q]: [
        { type: "string", hidden: true, index: 1, value: "a" },
        { type: "string", hidden: false, index: 2, value: "b" },
      ],
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
    const failObj: Parameters<typeof parseSFXFields>[0] = {
      ...emptyFieldData,
      [to]: `[_${to}(1)]a;b`,
    };
    const successObj: Parameters<typeof parseSFXFields>[0] = {
      ...emptyFieldData,
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
            [to]: [
              { hidden: false, type: "string", value: "b", index: 2 },
              {
                hidden: false,
                type: "string",
                value: `[_${to}(1)]a`,
                index: 1,
              },
            ],
          }
        : {
            ...emptyFieldResult,
            [from]: [],
            [to]: [
              { hidden: false, type: "string", value: "b", index: 1 },
              { hidden: false, type: "string", value: "a", index: 1.5 },
            ],
          },
    );
  });
});
