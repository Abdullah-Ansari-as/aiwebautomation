import { CircleCheck, CircleX } from "lucide-react";
import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Card } from "@/components/admin/admin-ui";
import { SettingsForm, ThemePicker } from "@/components/admin/settings-form";
import { hasRole } from "@/lib/auth/roles";
import { getSuperadminEmail, requireAdmin } from "@/lib/auth/session";
import { getAppUrl } from "@/lib/server/app-url";
import { getEmailConfig } from "@/lib/server/email";
import { getDatabaseName, getDb, isDatabaseConfigured } from "@/lib/server/mongodb";
import { getBusinessSettings } from "@/lib/server/settings";

export const metadata: Metadata = { title: "Settings" };

async function databaseStatus(): Promise<{ ok: boolean; detail: string }> {
  if (!isDatabaseConfigured()) return { ok: false, detail: "MONGODB_URI is not set" };
  try {
    await (await getDb()).command({ ping: 1 });
    const uri = process.env.MONGODB_URI ?? "";
    const where = uri.startsWith("mongodb+srv://") ? "MongoDB Atlas (cloud)" : /127\.0\.0\.1|localhost/.test(uri) ? "local MongoDB" : "MongoDB server";
    return { ok: true, detail: `Connected to ${where}, database “${getDatabaseName()}”` };
  } catch {
    return { ok: false, detail: "Configured but not reachable — check the connection string and network access" };
  }
}

export default async function SettingsPage() {
  const session = await requireAdmin();
  const [settings, db] = await Promise.all([getBusinessSettings(), databaseStatus()]);
  const email = getEmailConfig();
  const status = [
    { label: "Database", ...db },
    { label: "Email notifications (Resend)", ok: email.ok, detail: email.ok ? `Sending from ${email.from} — notifications go to ${email.to}` : email.reason === "missing" ? "Set RESEND_API_KEY and EMAIL_FROM to email leads, messages and invoices" : email.reason },
    { label: "Super admin login", ok: true, detail: getSuperadminEmail() },
    { label: "Links in emails", ok: true, detail: `${getAppUrl()} (set APP_URL to change)` },
    { label: "WhatsApp button", ok: Boolean(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER), detail: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ? "Shown on the Services page" : "Set NEXT_PUBLIC_WHATSAPP_NUMBER and rebuild to show WhatsApp buttons" },
  ];

  return (
    <>
      <AdminPageHeader title="Settings" description="Business details for invoices, payment options and system status." />
      <div className="space-y-6">
        <Card title="Business & invoices">
          <div className="p-5 sm:p-6">
            <SettingsForm readOnly={!hasRole(session.role, "admin")} values={{ ...settings }} />
          </div>
        </Card>

        <Card title="System status">
          <ul id="system" className="divide-y divide-border">
            {status.map((s) => (
              <li key={s.label} className="flex items-start gap-3 px-5 py-3.5">
                {s.ok ? <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" /> : <CircleX className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />}
                <div>
                  <p className="text-sm font-medium text-foreground">{s.label}</p>
                  <p className="text-sm text-muted-foreground">{s.detail}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
            Site name, SEO and contact details shown on the public website are set in <code className="font-mono">src/data/site.ts</code> and published with each deploy.
          </p>
        </Card>

        <Card title="Theme">
          <div className="p-5">
            <p className="mb-4 text-sm text-muted-foreground">How the dashboard and website look on this device (stored in your browser).</p>
            <ThemePicker />
          </div>
        </Card>
      </div>
    </>
  );
}
