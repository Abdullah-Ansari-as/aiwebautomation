/**
 * Admin roles, shared by server and client code.
 *
 * - superadmin — the owner account defined by ADMIN_EMAIL + ADMIN_PASSWORD in
 *   the environment. Can do everything, including managing the team. Works
 *   even when the database is down, so you can never lock yourself out.
 * - admin — team member with full access to business data (leads, clients,
 *   invoices, inbox), but cannot manage team members.
 * - viewer — read-only access, e.g. for an accountant or assistant.
 */
export type AdminRole = "superadmin" | "admin" | "viewer";

/** Roles that can be given to team members stored in the database. */
export const TEAM_ROLES = [
  { value: "admin", label: "Admin", description: "Full access to leads, clients, invoices and inbox. Cannot manage the team." },
  { value: "viewer", label: "Viewer", description: "Read-only access to everything except team settings." },
] as const;

export type TeamRole = (typeof TEAM_ROLES)[number]["value"];

const RANK: Record<AdminRole, number> = { viewer: 1, admin: 2, superadmin: 3 };

export function hasRole(role: AdminRole, minimum: AdminRole): boolean {
  return RANK[role] >= RANK[minimum];
}

export function roleLabel(role: AdminRole): string {
  return role === "superadmin" ? "Super admin" : role === "admin" ? "Admin" : "Viewer";
}

export function isTeamRole(value: string): value is TeamRole {
  return TEAM_ROLES.some((r) => r.value === value);
}
