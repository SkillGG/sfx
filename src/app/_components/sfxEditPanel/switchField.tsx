import type { SFXFieldWithName } from ".";
import { cn } from "@/utils/utils";
import { DEFAULT_SFX_LABEL_STYLES } from "../sfx";
import { Switch } from "@/components/ui/switch";

export type SwitchField = {
  label: string;
  value: boolean | null;
  type: "switch";
  key?: string;
};

export const SwitchField = ({
  field,
  onChange,
}: {
  field: SFXFieldWithName<SwitchField>;
  onChange: (v: (typeof field)["value"]) => void;
}) => {
  const { field: fieldName, label, value, key } = field;

  return (
    <div className={cn("flex flex-row items-center gap-2")}>
      <div className={cn("flex flex-1 items-center gap-2")}>
        <label
          htmlFor={key ?? fieldName}
          className={cn(DEFAULT_SFX_LABEL_STYLES)}
        >
          {label}
        </label>
      </div>
      <div className={cn("flex flex-3 flex-col gap-2")}>
        <label
          className={cn(
            "flex cursor-pointer items-center gap-1 text-(--sfx-label-text)",
          )}
        >
          <input
            type="checkbox"
            data-value={value}
            checked={typeof value === "string"}
            onChange={() => onChange(!value)}
            id={key ?? fieldName}
            className="hidden"
          />
          <Switch
            checked={value ?? false}
            onClick={() => onChange(!value)}
            className=""
            thumb={{
              className: cn(
                "data-[state=unchecked]:bg-(--accent-300) data-[state=checked]:bg-(--accent-600)",
              ),
            }}
          />
        </label>
      </div>
    </div>
  );
};
