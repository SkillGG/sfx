"use client";

import { useSFXLangs } from "@/app/hooks/langs";
import { useEffect, useState } from "react";
import { EditableSelect } from "../editableSelect";

export type SFXLangSelectClassNames = React.ComponentProps<
  typeof EditableSelect
>["classNames"];

export const SFXLangSelect = ({
  hideValues,
  removeValues,
  value,
  onChange,
  classNames,
}: {
  hideValues: string[];
  removeValues?: string[];
  value: string;
  onChange: (lang: string) => void;
  classNames?: SFXLangSelectClassNames;
}) => {
  const { langs, setLangs } = useSFXLangs();

  const [selectedValue, setSelectedValue] = useState(
    removeValues?.includes(value)
      ? (langs.find((lang) => !removeValues.includes(lang.code))?.code ?? "??")
      : value,
  );

  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  const [hideValuesState, setHideValuesState] = useState(hideValues);

  useEffect(() => {
    setHideValuesState(hideValues);
  }, [hideValues]);

  useEffect(() => {
    if (removeValues?.includes(selectedValue)) {
      setSelectedValue(
        langs.find((p) => !removeValues.includes(p.code))?.code ?? "??",
      );
    }
  }, [langs, removeValues, selectedValue]);

  return (
    <EditableSelect
      hideValues={hideValuesState ?? []}
      value={selectedValue}
      onChange={(e) => {
        if (typeof e === "string") onChange(e);
        else onChange(e.currentTarget.value);
      }}
      values={langs.map(({ name, code }) => ({
        label: name,
        value: code,
      }))}
      onAdd={(item) => {
        setLangs((prev) => [...prev, { name: item.label, code: item.value }]);
        onChange(item.value);
      }}
      addTitle="Add Language"
      placeholders={{
        label: "English",
        value: "en",
      }}
      classNames={classNames}
    />
  );
};
