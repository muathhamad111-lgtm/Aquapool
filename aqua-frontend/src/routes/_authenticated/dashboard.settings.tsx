import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { useSiteSettings, useUpdateSiteSetting } from "@/lib/settings-api";
import { RichTextArea } from "@/components/admin/RichTextArea";
import { AdminField } from "@/components/admin/AdminField";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Award,
  Lightbulb,
  HeartHandshake,
  CheckCircle2,
  Shield,
  Sparkles,
  Users,
  Star,
  Gem,
  Trophy,
} from "lucide-react";

const VALUE_ICONS = {
  Award,
  Lightbulb,
  HeartHandshake,
  CheckCircle2,
  Shield,
  Sparkles,
  Users,
  Star,
  Gem,
  Trophy,
} as const;
export type ValueIcon = keyof typeof VALUE_ICONS;
export type ValueItem = {
  icon: ValueIcon;
  title_ar: string;
  title_en: string;
  desc_ar: string;
  desc_en: string;
};
type Values = {
  title_ar: string;
  title_en: string;
  eyebrow_ar: string;
  eyebrow_en: string;
  items: ValueItem[];
};

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
  ssr: false,
  component: SettingsAdmin,
});

type Contact = {
  phone: string;
  whatsapp: string;
  email: string;
  address_ar: string;
  address_en: string;
  hours_ar: string;
  hours_en: string;
  instagram: string;
  facebook: string;
  twitter: string;
  linkedin: string;
};
type Hero = {
  title_ar: string;
  title_en: string;
  subtitle_ar: string;
  subtitle_en: string;
  cta_label_ar: string;
  cta_label_en: string;
};
type About = {
  story_ar: string;
  story_en: string;
  mission_ar: string;
  mission_en: string;
  vision_ar: string;
  vision_en: string;
};

const DEFAULTS = {
  contact: {
    phone: "+966 11 000 0000",
    whatsapp: "+966500000000",
    email: "info@aqua-pool-group.com",
    address_ar: "الرياض، المملكة العربية السعودية",
    address_en: "Riyadh, Saudi Arabia",
    hours_ar: "السبت - الخميس · 9 صباحاً - 6 مساءً",
    hours_en: "Sat - Thu · 9 AM - 6 PM",
    instagram: "",
    facebook: "",
    twitter: "",
    linkedin: "",
  } as Contact,
  hero: {
    title_ar: "",
    title_en: "",
    subtitle_ar: "",
    subtitle_en: "",
    cta_label_ar: "",
    cta_label_en: "",
  } as Hero,
  about: {
    story_ar: "",
    story_en: "",
    mission_ar: "",
    mission_en: "",
    vision_ar: "",
    vision_en: "",
  } as About,
  values: {
    eyebrow_ar: "ما نؤمن به",
    eyebrow_en: "What we stand for",
    title_ar: "قيمنا",
    title_en: "Our Values",
    items: [
      {
        icon: "Award",
        title_ar: "الجودة أولاً",
        title_en: "Quality First",
        desc_ar: "نستخدم أفضل المواد العالمية ونلتزم بأعلى معايير التنفيذ.",
        desc_en: "We use top global materials and uphold the highest execution standards.",
      },
      {
        icon: "Lightbulb",
        title_ar: "الابتكار",
        title_en: "Innovation",
        desc_ar: "نواكب أحدث التقنيات في عالم المسابح لنقدمها لعملائنا.",
        desc_en: "We bring the latest pool technologies to our clients.",
      },
      {
        icon: "HeartHandshake",
        title_ar: "رضا العميل",
        title_en: "Client Satisfaction",
        desc_ar: "نجاحنا الحقيقي يقاس بابتسامة عملائنا ورضاهم الدائم.",
        desc_en: "Our true success is measured by lasting client satisfaction.",
      },
      {
        icon: "CheckCircle2",
        title_ar: "الالتزام",
        title_en: "Commitment",
        desc_ar: "نسلم في الوقت المتفق عليه وفي حدود الميزانية المعتمدة.",
        desc_en: "We deliver on time and within the agreed budget.",
      },
    ],
  } as Values,
};

function useSetting<T>(key: string, defaults: T) {
  const { data: all, isLoading } = useSiteSettings();
  const raw = all?.[key] as Record<string, unknown> | undefined;
  const data = useMemo(() => {
    if (!raw) return undefined;
    const merged: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
    for (const k of Object.keys(raw)) {
      if (raw[k] !== null) merged[k] = raw[k];
    }
    return merged as T;
  }, [raw, defaults]);
  return { data, isLoading };
}

function useSaveSetting(key: string) {
  const mutation = useUpdateSiteSetting(key);
  return {
    isPending: mutation.isPending,
    mutate: (value: unknown) => {
      mutation.mutate(value, {
        onSuccess: () => toast.success("تم حفظ الإعدادات"),
        onError: (e) => toast.error(e instanceof ApiError ? e.message : "خطأ"),
      });
    },
  };
}

function SettingsAdmin() {
  const [tab, setTab] = useState<"hero" | "about" | "values" | "contact">("hero");
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap border-b border-border">
        {[
          { k: "hero", l: "البطل الرئيسي" },
          { k: "about", l: "من نحن" },
          { k: "values", l: "قيمنا" },
          { k: "contact", l: "التواصل والروابط" },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as typeof tab)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${
              tab === t.k
                ? "border-teal text-deep"
                : "border-transparent text-muted-foreground hover:text-deep"
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {tab === "hero" && <HeroForm />}
      {tab === "about" && <AboutForm />}
      {tab === "values" && <ValuesForm />}
      {tab === "contact" && <ContactForm />}
    </div>
  );
}

function HeroForm() {
  const q = useSetting<Hero>("hero", DEFAULTS.hero);
  const save = useSaveSetting("hero");
  const [v, setV] = useState<Hero>(DEFAULTS.hero);
  useEffect(() => {
    if (q.data) setV(q.data);
  }, [q.data]);
  if (q.isLoading) return <Spinner />;
  return (
    <Card title="القسم الرئيسي (Hero)">
      <Grid>
        <AdminField
          label="العنوان (عربي)"
          value={v.title_ar}
          onChange={(x) => setV({ ...v, title_ar: x })}
        />
        <AdminField
          label="العنوان (إنجليزي)"
          value={v.title_en}
          onChange={(x) => setV({ ...v, title_en: x })}
          dir="ltr"
        />
        <AdminField
          label="العنوان الفرعي (عربي)"
          multiline
          rows={3}
          value={v.subtitle_ar}
          onChange={(x) => setV({ ...v, subtitle_ar: x })}
        />
        <AdminField
          label="العنوان الفرعي (إنجليزي)"
          multiline
          rows={3}
          value={v.subtitle_en}
          onChange={(x) => setV({ ...v, subtitle_en: x })}
          dir="ltr"
        />
        <AdminField
          label="نص الزر (عربي)"
          value={v.cta_label_ar}
          onChange={(x) => setV({ ...v, cta_label_ar: x })}
        />
        <AdminField
          label="نص الزر (إنجليزي)"
          value={v.cta_label_en}
          onChange={(x) => setV({ ...v, cta_label_en: x })}
          dir="ltr"
        />
      </Grid>
      <SaveBtn pending={save.isPending} onClick={() => save.mutate(v)} />
    </Card>
  );
}

function AboutForm() {
  const q = useSetting<About>("about", DEFAULTS.about);
  const save = useSaveSetting("about");
  const [v, setV] = useState<About>(DEFAULTS.about);
  useEffect(() => {
    if (q.data) setV(q.data);
  }, [q.data]);
  if (q.isLoading) return <Spinner />;
  return (
    <Card title="من نحن">
      <Grid>
        <RichTextArea
          label="قصتنا (عربي)"
          minHeight={180}
          value={v.story_ar}
          onChange={(x) => setV({ ...v, story_ar: x })}
          dir="rtl"
        />
        <RichTextArea
          label="قصتنا (إنجليزي)"
          minHeight={180}
          value={v.story_en}
          onChange={(x) => setV({ ...v, story_en: x })}
          dir="ltr"
        />
        <RichTextArea
          label="رسالتنا (عربي)"
          value={v.mission_ar}
          onChange={(x) => setV({ ...v, mission_ar: x })}
          dir="rtl"
        />
        <RichTextArea
          label="رسالتنا (إنجليزي)"
          value={v.mission_en}
          onChange={(x) => setV({ ...v, mission_en: x })}
          dir="ltr"
        />
        <RichTextArea
          label="رؤيتنا (عربي)"
          value={v.vision_ar}
          onChange={(x) => setV({ ...v, vision_ar: x })}
          dir="rtl"
        />
        <RichTextArea
          label="رؤيتنا (إنجليزي)"
          value={v.vision_en}
          onChange={(x) => setV({ ...v, vision_en: x })}
          dir="ltr"
        />
      </Grid>
      <SaveBtn pending={save.isPending} onClick={() => save.mutate(v)} />
    </Card>
  );
}

function ValuesForm() {
  const q = useSetting<Values>("values", DEFAULTS.values);
  const save = useSaveSetting("values");
  const [v, setV] = useState<Values>(DEFAULTS.values);
  useEffect(() => {
    if (q.data) setV(q.data);
  }, [q.data]);
  if (q.isLoading) return <Spinner />;

  const updateItem = (i: number, patch: Partial<ValueItem>) => {
    const items = [...v.items];
    items[i] = { ...items[i], ...patch };
    setV({ ...v, items });
  };
  const removeItem = (i: number) => setV({ ...v, items: v.items.filter((_, idx) => idx !== i) });
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= v.items.length) return;
    const items = [...v.items];
    [items[i], items[j]] = [items[j], items[i]];
    setV({ ...v, items });
  };
  const addItem = () =>
    setV({
      ...v,
      items: [...v.items, { icon: "Star", title_ar: "", title_en: "", desc_ar: "", desc_en: "" }],
    });

  return (
    <>
      <Card title="عنوان القسم">
        <Grid>
          <AdminField
            label="العنوان التمهيدي (عربي)"
            value={v.eyebrow_ar}
            onChange={(x) => setV({ ...v, eyebrow_ar: x })}
          />
          <AdminField
            label="العنوان التمهيدي (إنجليزي)"
            value={v.eyebrow_en}
            onChange={(x) => setV({ ...v, eyebrow_en: x })}
            dir="ltr"
          />
          <AdminField
            label="العنوان (عربي)"
            value={v.title_ar}
            onChange={(x) => setV({ ...v, title_ar: x })}
          />
          <AdminField
            label="العنوان (إنجليزي)"
            value={v.title_en}
            onChange={(x) => setV({ ...v, title_en: x })}
            dir="ltr"
          />
        </Grid>
      </Card>

      <Card title="القيم">
        <div className="space-y-4">
          {v.items.map((it, i) => {
            const Icon = VALUE_ICONS[it.icon] ?? Star;
            return (
              <div key={i} className="rounded-2xl border border-border p-4 bg-sand/30">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="size-9 rounded-xl bg-mint/20 grid place-items-center">
                      <Icon className="size-5 text-teal" />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">القيمة #{i + 1}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      className="p-1.5 rounded-lg hover:bg-white"
                      title="أعلى"
                    >
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      className="p-1.5 rounded-lg hover:bg-white"
                      title="أسفل"
                    >
                      <ArrowDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="p-1.5 rounded-lg hover:bg-white text-red-600"
                      title="حذف"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                <Grid>
                  <AdminField
                    label="الأيقونة"
                    select
                    options={Object.keys(VALUE_ICONS).map((k) => ({ value: k, label: k }))}
                    value={it.icon}
                    onChange={(x) => updateItem(i, { icon: x as ValueIcon })}
                  />
                  <div />
                  <AdminField
                    label="العنوان (عربي)"
                    value={it.title_ar}
                    onChange={(x) => updateItem(i, { title_ar: x })}
                  />
                  <AdminField
                    label="العنوان (إنجليزي)"
                    value={it.title_en}
                    onChange={(x) => updateItem(i, { title_en: x })}
                    dir="ltr"
                  />
                  <AdminField
                    label="الوصف (عربي)"
                    multiline
                    rows={3}
                    value={it.desc_ar}
                    onChange={(x) => updateItem(i, { desc_ar: x })}
                  />
                  <AdminField
                    label="الوصف (إنجليزي)"
                    multiline
                    rows={3}
                    value={it.desc_en}
                    onChange={(x) => updateItem(i, { desc_en: x })}
                    dir="ltr"
                  />
                </Grid>
              </div>
            );
          })}
          <button
            type="button"
            onClick={addItem}
            className="w-full inline-flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-2xl py-3 text-sm font-bold text-deep hover:border-teal hover:bg-mint/10"
          >
            <Plus className="size-4" /> إضافة قيمة جديدة
          </button>
        </div>
        <SaveBtn pending={save.isPending} onClick={() => save.mutate(v)} />
      </Card>
    </>
  );
}

function ContactForm() {
  const q = useSetting<Contact>("contact", DEFAULTS.contact);
  const save = useSaveSetting("contact");
  const [v, setV] = useState<Contact>(DEFAULTS.contact);
  useEffect(() => {
    if (q.data) setV(q.data);
  }, [q.data]);
  if (q.isLoading) return <Spinner />;
  return (
    <>
      <Card title="معلومات التواصل">
        <Grid>
          <AdminField
            label="الهاتف"
            value={v.phone}
            onChange={(x) => setV({ ...v, phone: x })}
            dir="ltr"
          />
          <AdminField
            label="واتساب"
            value={v.whatsapp}
            onChange={(x) => setV({ ...v, whatsapp: x })}
            dir="ltr"
          />
          <AdminField
            label="البريد"
            value={v.email}
            onChange={(x) => setV({ ...v, email: x })}
            dir="ltr"
          />
          <AdminField
            label="ساعات العمل (عربي)"
            value={v.hours_ar}
            onChange={(x) => setV({ ...v, hours_ar: x })}
          />
          <AdminField
            label="ساعات العمل (إنجليزي)"
            value={v.hours_en}
            onChange={(x) => setV({ ...v, hours_en: x })}
            dir="ltr"
          />
          <div />
          <AdminField
            label="العنوان (عربي)"
            value={v.address_ar}
            onChange={(x) => setV({ ...v, address_ar: x })}
          />
          <AdminField
            label="العنوان (إنجليزي)"
            value={v.address_en}
            onChange={(x) => setV({ ...v, address_en: x })}
            dir="ltr"
          />
        </Grid>
      </Card>
      <Card title="وسائل التواصل الاجتماعي">
        <Grid>
          <AdminField
            label="Instagram URL"
            value={v.instagram}
            onChange={(x) => setV({ ...v, instagram: x })}
            dir="ltr"
          />
          <AdminField
            label="Facebook URL"
            value={v.facebook}
            onChange={(x) => setV({ ...v, facebook: x })}
            dir="ltr"
          />
          <AdminField
            label="Twitter / X URL"
            value={v.twitter}
            onChange={(x) => setV({ ...v, twitter: x })}
            dir="ltr"
          />
          <AdminField
            label="LinkedIn URL"
            value={v.linkedin}
            onChange={(x) => setV({ ...v, linkedin: x })}
            dir="ltr"
          />
        </Grid>
        <SaveBtn pending={save.isPending} onClick={() => save.mutate(v)} />
      </Card>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-border rounded-2xl p-6 space-y-5 mb-5">
      <h2 className="font-bold text-deep">{title}</h2>
      {children}
    </section>
  );
}
function Grid({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 4 }) {
  return (
    <div className={`grid ${cols === 4 ? "grid-cols-2 lg:grid-cols-4" : "md:grid-cols-2"} gap-4`}>
      {children}
    </div>
  );
}
function SaveBtn({ onClick, pending }: { onClick: () => void; pending: boolean }) {
  return (
    <div className="pt-2 flex justify-end">
      <button
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center gap-2 bg-deep text-white px-5 py-2.5 rounded-xl font-bold hover:bg-ocean disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} حفظ
        التغييرات
      </button>
    </div>
  );
}
function Spinner() {
  return (
    <div className="bg-white border border-border rounded-2xl p-12 grid place-items-center">
      <Loader2 className="size-5 animate-spin text-teal" />
    </div>
  );
}
