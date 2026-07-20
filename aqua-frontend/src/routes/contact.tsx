import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  Send,
  CheckCircle2,
  User,
  Briefcase,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { PageHero } from "@/components/Section";
import { FormField } from "@/components/FormField";
import { ApiError } from "@/lib/api-client";
import { usePublicBranches } from "@/lib/branches-api";
import { BranchesAccordion } from "@/components/BranchesAccordion";
import { SocialLinks } from "@/components/SocialLinks";
import { useSubmitMessage } from "@/lib/messages-api";
import { useReveal } from "@/lib/motion";

export const Route = createFileRoute("/contact")({
  // `?subject=` lets a product detail page open this form already
  // identifying the product being asked about. Anything else in the query
  // string is dropped rather than rejected — a shared or stale link with
  // extra params must still open the contact form.
  validateSearch: (search: Record<string, unknown>): { subject?: string } => ({
    subject: typeof search.subject === "string" ? search.subject : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Contact — Aqua Pool Group | اتصل بنا" },
      {
        name: "description",
        content:
          "Get a free consultation. Contact Aqua Pool Group for pool design, finishing, and accessories.",
      },
      { property: "og:title", content: "Contact Aqua Pool Group" },
      {
        property: "og:description",
        content: "Reach our team for inquiries, quotes, and consultations.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { t } = useLang();
  const { data: branches = [] } = usePublicBranches();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formProjectType, setFormProjectType] = useState("");
  const [formBudget, setFormBudget] = useState("");
  const [formTimeline, setFormTimeline] = useState("");
  // Seeded from ?subject= (a product enquiry), and editable from there.
  const [formSubject, setFormSubject] = useState(Route.useSearch().subject ?? "");
  const [formMessage, setFormMessage] = useState("");
  const submitMessage = useSubmitMessage();

  const whyCardRef = useReveal<HTMLDivElement>("scroll");
  const infoGridRef = useReveal<HTMLDivElement>("scroll", { stagger: 0.08 });
  const formHeaderRef = useReveal<HTMLDivElement>("scroll");
  const fieldset1Ref = useReveal<HTMLFieldSetElement>("scroll");
  const fieldset2Ref = useReveal<HTMLFieldSetElement>("scroll");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      city: String(fd.get("city") ?? ""),
      project_type: String(fd.get("projectType") ?? ""),
      budget: String(fd.get("budget") ?? ""),
      timeline: String(fd.get("timeline") ?? ""),
      subject: String(fd.get("subject") ?? ""),
      message: String(fd.get("message") ?? ""),
    };
    try {
      await submitMessage.mutateAsync(payload);
      setSent(true);
      form.reset();
      // form.reset() only restores uncontrolled DOM state; the fields below
      // are now controlled by FormField, so their values must be cleared
      // explicitly or they'd keep showing what was typed after a send.
      setFormName("");
      setFormEmail("");
      setFormPhone("");
      setFormCity("");
      setFormProjectType("");
      setFormBudget("");
      setFormTimeline("");
      setFormSubject("");
      setFormMessage("");
      setTimeout(() => setSent(false), 8000);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "حدث خطأ، حاول مرة أخرى.");
    }
  }

  return (
    <>
      <PageHero title={t.contact.title} subtitle={t.contact.sub} />

      <section className="py-14 sm:py-20 lg:py-28">
        <div className="container-x grid lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Sidebar */}
          <aside className="lg:col-span-2 space-y-6">
            <div
              ref={whyCardRef}
              className="bg-gradient-to-br from-ocean to-deep text-white rounded-3xl p-6 sm:p-7 lg:p-8 shadow-xl shadow-ocean/20"
            >
              <h3 className="text-2xl font-bold mb-2">{t.contact.whyTitle}</h3>
              <p className="text-white/70 text-sm mb-6">{t.contact.formSub}</p>
              <ul className="space-y-3">
                {t.contact.why.map((w, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <ShieldCheck className="size-5 shrink-0 text-teal-foreground/90 mt-0.5" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* The locations themselves are the contact details now —
                each branch reveals its address, phone, email and hours
                when opened, instead of a single set of cards that could
                only ever describe one place. */}
            {/* The heading is inside the guard so it can't sit alone above
                nothing when no branch has been added yet. */}
            {branches.length > 0 && (
              <div ref={infoGridRef}>
                <h3 className="text-sm font-bold text-deep mb-3">{t.contact.branchesTitle}</h3>
                <BranchesAccordion branches={branches} />
              </div>
            )}

            {/* Social accounts are all that remains in the shared contact
                setting; each icon shows only when its link is filled in. */}
            <SocialLinks className="text-muted-foreground" />
          </aside>

          {/* Form card */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
              <div
                ref={formHeaderRef}
                className="px-8 sm:px-10 pt-8 pb-6 border-b border-border bg-gradient-to-b from-sand/30 to-white"
              >
                <h2 className="text-2xl lg:text-3xl font-extrabold text-deep">
                  {t.contact.formTitle}
                </h2>
                <p className="text-sm text-muted-foreground mt-2">{t.contact.formSub}</p>
              </div>

              <form onSubmit={onSubmit} className="px-8 sm:px-10 py-8 space-y-8">
                {sent && (
                  <div className="p-4 bg-teal/10 text-teal rounded-xl flex items-center gap-3 text-sm font-semibold border border-teal/20">
                    <CheckCircle2 className="size-5 shrink-0" />
                    {t.contact.sent}
                  </div>
                )}
                {error && (
                  <div className="p-4 bg-destructive/10 text-destructive rounded-xl flex items-center gap-3 text-sm font-semibold border border-destructive/20">
                    <AlertCircle className="size-5 shrink-0" />
                    {error}
                  </div>
                )}

                {/* Step 1 */}
                <fieldset ref={fieldset1Ref} className="space-y-5">
                  <StepHeading icon={User} index="01" label={t.contact.step1} />
                  <div className="grid md:grid-cols-2 gap-5">
                    <FormField
                      name="name"
                      label={t.contact.name}
                      placeholder={t.contact.namePh}
                      value={formName}
                      onChange={setFormName}
                      required
                    />
                    <FormField
                      name="email"
                      type="email"
                      label={t.contact.email}
                      placeholder={t.contact.emailPh}
                      value={formEmail}
                      onChange={setFormEmail}
                      required
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-5">
                    <FormField
                      name="phone"
                      type="tel"
                      label={t.contact.phone}
                      placeholder={t.contact.phonePh}
                      value={formPhone}
                      onChange={setFormPhone}
                      required
                    />
                    <FormField
                      name="city"
                      label={t.contact.city}
                      placeholder={t.contact.cityPh}
                      value={formCity}
                      onChange={setFormCity}
                    />
                  </div>
                </fieldset>

                {/* Step 2 */}
                <fieldset ref={fieldset2Ref} className="space-y-5">
                  <StepHeading icon={Briefcase} index="02" label={t.contact.step2} />
                  <div className="grid md:grid-cols-2 gap-5">
                    <FormField
                      name="projectType"
                      label={t.contact.projectType}
                      select
                      options={t.contact.projectTypes.map((opt) => ({ value: opt, label: opt }))}
                      value={formProjectType}
                      onChange={setFormProjectType}
                      required
                    />
                    <FormField
                      name="budget"
                      label={t.contact.budget}
                      select
                      options={t.contact.budgets.map((opt) => ({ value: opt, label: opt }))}
                      value={formBudget}
                      onChange={setFormBudget}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-5">
                    <FormField
                      name="timeline"
                      label={t.contact.timeline}
                      select
                      options={t.contact.timelines.map((opt) => ({ value: opt, label: opt }))}
                      value={formTimeline}
                      onChange={setFormTimeline}
                    />
                    <FormField
                      name="subject"
                      label={t.contact.subject}
                      value={formSubject}
                      onChange={setFormSubject}
                    />
                  </div>
                  <FormField
                    name="message"
                    label={t.contact.message}
                    multiline
                    rows={5}
                    value={formMessage}
                    onChange={setFormMessage}
                    required
                  />
                </fieldset>

                <button
                  type="submit"
                  disabled={submitMessage.isPending}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-ocean text-white px-8 py-4 rounded-xl font-bold hover:bg-teal hover:-translate-y-0.5 transition-all shadow-lg shadow-ocean/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitMessage.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {t.contact.sending}
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      {t.contact.send}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function StepHeading({
  icon: Icon,
  index,
  label,
}: {
  icon: typeof User;
  index: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 pb-2 border-b border-dashed border-border">
      <div className="size-10 rounded-xl bg-ocean/10 text-ocean grid place-items-center">
        <Icon className="size-5" />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-teal font-bold">{index}</div>
        <div className="text-sm sm:text-base font-bold text-deep">{label}</div>
      </div>
    </div>
  );
}
