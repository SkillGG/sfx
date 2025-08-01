"use client";

import { EditableSelect } from "./editableSelect";
import { useSFXLangs } from "../hooks/langs";
import { useEffect, useState } from "react";

export const SFXLangSelect = ({
  hideValues,
  value,
  onChange,
  classNames,
}: {
  hideValues: string[];
  value: string;
  onChange: (lang: string) => void;
  classNames?: React.ComponentProps<typeof EditableSelect>["classNames"];
}) => {
  const { langs, setLangs } = useSFXLangs();

  const [selectedValue, setSelectedValue] = useState(value);

  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  const [hideValuesState, setHideValuesState] = useState(hideValues);

  useEffect(() => {
    setHideValuesState(hideValues);
  }, [hideValues]);

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
