import type { ReactNode } from "react";

type SettingSwitchProps = {
  label: string;
  icon?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

/* Chave liga/desliga. */
export default function SettingSwitch({
  label,
  icon,
  checked,
  onChange,
}: SettingSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex h-10 w-full cursor-pointer items-center justify-between gap-3 text-sm text-contrast/85 transition-colors hover:text-contrast"
    >
      <span className="flex items-center gap-2">
        {icon && (
          <span aria-hidden="true" className="text-contrast/60">
            {icon}
          </span>
        )}
        {label}
      </span>

      <span
        aria-hidden="true"
        className={[
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-interaction" : "bg-contrast/20",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 size-4 rounded-full bg-contrast transition-[left]",
            checked ? "left-[1.125rem]" : "left-0.5",
          ].join(" ")}
        />
      </span>
    </button>
  );
}
