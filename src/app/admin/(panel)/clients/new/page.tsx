import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { NoDatabaseNotice } from "@/components/admin/admin-kit";
import { Card } from "@/components/admin/admin-ui";
import { ClientForm } from "@/components/admin/client-form";
import { requireAdmin } from "@/lib/auth/session";
import { getLeadPrefill } from "@/lib/server/clients";
import { isDatabaseConfigured } from "@/lib/server/mongodb";
import { getBusinessSettings } from "@/lib/server/settings";
import { toDateInput } from "@/lib/utils";

export const metadata: Metadata = { title: "New client" };

export default async function NewClientPage({ searchParams }: PageProps<"/admin/clients/new">) {
  await requireAdmin("admin");
  if (!isDatabaseConfigured()) return <NoDatabaseNotice />;
  const params = await searchParams;
  const leadId = typeof params.lead === "string" ? params.lead : "";
  const [prefill, settings] = await Promise.all([leadId ? getLeadPrefill(leadId) : null, getBusinessSettings()]);

  return (
    <>
      <Link href={prefill ? `/admin/leads/${prefill.leadId}` : "/admin/clients"} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {prefill ? "Back to lead" : "All clients"}
      </Link>
      <AdminPageHeader title={prefill ? `Convert ${prefill.name} to a client` : "New client"} description={prefill ? "Details are copied from the lead. Saving marks the lead as Won." : "Add a paying client and their plan."} />
      <Card>
        <div className="p-5 sm:p-6">
          <ClientForm
            clientId={null}
            leadId={prefill?.leadId}
            values={{
              name: prefill?.name ?? "",
              contactName: prefill?.contactName ?? "",
              email: prefill?.email ?? "",
              phone: prefill?.phone ?? "",
              country: "",
              website: prefill?.website ?? "",
              address: "",
              plan: "AI Lead Response",
              currency: settings.defaultCurrency,
              monthlyFee: "",
              setupFee: "",
              billingDay: String(Math.min(28, new Date().getUTCDate())),
              status: "active",
              startDate: toDateInput(new Date()),
              paymentLink: "",
              notes: "",
            }}
          />
        </div>
      </Card>
    </>
  );
}
