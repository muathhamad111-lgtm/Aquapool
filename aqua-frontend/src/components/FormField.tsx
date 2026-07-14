import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SharedFieldProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
>;

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormFieldProps extends SharedFieldProps {
  label: string;
  /** Controlled value. `null`/`undefined` are treated as an empty string. */
  value: string | null | undefined;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  /** Render as a <textarea> instead of an <input>. */
  multiline?: boolean;
  /** Row count for the textarea. Only used when `multiline` is true. Defaults to 4. */
  rows?: number;
  /** Render as a native <select> instead of an <input>. */
  select?: boolean;
  /** Options for the select. Only used when `select` is true. */
  options?: FormFieldOption[];
}

/**
 * Notched-outline form field with a floating label. Renders an <input> by
 * default, a <textarea> when `multiline` is set, or a native <select> when
 * `select` is set.
 *
 * Empty + unfocused: the label sits inside the field acting as a placeholder
 * (vertically centered for a single-line input/select, top-aligned for a
 * textarea since it's tall). Focused, or once a value exists, it floats up
 * into the notch on the top border (shrinking + recoloring on focus). The
 * `value` prop (already in hand as a controlled component) drives the "has
 * a value" half of that, while focus is handled purely via the
 * `peer`/`peer-focus` CSS pseudo-class, so the movement is a plain CSS
 * transition either way.
 *
 * The `-translate-y-1/2` on the label is kept constant across every state
 * (single-line, textarea, select, floated, unfocused) — only `top` changes
 * between them — so the transform never has to interpolate between two
 * different translate values, which avoids visual glitches during the
 * transition.
 *
 * The visible "border" is an inset box-shadow, not a real border — that's
 * what lets the focus state grow it from 1px to 2px with zero layout shift,
 * since box-shadow never participates in the box model.
 *
 * A native <select> always has a "current" option, so an empty controlled
 * value needs a real (but disabled + hidden) placeholder option to select —
 * otherwise the browser would fall back to showing its first real option,
 * which would silently disagree with `floated`/`value`. The placeholder
 * option's label is left blank so the closed select shows nothing, exactly
 * like an empty input, with the floating label doing the placeholder duty.
 */
export const FormField = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  FormFieldProps
>(
  (
    {
      label,
      value,
      onChange,
      type = "text",
      placeholder,
      required,
      multiline = false,
      rows = 4,
      select = false,
      options = [],
      className,
      id,
      ...rest
    },
    ref,
  ) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;
    // Coerce null/undefined to "" so the field stays a controlled component
    // even when backed by a nullable data source.
    const fieldValue = value ?? "";
    const floated = fieldValue.length > 0;

    const fieldClassName =
      "peer w-full border-0 bg-transparent text-[22px] font-bold text-[#1C1C1E] outline-none focus:outline-none focus:ring-0";

    return (
      <div
        className={cn(
          "relative rounded-xl bg-white px-5 py-[18px]",
          "shadow-[inset_0_0_0_1px_#D1D1D6] transition-shadow duration-150 ease-out",
          "focus-within:shadow-[inset_0_0_0_2px_#1C1C1E]",
          className,
        )}
      >
        {select ? (
          <>
            <select
              ref={ref as React.Ref<HTMLSelectElement>}
              id={inputId}
              value={fieldValue}
              onChange={(e) => onChange(e.target.value)}
              required={required}
              className={cn(fieldClassName, "appearance-none pe-6 cursor-pointer")}
              {...(rest as unknown as React.SelectHTMLAttributes<HTMLSelectElement>)}
            >
              <option value="" disabled hidden></option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden
              className="pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-[#6E6E73]"
            />
          </>
        ) : multiline ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            id={inputId}
            value={fieldValue}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            rows={rows}
            dir="auto"
            className={cn(fieldClassName, "resize-none")}
            {...(rest as unknown as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            id={inputId}
            type={type}
            value={fieldValue}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            dir="auto"
            className={fieldClassName}
            {...rest}
          />
        )}
        <label
          htmlFor={inputId}
          className={cn(
            "pointer-events-none absolute start-4 -translate-y-1/2 bg-white px-1.5",
            "transition-all duration-150 ease-out",
            "peer-focus:top-0 peer-focus:text-sm peer-focus:font-medium peer-focus:text-[#1C1C1E]",
            floated
              ? "top-0 text-sm font-medium text-[#6E6E73]"
              : multiline
                ? "top-[30px] text-base font-normal text-[#6E6E73]"
                : "top-1/2 text-base font-normal text-[#6E6E73]",
          )}
        >
          {label}
        </label>
      </div>
    );
  },
);
FormField.displayName = "FormField";
