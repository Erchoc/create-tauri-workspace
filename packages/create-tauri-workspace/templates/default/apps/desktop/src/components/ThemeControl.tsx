import type { Theme } from "../lib/bridge";

const options: { value: Theme; label: string }[] = [
  { value: "system", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

type Props = {
  value: Theme;
  onChange: (theme: Theme) => void;
};

export function ThemeControl({ value, onChange }: Props) {
  return (
    <div className="segmented" role="group" aria-label="Colour theme">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => {
            onChange(option.value);
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
