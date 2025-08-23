// src/components/QDSelect.tsx
import Select from "react-select";
import type {
  Props as RSProps,
  CSSObjectWithLabel,
  GroupBase,
  StylesConfig,
  OptionProps, // <-- Added for correct typing
} from "react-select";

/** Build theme-aware base styles with correct generics */
function makeBaseStyles<
  Option,
  IsMulti extends boolean,
  Group extends GroupBase<Option>
>(): StylesConfig<Option, IsMulti, Group> {
  const base = {
    control: (b: CSSObjectWithLabel) => ({
      ...b,
      // Updated styles for shorter height, smaller font, and transparent background
      background: "none",
      borderColor: "var(--border)",
      minHeight: 34, // Shorter height
      fontSize: "0775rem", // Smaller font size
      boxShadow: "none",
      ":hover": { borderColor: "var(--border)" },
    }),
    menu: (b: CSSObjectWithLabel) => ({
      ...b,
      background: "var(--surface-1)",
      color: "var(--text)",
      border: `1px solid var(--border)`,
      boxShadow: "var(--shadow-1)",
      zIndex: 30,
    }),
    option: (b: CSSObjectWithLabel, state: OptionProps<Option, IsMulti, Group>) => ({
      ...b,
      // Corrected the type of the state parameter from 'any'
      background: state.isFocused ? "var(--surface-2)" : "transparent",
      color: "var(--text)",
      fontSize: "0.875rem", // Smaller font size
      padding: "8px 12px", // Smaller padding to match height
      ":active": { background: "var(--surface-3)" },
    }),
    multiValue: (b: CSSObjectWithLabel) => ({
      ...b,
      background: "var(--surface-3)",
      border: `1px solid var(--border)`,
    }),
    multiValueLabel: (b: CSSObjectWithLabel) => ({ ...b, color: "var(--text)", fontSize: "0.875rem" }),
    placeholder: (b: CSSObjectWithLabel) => ({ ...b, color: "var(--text-muted)", fontSize: "0.875rem" }),
    singleValue: (b: CSSObjectWithLabel) => ({ ...b, color: "var(--text)", fontSize: "0.875rem" }),
    input: (b: CSSObjectWithLabel) => ({ ...b, color: "var(--text)", fontSize: "0.875rem" }),
  } as const;

  return base as StylesConfig<Option, IsMulti, Group>;
}

export type QDSelectProps<
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
> = Omit<RSProps<Option, IsMulti, Group>, "styles"> & {
  styles?: StylesConfig<Option, IsMulti, Group>;
  compact?: boolean;
};

export function QDSelect<
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>({ styles: userStyles, compact, ...rest }: QDSelectProps<Option, IsMulti, Group>) {
  const base = makeBaseStyles<Option, IsMulti, Group>();

  let merged: StylesConfig<Option, IsMulti, Group> = {
    ...base,
    ...(userStyles ?? {}),
  };

  // Compact tweak (just reduce control min-height)
  if (compact) {
    merged = {
      ...merged,
      control: (b, s) => {
        // Correctly handling the merge without using 'any'
        const prevControl = base.control;
        const baseStyles = prevControl ? prevControl(b, s) : b;
        return { ...baseStyles, minHeight: 30, fontSize: "0.75rem" };
      },
    };
  }

  return <Select {...(rest as RSProps<Option, IsMulti, Group>)} styles={merged} />;
}

export default QDSelect;