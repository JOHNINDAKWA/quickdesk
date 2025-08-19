// src/components/QDSelect.tsx
import React from "react";
import Select from "react-select";
import type { CSSObjectWithLabel, GroupBase } from "react-select";

type Metrics = {
  controlMinH: number;
  font: number;
  valuePad: string;
  indicatorPad: number;
  optionPad: string;
  multiLabelPad: string;
};

const metricsMap: Record<"sm" | "md", Metrics> = {
  sm: {
    controlMinH: 32,
    font: 12.5,
    valuePad: "2px 8px",
    indicatorPad: 4,
    optionPad: "6px 8px",
    multiLabelPad: "0 6px",
  },
  md: {
    controlMinH: 38,
    font: 13.5,
    valuePad: "4px 10px",
    indicatorPad: 6,
    optionPad: "8px 10px",
    multiLabelPad: "0 8px",
  },
};

/** Theme-aware base styles */
const baseSelectStyles = (m: Metrics) => ({
  control: (base: CSSObjectWithLabel) => ({
    ...base,
    background: "transparent",
    borderColor: "var(--border)",
    color: "var(--text)",
    minHeight: m.controlMinH,
    fontSize: m.font,
    boxShadow: "none",
    ":hover": { borderColor: "var(--border)" },
  }),
  valueContainer: (base: CSSObjectWithLabel) => ({
    ...base,
    padding: m.valuePad,
  }),
  indicatorsContainer: (base: CSSObjectWithLabel) => ({
    ...base,
    gap: 2,
  }),
  dropdownIndicator: (base: CSSObjectWithLabel) => ({
    ...base,
    padding: m.indicatorPad,
  }),
  clearIndicator: (base: CSSObjectWithLabel) => ({
    ...base,
    padding: m.indicatorPad,
  }),
  menu: (base: CSSObjectWithLabel) => ({
    ...base,
    background: "var(--surface-1)",
    color: "var(--text)",
    border: `1px solid var(--border)`,
    boxShadow: "var(--shadow-1)",
    zIndex: 30,
    fontSize: m.font,
  }),
  option: (base: CSSObjectWithLabel, state: any) => ({
    ...base,
    background: state.isFocused ? "var(--surface-2)" : "transparent",
    color: "var(--text)",
    padding: m.optionPad,
    ":active": { background: "var(--surface-3)" },
  }),
  multiValue: (base: CSSObjectWithLabel) => ({
    ...base,
    background: "var(--surface-3)",
    border: `1px solid var(--border)`,
    margin: 2,
  }),
  multiValueLabel: (base: CSSObjectWithLabel) => ({
    ...base,
    color: "var(--text)",
    padding: m.multiLabelPad,
    fontSize: m.font,
  }),
  placeholder: (base: CSSObjectWithLabel) => ({
    ...base,
    color: "var(--text-muted)",
    fontSize: m.font,
  }),
  singleValue: (base: CSSObjectWithLabel) => ({
    ...base,
    color: "var(--text)",
    fontSize: m.font,
  }),
  input: (base: CSSObjectWithLabel) => ({
    ...base,
    color: "var(--text)",
    fontSize: m.font,
  }),
});

export type QDSelectProps<
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
> = Omit<React.ComponentProps<typeof Select<Option, IsMulti, Group>>, "styles" | "classNamePrefix"> & {
  /** Compact density for filter UIs */
  size?: "sm" | "md";
  /** @deprecated – use `size="sm"` */
  compact?: boolean;
};

/** Drop-in react-select with QuickDesk defaults */
export function QDSelect<
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>(props: QDSelectProps<Option, IsMulti, Group>) {
  const { styles, size, compact, ...rest } = props;
  const resolvedSize: "sm" | "md" = size ?? (compact ? "sm" : "md");
  const m = metricsMap[resolvedSize];

  // merge/override styles; allow per-instance tweaks via `styles` prop
  const merged = { ...baseSelectStyles(m), ...(styles ?? {}) };

  return (
    <Select<Option, IsMulti, Group>
      {...rest}
      classNamePrefix="qdsel"
      styles={merged}
    />
  );
}

export default QDSelect;
