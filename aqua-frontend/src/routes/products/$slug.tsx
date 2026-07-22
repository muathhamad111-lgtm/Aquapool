import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { pick, useProductCategories } from "@/lib/content";
import { apiClient } from "@/lib/api-client";
import type { DbProductDetail, DbSpecificationGroup } from "@/lib/admin-api";

export const Route = createFileRoute("/products/$slug")({
  /**
   * Runs on the server for the first render and on the client for
   * navigations. Fetching here rather than in a hook is what lets `head`
   * below build real per-product metadata — without it a shared link
   * previews as the generic site title and a crawler that doesn't run
   * JavaScript sees no product at all.
   */
  loader: async ({ params }) => {
    try {
      return await apiClient.get<DbProductDetail>(`/api/v1/products/${params.slug}`);
    } catch {
      // An unknown slug and an unpublished product are the same 404 from
      // the API, and stay indistinguishable here. notFound() rather than a
      // null return so the response carries a real 404 status — a page that
      // says "not found" while answering 200 is a soft 404, which search
      // engines index as a real page.
      throw notFound();
    }
  },
  notFoundComponent: ProductNotFound,
  head: ({ loaderData }) => {
    if (!loaderData) return {};

    // Arabic first: it's the site's primary language and what the title
    // and captions are actually written in.
    const title = loaderData.title_ar || loaderData.title_en;
    const description = loaderData.caption_ar || loaderData.caption_en || "";

    return {
      meta: [
        { title: `${title} — Aqua Pool Group` },
        { name: "description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        // Both image tags, or neither: the root route sets a site-wide
        // twitter:image, and overriding only og:image would pair the
        // product's title with the generic site picture on X/Twitter.
        ...(loaderData.image_url
          ? [
              { property: "og:image", content: loaderData.image_url },
              { name: "twitter:image", content: loaderData.image_url },
            ]
          : []),
      ],
    };
  },
  component: ProductDetailPage,
});

function ProductNotFound() {
  const { lang } = useLang();

  return (
    <div className="container-x pb-24 pt-32 text-center">
      <ImageOff className="size-10 mx-auto mb-4 text-muted-foreground/40" />
      <h1 className="text-xl font-bold text-deep mb-2">
        {lang === "ar" ? "المنتج غير موجود" : "Product not found"}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        {lang === "ar"
          ? "قد يكون هذا المنتج قد أُزيل أو لم يعد متاحاً."
          : "This product may have been removed or is no longer available."}
      </p>
      <Link
        to="/products"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-deep text-white text-sm font-semibold hover:bg-ocean transition-colors"
      >
        {lang === "ar" ? "العودة إلى الكتالوج" : "Back to catalogue"}
      </Link>
    </div>
  );
}

function ProductDetailPage() {
  const product = Route.useLoaderData();
  const { t, lang } = useLang();
  const { data: categories = [] } = useProductCategories();

  const title = pick(product.title_ar, product.title_en, lang);
  const caption = pick(product.caption_ar, product.caption_en, lang);
  const priceLabel = pick(product.price_label_ar, product.price_label_en, lang);
  const category = categories.find((c) => c.id === product.category_id);

  // pt clears the fixed floating navbar (see components/Navbar.tsx).
  return (
    <div className="pb-10 pt-28 sm:pb-14 sm:pt-32 lg:pb-20">
      <div className="container-x">
        <nav className="mb-6 text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
          <Link to="/products" className="hover:text-deep font-semibold">
            {lang === "ar" ? "المنتجات" : "Products"}
          </Link>
          <span aria-hidden="true">/</span>
          {category && (
            <>
              <span>{pick(category.name_ar, category.name_en, lang)}</span>
              <span aria-hidden="true">/</span>
            </>
          )}
          <span className="text-deep font-semibold truncate max-w-full">{title}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-start">
          <Gallery images={product.images} cover={product.image_url} alt={title} />

          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-deep leading-tight">
              {title}
            </h1>
            {caption && (
              <p className="mt-3 text-sm sm:text-base text-muted-foreground">{caption}</p>
            )}

            {priceLabel && (
              <div className="mt-5 inline-block bg-mint/25 text-deep font-bold px-4 py-2 rounded-xl text-sm">
                {priceLabel}
              </div>
            )}

            <Link
              to="/contact"
              // Prefills the contact form's subject so an enquiry arrives
              // already identifying the product it's about.
              search={{ subject: title }}
              className="mt-6 flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3 rounded-xl bg-deep text-white font-semibold hover:bg-ocean transition-colors"
            >
              {/* The catalogue's existing label, not a new "request a
                  quote" string — several products carry exactly that text
                  as their price_label, and the page would read it twice. */}
              {t.products.inquire}
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>

        {product.specifications.length > 0 && (
          <div className="mt-12 lg:mt-16 space-y-8">
            {product.specifications.map((group, i) => (
              <SpecificationTable key={i} group={group} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main image plus thumbnails. `images` already has the cover first; `cover`
 * is the fallback for a product saved before galleries existed.
 */
function Gallery({ images, cover, alt }: { images: string[]; cover: string; alt: string }) {
  const gallery = images.length > 0 ? images : cover ? [cover] : [];
  const [active, setActive] = useState(0);

  if (gallery.length === 0) {
    return (
      <div className="aspect-square rounded-2xl bg-sand grid place-items-center">
        <ImageOff className="size-10 text-muted-foreground/40" />
      </div>
    );
  }

  const step = (delta: number) => setActive((i) => (i + delta + gallery.length) % gallery.length);

  return (
    // Capped: at full column width on a wide screen an aspect-square image
    // grows past 550px tall and leaves the text column stranded in
    // whitespace.
    <div className="max-w-[28rem] lg:max-w-none mx-auto lg:mx-0">
      <div className="relative aspect-square lg:aspect-[4/3] rounded-2xl overflow-hidden bg-sand border border-border">
        <img src={gallery[active]} alt={alt} className="size-full object-cover" />

        {gallery.length > 1 && (
          <>
            {/* Chevrons point in reading order: in RTL, "previous" is on
                the right and points right. */}
            <GalleryArrow side="start" onClick={() => step(-1)} />
            <GalleryArrow side="end" onClick={() => step(1)} />
          </>
        )}
      </div>

      {gallery.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {gallery.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`${alt} — ${i + 1}`}
              aria-current={i === active}
              className={`size-16 sm:size-20 shrink-0 rounded-xl overflow-hidden border-2 transition-colors ${
                i === active ? "border-deep" : "border-border hover:border-teal/50"
              }`}
            >
              <img src={src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GalleryArrow({ side, onClick }: { side: "start" | "end"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 ${
        side === "start" ? "start-3" : "end-3"
      } size-9 rounded-full bg-white/90 text-deep grid place-items-center hover:bg-white shadow-sm`}
    >
      {side === "start" ? (
        <>
          <ChevronLeft className="size-5 rtl:hidden" />
          <ChevronRight className="size-5 ltr:hidden" />
        </>
      ) : (
        <>
          <ChevronRight className="size-5 rtl:hidden" />
          <ChevronLeft className="size-5 ltr:hidden" />
        </>
      )}
    </button>
  );
}

/**
 * One specification group: a heading and its label/value rows. Two pairs per
 * row on wide screens, one on mobile — matching how spec sheets are read.
 */
function SpecificationTable({ group, lang }: { group: DbSpecificationGroup; lang: "ar" | "en" }) {
  const title = pick(group.title_ar, group.title_en, lang);
  // A group can legitimately have no heading — the fields still render.
  const fields = group.fields.filter(
    (f) => pick(f.label_ar, f.label_en, lang) || pick(f.value_ar, f.value_en, lang),
  );

  if (fields.length === 0) return null;

  return (
    <section>
      {title && <h2 className="text-base sm:text-lg font-bold text-deep mb-3">{title}</h2>}
      <div className="border border-border rounded-xl overflow-hidden">
        <dl className="grid sm:grid-cols-2">
          {fields.map((field, i) => (
            <div
              key={i}
              className="flex border-b border-border last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0 sm:odd:border-e sm:odd:border-border"
            >
              <dt className="w-2/5 shrink-0 px-4 py-3 text-xs sm:text-sm text-muted-foreground bg-muted/30">
                {pick(field.label_ar, field.label_en, lang)}
              </dt>
              <dd className="flex-1 px-4 py-3 text-xs sm:text-sm font-semibold text-deep break-words">
                {pick(field.value_ar, field.value_en, lang)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
