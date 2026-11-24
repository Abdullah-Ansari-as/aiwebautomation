import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { siteConfig } from "@/data/site";
import { requireAdmin } from "@/lib/auth/session";
import { getNavBadges } from "@/lib/server/dashboard";

export const metadata: Metadata = {
  title: { default: "Admin Dashboard", template: `%s · Admin | ${siteConfig.name}` },
  robots: { index: false, follow: false },
};

/**
 * Private dashboard: every request is rendered on the server for the signed-in
 * admin, so there is no static shell to prerender.
 */
export const instant = false;

/**
 * Admin area. Access is gated by `src/proxy.ts` (signed session cookie) and
 * every data read / mutation re-checks the session and role (`requireAdmin`).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const badges = await getNavBadges();
  return (
    <AdminShell user={{ name: session.name, email: session.email, role: session.role }} badges={badges}>
      {children}
    </AdminShell>
  );
}
