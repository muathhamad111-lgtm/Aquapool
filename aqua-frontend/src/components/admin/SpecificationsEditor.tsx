import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import type { DbSpecificationField, DbSpecificationGroup } from "@/lib/admin-api";
import { adminInput } from "@/components/admin/field-styles";

const MAX_GROUPS = 20;
const MAX_FIELDS = 50;

const emptyField = (): DbSpecificationField => ({
  label_ar: "",
  label_en: "",
  value_ar: "",
  value_en: "",
});

const emptyGroup = (): DbSpecificationGroup => ({
  title_ar: "",
  title_en: "",
  fields: [emptyField()],
});

/**
 * Edits the free-form specification groups shown on the product detail
 * page: a heading, and the label/value rows under it. Limits mirror the
 * API's validation exactly, so the form can't build a payload the server
 * will reject.
 */
export function SpecificationsEditor({
  value,
  onChange,
}: {
  value: DbSpecificationGroup[];
  onChange: (groups: DbSpecificationGroup[]) => void;
}) {
  const updateGroup = (index: number, patch: Partial<DbSpecificationGroup>) =>
    onChange(value.map((group, i) => (i === index ? { ...group, ...patch } : group)));

  const moveGroup = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-deep">المواصفات</h3>
          <p className="text-[11px] text-muted-foreground">
            مجموعات اختيارية تظهر كجداول في صفحة المنتج. كل مجموعة عنوان وحقول تحته.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...value, emptyGroup()])}
          disabled={value.length >= MAX_GROUPS}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-white text-xs font-bold hover:bg-muted disabled:opacity-50"
        >
          <Plus className="size-3.5" /> مجموعة
        </button>
      </div>

      {value.length === 0 && (
        <p className="text-xs text-muted-foreground bg-muted/40 border border-dashed border-border rounded-xl p-4 text-center">
          لا توجد مواصفات. أضف مجموعة لعرض جدول في صفحة المنتج.
        </p>
      )}

      {value.map((group, groupIndex) => (
        <fieldset key={groupIndex} className="border border-border rounded-xl p-3 space-y-3">
          <div className="flex items-start gap-2">
            <GripVertical className="size-4 text-muted-foreground mt-2.5 shrink-0" />
            <div className="grid sm:grid-cols-2 gap-2 flex-1 min-w-0">
              <TextInput
                placeholder="عنوان المجموعة (عربي)"
                value={group.title_ar ?? ""}
                onChange={(title_ar) => updateGroup(groupIndex, { title_ar })}
              />
              <TextInput
                placeholder="Group title (English)"
                dir="ltr"
                value={group.title_en ?? ""}
                onChange={(title_en) => updateGroup(groupIndex, { title_en })}
              />
            </div>
            <div className="flex shrink-0">
              <IconButton
                label="تحريك لأعلى"
                disabled={groupIndex === 0}
                onClick={() => moveGroup(groupIndex, groupIndex - 1)}
              >
                <ChevronUp className="size-4" />
              </IconButton>
              <IconButton
                label="تحريك لأسفل"
                disabled={groupIndex === value.length - 1}
                onClick={() => moveGroup(groupIndex, groupIndex + 1)}
              >
                <ChevronDown className="size-4" />
              </IconButton>
              <IconButton
                label="حذف المجموعة"
                destructive
                onClick={() => onChange(value.filter((_, i) => i !== groupIndex))}
              >
                <Trash2 className="size-4" />
              </IconButton>
            </div>
          </div>

          <ul className="space-y-2">
            {group.fields.map((field, fieldIndex) => {
              const patchField = (patch: Partial<DbSpecificationField>) =>
                updateGroup(groupIndex, {
                  fields: group.fields.map((f, i) => (i === fieldIndex ? { ...f, ...patch } : f)),
                });

              return (
                <li key={fieldIndex} className="flex items-start gap-2 bg-muted/30 rounded-lg p-2">
                  {/* Captioned rows, not a bare 2×2 grid: once the inputs
                      are filled the placeholders vanish, and four identical
                      boxes give no clue which pair is the label and which
                      is the value. */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <FieldRow caption="اسم الحقل">
                      <TextInput
                        placeholder="عربي"
                        value={field.label_ar ?? ""}
                        onChange={(label_ar) => patchField({ label_ar })}
                      />
                      <TextInput
                        placeholder="English"
                        dir="ltr"
                        value={field.label_en ?? ""}
                        onChange={(label_en) => patchField({ label_en })}
                      />
                    </FieldRow>
                    <FieldRow caption="القيمة">
                      <TextInput
                        placeholder="عربي"
                        value={field.value_ar ?? ""}
                        onChange={(value_ar) => patchField({ value_ar })}
                      />
                      <TextInput
                        placeholder="English"
                        dir="ltr"
                        value={field.value_en ?? ""}
                        onChange={(value_en) => patchField({ value_en })}
                      />
                    </FieldRow>
                  </div>
                  <IconButton
                    label="حذف الحقل"
                    destructive
                    // The API requires every group to keep at least one
                    // field, so the last one can't be removed — delete the
                    // whole group instead.
                    disabled={group.fields.length === 1}
                    onClick={() =>
                      updateGroup(groupIndex, {
                        fields: group.fields.filter((_, i) => i !== fieldIndex),
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                  </IconButton>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={() => updateGroup(groupIndex, { fields: [...group.fields, emptyField()] })}
            disabled={group.fields.length >= MAX_FIELDS}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-border text-xs font-bold text-deep hover:bg-muted disabled:opacity-50"
          >
            <Plus className="size-3.5" /> حقل
          </button>
        </fieldset>
      ))}
    </div>
  );
}

function FieldRow({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-[10px] font-bold text-muted-foreground">{caption}</span>
      <div className="grid sm:grid-cols-2 gap-2 flex-1 min-w-0">{children}</div>
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  dir,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <input
      type="text"
      dir={dir}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={adminInput}
    />
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
  destructive,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`size-9 grid place-items-center rounded-lg transition-colors disabled:opacity-30 ${
        destructive ? "text-destructive hover:bg-destructive/10" : "text-deep hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
