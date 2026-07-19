import { useState, type ChangeEvent } from "react";
import { ChevronLeft, ChevronRight, ImageIcon, Loader2, Star, Upload, X } from "lucide-react";
import { uploadSiteImage } from "@/lib/admin-api";

const MAX_IMAGES = 20;

/**
 * Multi-image manager. The first image is the cover — the API derives
 * `image_url` from `images[0]`, so reordering here is what changes which
 * image the catalogue card shows.
 */
export function GalleryUpload({
  value,
  onChange,
  folder,
  label = "الصور",
  recommended,
}: {
  value: string[];
  onChange: (images: string[]) => void;
  folder: string;
  label?: string;
  recommended?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      const room = MAX_IMAGES - value.length;
      if (files.length > room) {
        setError(`يمكن رفع ${MAX_IMAGES} صورة كحد أقصى — سيتم رفع ${Math.max(room, 0)} فقط.`);
      }
      // The upload endpoint takes one file per request, so a multi-select
      // is uploaded in parallel and appended in the order chosen.
      const urls = await Promise.all(
        files.slice(0, Math.max(room, 0)).map((file) => uploadSiteImage(file, folder)),
      );
      if (urls.length > 0) onChange([...value, ...urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل رفع الصورة");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));

  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
        {label}
      </label>

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-3 mb-3">
          {value.map((url, i) => (
            <li
              key={url + i}
              className={`relative size-24 rounded-xl overflow-hidden border-2 group ${
                i === 0 ? "border-teal" : "border-border"
              }`}
            >
              <img src={url} alt="" className="size-full object-cover" />

              {i === 0 && (
                <span className="absolute top-1 start-1 inline-flex items-center gap-1 bg-teal text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                  <Star className="size-2.5" /> الغلاف
                </span>
              )}

              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 end-1 size-6 rounded-full bg-deep/80 text-white grid place-items-center hover:bg-destructive"
                aria-label="حذف الصورة"
              >
                <X className="size-3" />
              </button>

              <div className="absolute inset-x-0 bottom-0 flex opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => move(i, i - 1)}
                  disabled={i === 0}
                  className="flex-1 bg-deep/80 text-white py-1 grid place-items-center hover:bg-deep disabled:opacity-30"
                  aria-label="تحريك للخلف"
                >
                  <ChevronRight className="size-3.5 rtl:hidden" />
                  <ChevronLeft className="size-3.5 ltr:hidden" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, i + 1)}
                  disabled={i === value.length - 1}
                  className="flex-1 bg-deep/80 text-white py-1 grid place-items-center hover:bg-deep disabled:opacity-30"
                  aria-label="تحريك للأمام"
                >
                  <ChevronLeft className="size-3.5 rtl:hidden" />
                  <ChevronRight className="size-3.5 ltr:hidden" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {value.length === 0 && (
        <div className="size-24 rounded-xl border border-border bg-muted grid place-items-center mb-3">
          <ImageIcon className="size-5 text-muted-foreground" />
        </div>
      )}

      <label
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-white text-sm font-semibold transition-colors ${
          uploading || value.length >= MAX_IMAGES
            ? "opacity-60 cursor-not-allowed"
            : "hover:bg-muted cursor-pointer"
        }`}
      >
        {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        {uploading ? "جاري الرفع..." : value.length > 0 ? "إضافة صور" : "رفع صور"}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={onFiles}
          className="hidden"
          disabled={uploading || value.length >= MAX_IMAGES}
        />
      </label>

      {error && <p className="text-xs text-destructive mt-2">{error}</p>}

      <div className="mt-2 space-y-0.5">
        {recommended && (
          <p className="text-[11px] font-semibold text-deep">الأبعاد المُوصى بها: {recommended}</p>
        )}
        <p className="text-[11px] text-muted-foreground">
          JPG / PNG / WebP — حتى 5MB لكل صورة، بحد أقصى {MAX_IMAGES} صورة.
        </p>
        <p className="text-[11px] text-muted-foreground">
          الصورة الأولى هي صورة الغلاف التي تظهر في الكتالوج — استخدم الأسهم لإعادة الترتيب.
        </p>
      </div>
    </div>
  );
}
