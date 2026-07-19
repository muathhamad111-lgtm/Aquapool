import { useState, type ChangeEvent } from "react";
import { Loader2, Upload, X, ImageIcon } from "lucide-react";
import { uploadSiteImage } from "@/lib/admin-api";

export const DEFAULT_PLACEHOLDER_IMAGE = "/site/placeholder.jpg";

export function ImageUpload({
  value,
  onChange,
  folder,
  label = "الصورة",
  recommended,
  placeholder = DEFAULT_PLACEHOLDER_IMAGE,
}: {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  label?: string;
  /** Recommended dimensions hint, e.g. "1200 × 900 بكسل (نسبة 4:3)" */
  recommended?: string;
  /** Fallback preview when no image is uploaded */
  placeholder?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadSiteImage(file, folder);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل رفع الصورة");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const showingPlaceholder = !value;

  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
        {label}
      </label>
      <div className="flex items-start gap-3">
        <div className="relative size-24 rounded-xl overflow-hidden border border-border shrink-0 bg-muted">
          <img
            src={value || placeholder}
            alt=""
            className={`size-full object-cover ${showingPlaceholder ? "opacity-90" : ""}`}
          />
          {showingPlaceholder && (
            <div className="absolute inset-0 grid place-items-center bg-deep/40">
              <ImageIcon className="size-5 text-white/90" />
            </div>
          )}
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-1 ltr:right-1 rtl:left-1 size-6 rounded-full bg-deep/80 text-white grid place-items-center hover:bg-destructive"
              aria-label="إزالة الصورة"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-white hover:bg-muted text-sm font-semibold cursor-pointer transition-colors">
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {uploading ? "جاري الرفع..." : value ? "استبدال الصورة" : "رفع صورة"}
            <input
              type="file"
              accept="image/*"
              onChange={onFile}
              className="hidden"
              disabled={uploading}
            />
          </label>
          {error && <p className="text-xs text-destructive mt-2">{error}</p>}
          <div className="mt-2 space-y-0.5">
            {recommended && (
              <p className="text-[11px] font-semibold text-deep">
                الأبعاد المُوصى بها: {recommended}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">JPG / PNG / WebP — حتى 5MB.</p>
            {showingPlaceholder && (
              <p className="text-[11px] text-muted-foreground">
                سيتم استخدام صورة افتراضية بشعار الموقع في حال لم يتم رفع صورة.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
