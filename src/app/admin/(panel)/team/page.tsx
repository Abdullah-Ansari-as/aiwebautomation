import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { NoDatabaseNotice, Notice } from "@/components/admin/admin-kit";
import { Card } from "@/components/admin/admin-ui";
import { ActionButton } from "@/components/admin/controls";
import { AddMemberForm, MemberActiveForm, MemberRoleForm } from "@/components/admin/team-forms";
import { Badge } from "@/components/shared/badge";
import { deleteTeamMemberAction, resetTeamPasswordAction } from "@/lib/actions/team";
import { requireAdmin } from "@/lib/auth/session";
import { listTeamMembers } from "@/lib/server/admin-users";
import { isDatabaseConfigured } from "@/lib/server/mongodb";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const session = await requireAdmin("superadmin");
  if (!isDatabaseConfigured()) return <NoDatabaseNotice />;
  const members = await listTeamMembers();

  return (
    <>
      <AdminPageHeader title="Team" description="Give staff or freelancers their own login. Only the super admin can manage the team." />
      <Notice tone="success">
        You are the <strong>super admin</strong> ({session.email}). Your login comes from <code className="font-mono">ADMIN_EMAIL</code> and{" "}
        <code className="font-mono">ADMIN_PASSWORD</code> in the server environment, so it keeps working even if the database is down.
      </Notice>

      <Card title="Add a team member" className="mb-6">
        <div className="p-5">
          <AddMemberForm />
        </div>
      </Card>

      <Card title={`Team members (${members.length})`}>
        {members.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No team members yet. Everyone you add gets a generated password to share with them securely.</p>
        ) : (
          <ul className="divide-y divide-border">
            {members.map((m) => (
              <li key={m.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto_9rem_9rem_8rem] lg:items-center">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                    {m.name} {!m.active && <Badge>Deactivated</Badge>}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{m.email}</p>
                  <p className="text-xs text-muted-foreground">Last sign-in: {m.lastLoginAt ? formatDateTime(m.lastLoginAt) : "never"}</p>
                </div>
                <MemberRoleForm id={m.id} role={m.role} />
                <MemberActiveForm id={m.id} active={m.active} />
                <ActionButton action={resetTeamPasswordAction.bind(null, m.id)} confirm={`Create a new password for ${m.name}? Their current password stops working.`}>
                  Reset password
                </ActionButton>
                <ActionButton action={deleteTeamMemberAction.bind(null, m.id)} variant="danger" confirm={`Remove ${m.name} from the team?`}>
                  Remove
                </ActionButton>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
