"use client";

import { EditableSelect } from "./editableSelect";
import { useSFXLangs } from "../hooks/langs";

export const SFXLangSelect = ({
  hideValues,
  value,
  onChange,
}: {
  hideValues: string[];
  value: string;
  onChange: (lang: string) => void;
}) => {
  const { langs, setLangs } = useSFXLangs();

  return (
    <EditableSelect
      hideValues={hideValues}
      value={value}
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
      addTitle="Add Translation"
      placeholders={{
        label: "English",
        value: "en",
      }}
    />
  );
};
