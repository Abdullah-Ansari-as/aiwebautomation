import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { UnsubscribeForm } from "@/components/shared/unsubscribe-form";
import { PageHero } from "@/components/shared/page-hero";
import { Skeleton } from "@/components/shared/skeleton";
import { isDatabaseConfigured } from "@/lib/server/mongodb";
import { findByToken } from "@/lib/server/subscribers";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

/**
 * Linked from every newsletter email. Unsubscribing needs an explicit click
 * (a POST), so email scanners that prefetch links can't unsubscribe people.
 */
export default function UnsubscribePage({ searchParams }: PageProps<"/newsletter/unsubscribe">) {
  return (
    <>
      <PageHero eyebrow="Newsletter" title="Manage your subscription" />
      <div className="container-site max-w-xl py-14">
        <div className="rounded-[1.5rem] border border-border bg-surface p-6 shadow-soft sm:p-8">
          <Suspense fallback={<Skeleton className="h-28 w-full" />}>
            <UnsubscribeContent searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </>
  );
}

async function UnsubscribeContent({ searchParams }: { searchParams: PageProps<"/newsletter/unsubscribe">["searchParams"] }) {
  await connection();
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  const subscriber = isDatabaseConfigured() && token ? await findByToken(token).catch(() => null) : null;

  if (!subscriber) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-foreground">This link isn&apos;t valid</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The unsubscribe link may be incomplete or expired. Use the link from your latest email, or{" "}
          <Link href="/contact" className="text-primary hover:underline">
            contact us
          </Link>{" "}
          and we&apos;ll remove you.
        </p>
      </div>
    );
  }

  return <UnsubscribeForm token={token} maskedEmail={subscriber.maskedEmail} alreadyUnsubscribed={subscriber.status === "unsubscribed"} />;
}
