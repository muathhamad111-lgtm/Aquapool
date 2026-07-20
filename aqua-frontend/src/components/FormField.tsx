import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// `size` is omitted because the native input attribute of that name is a
// number (character width) and this component's `size` is a presentation
// scale. Nothing here uses the native one.
type SharedFieldProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type" | "size"
>;

export interface FormFieldOption {
  value: string;
  label: string;
}

/**
 * `lg` is the public site's marketing presentation — large, bold, generous.
 * `sm` is for the admin dashboard, where one dialog shows a dozen fields at
 * once and density matters more than presence. It also matches the height
 * and type scale of the admin's other controls (search, filters, the
 * specifications editor), which `lg` was close to double.
 */
export type FormFieldSize = "lg" | "md" | "sm";

// Every class is written out in full — Tailwind extracts class names
// statically, so an interpolated `peer-focus:${...}` would silently produce
// no CSS at all.
const SIZES: Record<
  FormFieldSize,
  {
    wrapper: string;
    field: string;
    label: string;
    labelFloated: string;
    labelFocused: string;
    multilineTop: string;
  }
> = {
  lg: {
    wrapper: "px-5 py-[18px]",
    field: "text-[22px] font-bold",
    label: "text-base font-normal",
    labelFloated: "text-sm font-medium",
    labelFocused: "peer-focus:text-sm peer-focus:font-medium",
    // Roughly one line-height below the top padding, so the label sits on
    // the textarea's first line rather than floating above it.
    multilineTop: "top-[30px]",
  },
  // The public site's long forms. `lg` suits a two-field login screen but
  // stacks up at ~69px each across the quote form's nine fields, which is
  // more scrolling than reading.
  md: {
    wrapper: "px-4 py-3",
    field: "text-base font-semibold",
    label: "text-base font-normal",
    labelFloated: "text-xs font-medium",
    labelFocused: "peer-focus:text-xs peer-focus:font-medium",
    multilineTop: "top-[24px]",
  },
  sm: {
    wrapper: "px-4 py-2.5",
    field: "text-sm font-semibold",
    label: "text-sm font-normal",
    labelFloated: "text-xs font-medium",
    labelFocused: "peer-focus:text-xs peer-focus:font-medium",
    multilineTop: "top-[21px]",
  },
};

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
  /** Presentation scale. Defaults to `lg` (the public site). */
  size?: FormFieldSize;
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
      size = "lg",
      className,
      id,
      ...rest
    },
    ref,
  ) => {
    const scale = SIZES[size];
    const autoId = React.useId();
    const inputId = id ?? autoId;
    // Coerce null/undefined to "" so the field stays a controlled component
    // even when backed by a nullable data source.
    const fieldValue = value ?? "";
    const floated = fieldValue.length > 0;

    const fieldClassName = cn(
      "peer w-full border-0 bg-transparent text-[#1C1C1E] outline-none focus:outline-none focus:ring-0",
      scale.field,
    );

    return (
      <div
        className={cn(
          "relative rounded-xl bg-white",
          scale.wrapper,
          "shadow-[inset_0_0_0_1px_#D1D1D6] transition-shadow duration-150 ease-out",
          "focus-within:shadow-[inset_0_0_0_2px_#1C1C1E]",
          className,
        )}
      >
        {select ? (
          // `name` has to reach Root, not the trigger: that is what makes
          // Radix render the hidden native select the surrounding <form>
          // needs. Without it a FormData read comes back empty and the
          // choice is silently dropped on submit.
          <SelectPrimitive.Root
            value={fieldValue}
            onValueChange={onChange}
            required={required}
            name={rest.name}
          >
            {/* The trigger is the `peer`, so the floating label reacts to it
                exactly as it does to a real input. */}
            <SelectPrimitive.Trigger
              id={inputId}
              className={cn(
                fieldClassName,
                "flex items-center justify-between gap-2 pe-6 text-start cursor-pointer",
                // Without a min-height the trigger collapses to zero: the
                // floating label plays placeholder here, so an unselected
                // field has no text inside the button to give it height.
                // 1.5em tracks the font size, matching what a line of text
                // occupies in the input and textarea variants.
                "min-h-[1.5em]",
              )}
            >
              <SelectPrimitive.Value />
              <SelectPrimitive.Icon asChild>
                <ChevronDown
                  aria-hidden
                  className="pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-[#6E6E73]"
                />
              </SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>

            <SelectPrimitive.Portal>
              {/* Frosted glass: a translucent panel over a blurred backdrop.
                  A native <select> can't be styled at all — its list is drawn
                  by the OS — which is why this is a Radix listbox. */}
              <SelectPrimitive.Content
                position="popper"
                sideOffset={6}
                className={cn(
                  "z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl",
                  "border border-white/60 bg-white/75 backdrop-blur-xl",
                  "shadow-[0_12px_40px_rgba(28,28,30,0.16)]",
                  "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
                  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
                )}
              >
                <SelectPrimitive.Viewport className="p-1.5">
                  {options.map((opt) => (
                    <SelectPrimitive.Item
                      key={opt.value}
                      value={opt.value}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-xl px-3 py-2.5",
                        "text-sm font-semibold text-[#1C1C1E] outline-none",
                        "data-[highlighted]:bg-white/80 data-[state=checked]:bg-teal/15",
                      )}
                    >
                      <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                  ))}
                </SelectPrimitive.Viewport>
              </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
          </SelectPrimitive.Root>
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
            "peer-focus:top-0 peer-focus:text-[#1C1C1E]",
            scale.labelFocused,
            floated
              ? cn("top-0 text-[#6E6E73]", scale.labelFloated)
              : cn("text-[#6E6E73]", scale.label, multiline ? scale.multilineTop : "top-1/2"),
          )}
        >
          {label}
        </label>
      </div>
    );
  },
);
FormField.displayName = "FormField";
