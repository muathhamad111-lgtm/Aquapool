import { useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Type,
  List,
  ListOrdered,
  Eraser,
} from "lucide-react";

type Props = {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  dir?: "ltr" | "rtl";
  minHeight?: number;
};

function exec(cmd: string, val?: string) {
  document.execCommand(cmd, false, val);
}

export function RichTextArea({ label, value, onChange, dir, minHeight = 140 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Sync incoming value only when it differs from current DOM (avoid caret reset).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.innerHTML !== (value || "")) {
      el.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const btn =
    "h-8 min-w-8 px-2 inline-flex items-center justify-center rounded-md text-foreground/70 hover:bg-mint/40 hover:text-deep transition-colors";

  return (
    <div>
      {label && <label className="block text-xs font-bold text-deep/80 mb-1.5">{label}</label>}
      <div className="border border-border rounded-xl bg-white overflow-hidden focus-within:border-teal focus-within:ring-2 focus-within:ring-teal/20">
        <div
          dir="ltr"
          className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-mint/10"
        >
          <select
            onChange={(e) => {
              const v = e.target.value;
              if (v === "p") exec("formatBlock", "P");
              else if (v === "h1") exec("formatBlock", "H1");
              else if (v === "h2") exec("formatBlock", "H2");
              else if (v === "h3") exec("formatBlock", "H3");
              e.target.value = "style";
            }}
            defaultValue="style"
            className="h-8 text-xs rounded-md border border-border bg-white px-2 outline-none cursor-pointer"
            title="نمط الفقرة"
          >
            <option value="style" disabled>
              نمط
            </option>
            <option value="p">فقرة</option>
            <option value="h1">عنوان كبير</option>
            <option value="h2">عنوان متوسط</option>
            <option value="h3">عنوان صغير</option>
          </select>

          <select
            onChange={(e) => {
              exec("fontSize", e.target.value);
              e.target.value = "size";
            }}
            defaultValue="size"
            className="h-8 text-xs rounded-md border border-border bg-white px-2 outline-none cursor-pointer"
            title="حجم الخط"
          >
            <option value="size" disabled>
              الحجم
            </option>
            <option value="2">صغير جداً</option>
            <option value="3">صغير</option>
            <option value="4">عادي</option>
            <option value="5">كبير</option>
            <option value="6">أكبر</option>
            <option value="7">ضخم</option>
          </select>

          <div className="w-px h-5 bg-border mx-1" />

          <button type="button" className={btn} onClick={() => exec("bold")} title="عريض">
            <Bold className="size-4" />
          </button>
          <button type="button" className={btn} onClick={() => exec("italic")} title="مائل">
            <Italic className="size-4" />
          </button>
          <button type="button" className={btn} onClick={() => exec("underline")} title="تحته خط">
            <Underline className="size-4" />
          </button>

          <div className="w-px h-5 bg-border mx-1" />

          <button
            type="button"
            className={btn}
            onClick={() => exec("justifyRight")}
            title="محاذاة لليمين"
          >
            <AlignRight className="size-4" />
          </button>
          <button type="button" className={btn} onClick={() => exec("justifyCenter")} title="توسيط">
            <AlignCenter className="size-4" />
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => exec("justifyLeft")}
            title="محاذاة لليسار"
          >
            <AlignLeft className="size-4" />
          </button>
          <button type="button" className={btn} onClick={() => exec("justifyFull")} title="ضبط">
            <AlignJustify className="size-4" />
          </button>

          <div className="w-px h-5 bg-border mx-1" />

          <button
            type="button"
            className={btn}
            onClick={() => exec("insertUnorderedList")}
            title="قائمة نقطية"
          >
            <List className="size-4" />
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => exec("insertOrderedList")}
            title="قائمة مرقمة"
          >
            <ListOrdered className="size-4" />
          </button>

          <div className="flex-1" />
          <button
            type="button"
            className={btn}
            onClick={() => {
              exec("removeFormat");
              exec("formatBlock", "P");
            }}
            title="إزالة التنسيق"
          >
            <Eraser className="size-4" />
          </button>
        </div>

        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          dir={dir}
          onInput={handleInput}
          onBlur={handleInput}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData("text/plain");
            exec("insertText", text);
          }}
          className="rt-editor w-full px-3 py-2.5 text-sm outline-none whitespace-pre-wrap"
          style={{ minHeight }}
        />
      </div>
    </div>
  );
}
