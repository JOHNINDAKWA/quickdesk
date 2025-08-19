// src/components/QDSelect.tsx
import Select from "react-select";
import type {
  Props as RSProps,
  CSSObjectWithLabel,
  GroupBase,
  StylesConfig,
} from "react-select";

/** Build theme-aware base styles with correct generics */
function makeBaseStyles<
  Option,
  IsMulti extends boolean,
  Group extends GroupBase<Option>
>(): StylesConfig<Option, IsMulti, Group> {
  // We keep the implementation typed to CSSObjectWithLabel for the style funcs
  const base = {
    control: (b: CSSObjectWithLabel) => ({
      ...b,
      background: "var(--surface-2)",
      borderColor: "var(--border)",
      color: "var(--text)",
      minHeight: 38,
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
    option: (b: CSSObjectWithLabel, state: any) => ({
      ...b,
      background: state.isFocused ? "var(--surface-2)" : "transparent",
      color: "var(--text)",
      ":active": { background: "var(--surface-3)" },
    }),
    multiValue: (b: CSSObjectWithLabel) => ({
      ...b,
      background: "var(--surface-3)",
      border: `1px solid var(--border)`,
    }),
    multiValueLabel: (b: CSSObjectWithLabel) => ({ ...b, color: "var(--text)" }),
    placeholder: (b: CSSObjectWithLabel) => ({ ...b, color: "var(--text-muted)" }),
    singleValue: (b: CSSObjectWithLabel) => ({ ...b, color: "var(--text)" }),
    input: (b: CSSObjectWithLabel) => ({ ...b, color: "var(--text)" }),
  } as const;

  // TS doesn’t infer the react-select StylesConfig shape from the above,
  // so we coerce once here (safe: keys match the contract).
  return base as unknown as StylesConfig<Option, IsMulti, Group>;
}

export type QDSelectProps<
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
> =
  // All react-select props EXCEPT styles (we’ll re-declare it as optional)
  Omit<RSProps<Option, IsMulti, Group>, "styles"> & {
    /** Optional per-instance styles to merge with QD defaults */
    styles?: StylesConfig<Option, IsMulti, Group>;
    /** Smaller height, handy in dense filter bars */
    compact?: boolean;
  };

export function QDSelect<
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>({ styles: userStyles, compact, ...rest }: QDSelectProps<Option, IsMulti, Group>) {
  const base = makeBaseStyles<Option, IsMulti, Group>();

  // Merge defaults + caller overrides without mutating either
  let merged: StylesConfig<Option, IsMulti, Group> = {
    ...base,
    ...(userStyles ?? {}),
  };

  // Compact tweak (just reduce control min-height)
  if (compact) {
    const prevControl = merged.control;
    merged = {
      ...merged,
      control: (b: CSSObjectWithLabel, s: any) => {
        const out =
          typeof prevControl === "function" ? (prevControl as any)(b, s) : b;
        return { ...out, minHeight: 34 };
      },
    };
  }

  return (
    <Select<Option, IsMulti, Group>
      {...(rest as RSProps<Option, IsMulti, Group>)}
      styles={merged}
    />
  );
}

export default QDSelect;
