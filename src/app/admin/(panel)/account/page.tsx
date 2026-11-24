import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Row } from "@/components/admin/admin-kit";
import { Card } from "@/components/admin/admin-ui";
import { ChangePasswordForm } from "@/components/admin/team-forms";
import { TEAM_ROLES, roleLabel } from "@/lib/auth/roles";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const session = await requireAdmin();
  const description = session.role === "superadmin" ? "Full access, including team management and settings." : TEAM_ROLES.find((r) => r.value === session.role)?.description;

  return (
    <>
      <AdminPageHeader title="My account" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Profile">
          <dl className="space-y-4 p-5">
            <Row label="Name">{session.name}</Row>
            <Row label="Email (login)">{session.email}</Row>
            <Row label="Role">
              {roleLabel(session.role)} — <span className="font-normal text-muted-foreground">{description}</span>
            </Row>
          </dl>
        </Card>
        <Card title="Password">
          <div className="p-5">
            {session.role === "superadmin" ? (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  The super admin password is the <code className="font-mono text-foreground">ADMIN_PASSWORD</code> value in your server&apos;s environment file
                  (<code className="font-mono text-foreground">.env.local</code> locally, <code className="font-mono text-foreground">.env.production.local</code> on the server).
                </p>
                <p>To change it, edit that value (12+ characters) and restart the app. Changing it signs out every session.</p>
              </div>
            ) : (
              <ChangePasswordForm />
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
