import { Clock, Mail, Megaphone, PenLine, Rocket, Workflow } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DemoForm } from "@/components/shared/demo-form";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { SocialIcon } from "@/components/shared/social-icons";
import { siteConfig, socialLinks } from "@/data/site";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Contact Us",
  description: "Get in touch with the WebAIAutomation team for questions, corrections, partnerships, advertising or tool submissions.",
  path: "/contact",
});

const shortcuts = [
  { icon: Workflow, title: "Hire us for automation", text: "Request a quote for a project.", href: "/services#quote" },
  { icon: Rocket, title: "Submit an AI tool", text: "Suggest a product for the directory.", href: "/submit-tool" },
  { icon: PenLine, title: "Write for us", text: "Pitch a guide or article.", href: "/write-for-us" },
  { icon: Megaphone, title: "Advertise", text: "Partnership and sponsorship options.", href: "/advertise#sponsor-inquiry" },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="We'd love to hear from you"
        description="Questions, corrections, partnership ideas or feedback on a tool listing — send us a message and the team will get back to you."
        breadcrumbs={[{ name: "Contact Us", href: "/contact" }]}
      />
      <div className="container-site grid gap-10 py-14 lg:grid-cols-[1fr_22rem]">
        <Reveal className="rounded-[1.5rem] border border-border bg-surface p-6 shadow-soft sm:p-8">
          <h2 className="text-xl font-semibold text-foreground">Send a message</h2>
          <p className="mt-1 text-sm text-muted-foreground">Fields marked * are required.</p>
          <div className="mt-6">
            <DemoForm
              submitLabel="Send message"
              successTitle="Your message is ready to go"
              demoNote={
                <>
                  This is a demo: the message passed validation but <strong className="text-foreground">was not sent</strong>. Until the
                  contact backend is connected, please email us at {siteConfig.email}.
                </>
              }
              footer={
                <>
                  By contacting us you agree to our{" "}
                  <Link href="/privacy-policy" className="text-primary hover:underline">
                    privacy policy
                  </Link>
                  .
                </>
              }
              fields={[
                { name: "name", label: "Your name", required: true, autoComplete: "name", half: true, placeholder: "Jane Doe" },
                { name: "email", label: "Email", type: "email", required: true, autoComplete: "email", half: true, placeholder: "jane@company.com" },
                {
                  name: "topic",
                  label: "Topic",
                  type: "select",
                  required: true,
                  options: ["General question", "Correction or update", "Tool listing", "Partnership", "Advertising", "Other"],
                },
                { name: "message", label: "Message", type: "textarea", required: true, minLength: 20, placeholder: "How can we help?" },
              ]}
            />
          </div>
        </Reveal>

        <aside className="space-y-5">
          <Reveal delay={0.05} className="rounded-[var(--radius-card)] border border-border bg-surface p-6">
            <h2 className="font-semibold text-foreground">Contact information</h2>
            <ul className="mt-4 space-y-4 text-sm">
              <li className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  <span className="block text-muted-foreground">Email</span>
                  <a href={`mailto:${siteConfig.email}`} className="font-medium text-foreground hover:text-primary">
                    {siteConfig.email}
                  </a>
                </span>
              </li>
              <li className="flex gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  <span className="block text-muted-foreground">Response time</span>
                  <span className="font-medium text-foreground">We aim to reply within a few business days</span>
                </span>
              </li>
            </ul>
            <div className="mt-6 flex gap-2">
              {socialLinks.map((s) => (
                <a
                  key={s.platform}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
                >
                  <SocialIcon platform={s.platform} />
                </a>
              ))}
            </div>
          </Reveal>
          {shortcuts.map((s, i) => (
            <Reveal key={s.href} delay={0.1 + i * 0.05}>
              <Link href={s.href} className="group flex gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <s.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-medium text-foreground group-hover:text-primary">{s.title}</span>
                  <span className="text-sm text-muted-foreground">{s.text}</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </aside>
      </div>
    </>
  );
}
