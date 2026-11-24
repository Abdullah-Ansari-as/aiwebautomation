"use server";

import { refresh } from "next/cache";
import { generatePassword, passwordProblem } from "@/lib/auth/passwords";
import { isTeamRole, roleLabel } from "@/lib/auth/roles";
import { actorLabel, requireAdmin, startAdminSession } from "@/lib/auth/session";
import { cleanText, normalizeEmail } from "@/lib/sanitize";
import { logActivity } from "@/lib/server/activity";
import { changeOwnPassword, createTeamMember, deleteTeamMember, resetTeamMemberPassword, updateTeamMember } from "@/lib/server/admin-users";
import { isObjectIdString } from "@/lib/server/ids";
import { logServerError } from "@/lib/server/log";
import type { ActionState } from "./types";

const FAILED = "Something went wrong. Please try again.";

export async function createTeamMemberAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin("superadmin");
  const name = cleanText(formData.get("name"));
  const email = normalizeEmail(cleanText(formData.get("email")));
  const role = cleanText(formData.get("role"));
  const fieldErrors: Record<string, string> = {};
  if (name.length < 2 || name.length > 80) fieldErrors.name = "Enter a name (2–80 characters).";
  if (!email) fieldErrors.email = "Enter a valid email address.";
  if (!isTeamRole(role)) fieldErrors.role = "Choose a role.";
  if (Object.keys(fieldErrors).length > 0 || !email || !isTeamRole(role)) return { error: "Please check the highlighted fields.", fieldErrors };

  const password = generatePassword();
  try {
    const result = await createTeamMember({ name, email, role, password });
    if (!result.ok) return { error: result.error };
  } catch (error) {
    logServerError("[team] create failed", error);
    return { error: FAILED };
  }
  await logActivity(actorLabel(session), "team.created", `Added team member ${name} as ${roleLabel(role)}`, "/admin/team");
  refresh();
  return { ok: true, message: `${name} can now sign in with ${email} and the password below. Copy it now — it won't be shown again.`, secret: password };
}

export async function updateTeamMemberAction(id: string, _previous: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin("superadmin");
  if (!isObjectIdString(id)) return { error: "Invalid team member." };
  const role = cleanText(formData.get("role"));
  const active = formData.get("active");
  const changes: { role?: "admin" | "viewer"; active?: boolean } = {};
  if (role) {
    if (!isTeamRole(role)) return { error: "Choose a valid role." };
    changes.role = role;
  }
  if (active === "true" || active === "false") changes.active = active === "true";
  if (Object.keys(changes).length === 0) return { error: "Nothing to change." };
  try {
    const member = await updateTeamMember(id, changes);
    if (!member) return { error: "This team member no longer exists." };
    const what = changes.active === false ? "Deactivated" : changes.active === true ? "Reactivated" : `Changed role of`;
    await logActivity(actorLabel(session), "team.updated", `${what} ${member.name}${changes.role ? ` to ${roleLabel(changes.role)}` : ""}`, "/admin/team");
  } catch (error) {
    logServerError("[team] update failed", error);
    return { error: FAILED };
  }
  refresh();
  return { ok: true, message: "Saved. Any open sessions for this person were signed out." };
}

export async function resetTeamPasswordAction(id: string): Promise<ActionState> {
  const session = await requireAdmin("superadmin");
  if (!isObjectIdString(id)) return { error: "Invalid team member." };
  const password = generatePassword();
  try {
    const member = await resetTeamMemberPassword(id, password);
    if (!member) return { error: "This team member no longer exists." };
    await logActivity(actorLabel(session), "team.password_reset", `Reset password for ${member.name}`, "/admin/team");
  } catch (error) {
    logServerError("[team] password reset failed", error);
    return { error: FAILED };
  }
  refresh();
  return { ok: true, message: "New password created. Copy it now and share it securely — it won't be shown again.", secret: password };
}

export async function deleteTeamMemberAction(id: string): Promise<ActionState> {
  const session = await requireAdmin("superadmin");
  if (!isObjectIdString(id)) return { error: "Invalid team member." };
  try {
    const member = await deleteTeamMember(id);
    if (!member) return { error: "This team member no longer exists." };
    await logActivity(actorLabel(session), "team.deleted", `Removed team member ${member.name}`, "/admin/team");
  } catch (error) {
    logServerError("[team] delete failed", error);
    return { error: FAILED };
  }
  refresh();
  return { ok: true, message: "Team member removed." };
}

export async function changeOwnPasswordAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin("viewer");
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const problem = passwordProblem(next);
  if (problem) return { error: problem, fieldErrors: { next: problem } };
  if (next !== confirm) return { error: "The new passwords don't match.", fieldErrors: { confirm: "Doesn't match the new password." } };
  try {
    const result = await changeOwnPassword(current, next);
    if (!result.ok) return { error: result.error };
    // Keep this browser signed in with the new session version; other devices are signed out.
    await startAdminSession({ sub: session.userId, role: session.role, sv: result.sessionVersion });
    await logActivity(actorLabel(session), "team.password_changed", `${session.name} changed their password`, null);
  } catch (error) {
    logServerError("[team] change password failed", error);
    return { error: FAILED };
  }
  return { ok: true, message: "Password changed. Other devices have been signed out." };
}
