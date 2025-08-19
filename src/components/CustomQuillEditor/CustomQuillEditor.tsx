// src/components/QDSelect.tsx
import Select from "react-select";
import type {
  Props as RSProps,
  CSSObjectWithLabel,
  GroupBase,
  StylesConfig,
} from "react-select";

/** Shared QuickDesk select styles (theme-aware) */
export const selectStyles: StylesConfig<
  unknown,
  boolean,
  GroupBase<unknown>
> = {
  control: (base: CSSObjectWithLabel) => ({
    ...base,
    background: "var(--surface-2)",
    borderColor: "var(--border)",
    color: "var(--text)",
    minHeight: 38,
    boxShadow: "none",
    ":hover": { borderColor: "var(--border)" },
  }),
  menu: (base: CSSObjectWithLabel) => ({
    ...base,
    background: "var(--surface-1)",
    color: "var(--text)",
    border: `1px solid var(--border)`,
    boxShadow: "var(--shadow-1)",
    zIndex: 30,
  }),
  option: (base: CSSObjectWithLabel, state: any) => ({
    ...base,
    background: state.isFocused ? "var(--surface-2)" : "transparent",
    color: "var(--text)",
    ":active": { background: "var(--surface-3)" },
  }),
  multiValue: (base: CSSObjectWithLabel) => ({
    ...base,
    background: "var(--surface-3)",
    border: `1px solid var(--border)`,
  }),
  multiValueLabel: (base: CSSObjectWithLabel) => ({ ...base, color: "var(--text)" }),
  placeholder: (base: CSSObjectWithLabel) => ({ ...base, color: "var(--text-muted)" }),
  singleValue: (base: CSSObjectWithLabel) => ({ ...base, color: "var(--text)" }),
  input: (base: CSSObjectWithLabel) => ({ ...base, color: "var(--text)" }),
};

export type QDSelectProps<
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
> =
  // Keep all react-select props…
  Omit<RSProps<Option, IsMulti, Group>, "styles"> & {
    /** Optional per-instance styles to merge with QD defaults */
    styles?: StylesConfig<Option, IsMulti, Group>;
    /** Smaller height, handy in dense filter bars */
    compact?: boolean;
  };

/** Drop-in replacement for react-select with QuickDesk defaults */
export function QDSelect<
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>(props: QDSelectProps<Option, IsMulti, Group>) {
  const { styles: userStyles, compact, ...rest } = props;

  // Merge defaults + caller overrides
  const merged: StylesConfig<Option, IsMulti, Group> = {
    ...(selectStyles as StylesConfig<Option, IsMulti, Group>),
    ...(userStyles ?? {}),
  };

  // If compact, override control height without mutating `merged`
  const compactStyles: StylesConfig<Option, IsMulti, Group> = compact
    ? {
        ...merged,
        control: (base: CSSObjectWithLabel, state: any) => {
          const prev =
            typeof merged.control === "function"
              ? (merged.control as any)(base, state)
              : base;
          return { ...prev, minHeight: 34 };
        },
      }
    : merged;

  return (
    <Select<Option, IsMulti, Group>
      {...(rest as RSProps<Option, IsMulti, Group>)}
      styles={compactStyles}
    />
  );
}

export default QDSelect;
