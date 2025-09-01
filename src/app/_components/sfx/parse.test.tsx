import "@testing-library/jest-dom";
// import { getByAltText, render, screen } from "@testing-library/react";
import { parseSFXFields, type SFXFieldsData } from "./parse";

const emptyFieldData = {
  def: "",
  extra: "",
  read: "",
};

const emptyFieldResult = { read: [], def: [], extra: [] };

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
    expect(parseSFXFields(val)).toEqual({
      ...emptyFieldResult,
      [val.key]: [{ type: "string", value: "testV", index: 1 }],
    });
  });
});

describe("String parse - multiple", () => {
  it.each([]);
});
