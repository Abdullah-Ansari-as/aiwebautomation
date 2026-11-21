import type { Metadata } from "next";
import Link from "next/link";
import { DemoForm } from "@/components/shared/demo-form";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { toolCategories } from "@/data/categories";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Submit an AI Tool",
  description: "Suggest an AI tool for the WebAIAutomation directory. Every submission is reviewed by our editors against our editorial policy.",
  path: "/submit-tool",
});

const criteria = [
  "The product is publicly available (not waitlist-only).",
  "It has a clear, working website and documented pricing model.",
  "It solves a real problem in one of our categories.",
  "Submissions are reviewed editorially — listing is not guaranteed and cannot be bought.",
];

export default function SubmitToolPage() {
  return (
    <>
      <PageHero
        eyebrow="Submit a tool"
        title="Suggest an AI tool for the directory"
        description="Know a useful AI product we haven't listed? Tell us about it. Our editors review every suggestion before anything is published."
        breadcrumbs={[
          { name: "AI Tools", href: "/tools" },
          { name: "Submit a Tool", href: "/submit-tool" },
        ]}
      />
      <div className="container-site grid gap-10 py-14 lg:grid-cols-[1fr_20rem]">
        <Reveal className="rounded-[1.5rem] border border-border bg-surface p-6 shadow-soft sm:p-8">
          <DemoForm
            submitLabel="Submit for review"
            successTitle="Submission validated"
            demoNote={
              <>
                This is a demo: your submission <strong className="text-foreground">was not sent or stored</strong>. Once the submissions
                backend is connected, entries will appear in the editors&apos; review queue.
              </>
            }
            fields={[
              { name: "toolName", label: "Tool name", required: true, half: true, placeholder: "e.g. Acme Writer" },
              { name: "website", label: "Website URL", type: "url", required: true, half: true, placeholder: "https://" },
              { name: "category", label: "Category", type: "select", required: true, half: true, options: toolCategories.map((c) => c.name) },
              { name: "pricing", label: "Pricing model", type: "select", required: true, half: true, options: ["Free", "Freemium", "Paid"] },
              {
                name: "description",
                label: "What does it do?",
                type: "textarea",
                required: true,
                minLength: 40,
                placeholder: "Describe the main features and who it's for.",
              },
              { name: "email", label: "Your email", type: "email", required: true, autoComplete: "email", half: true, hint: "Only used to contact you about this submission." },
              { name: "relationship", label: "Your relationship to the tool", type: "select", half: true, options: ["Founder / team member", "User", "Other"] },
            ]}
          />
        </Reveal>
        <aside>
          <Reveal delay={0.05} className="rounded-[var(--radius-card)] border border-border bg-surface p-6">
            <h2 className="font-semibold text-foreground">Listing criteria</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {criteria.map((c) => (
                <li key={c} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  {c}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-muted-foreground">
              Read our{" "}
              <Link href="/editorial-policy" className="font-medium text-primary hover:underline">
                editorial policy
              </Link>{" "}
              for details.
            </p>
          </Reveal>
        </aside>
      </div>
    </>
  );
}
