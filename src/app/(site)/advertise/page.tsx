import { InquiryForm } from "@/components/services/inquiry-form";
import { InfoPageView, infoPageMetadata } from "@/components/shared/info-page";

export const metadata = infoPageMetadata("advertise");

export default function Page() {
  return (
    <InfoPageView slug="advertise">
      <section id="sponsor-inquiry" className="mt-12 scroll-mt-28 rounded-[1.5rem] border border-border bg-surface p-6 shadow-soft sm:p-8" aria-labelledby="sponsor-inquiry-heading">
        <h2 id="sponsor-inquiry-heading" className="text-xl font-semibold text-foreground">
          Sponsorship inquiry
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Register your interest and we&apos;ll reply with availability. Sponsorship never affects listings, reviews or recommendations.
        </p>
        <div className="mt-6">
          <InquiryForm kind="sponsor" submitLabel="Send inquiry" />
        </div>
      </section>
    </InfoPageView>
  );
}
