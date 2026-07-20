import { FormField, type FormFieldProps } from "@/components/FormField";

/**
 * `FormField` at the dashboard's scale. A thin preset rather than
 * `size="sm"` on every call site: an admin dialog has a dozen fields, and
 * one missed prop would put a 66px field next to a 40px one — which is
 * exactly the inconsistency this exists to remove.
 *
 * Public pages keep the large `FormField` presentation deliberately; the
 * contact form's generous fields are a design choice, not an oversight.
 */
export function AdminField(props: Omit<FormFieldProps, "size">) {
  return <FormField {...props} size="sm" />;
}
