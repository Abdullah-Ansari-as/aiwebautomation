import "server-only";
import { ObjectId } from "mongodb";
import { hashPassword, verifyPassword } from "@/lib/auth/passwords";
import type { TeamRole } from "@/lib/auth/roles";
import { getSuperadminEmail, requireAdmin } from "@/lib/auth/session";
import { adminUsersCollection, type AdminUserDocument } from "./admin-users-store";
import { toObjectId } from "./ids";
import { isDuplicateKeyError } from "./mongodb";

/**
 * Team management (super admin only), plus "change my own password" for
 * signed-in team members. Every function checks the session itself.
 */

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: TeamRole;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

function toMember(doc: AdminUserDocument): TeamMember {
  return {
    id: doc._id.toHexString(),
    email: doc.email,
    name: doc.name,
    role: doc.role,
    active: doc.active,
    lastLoginAt: doc.lastLoginAt?.toISOString() ?? null,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function listTeamMembers(): Promise<TeamMember[]> {
  await requireAdmin("superadmin");
  const docs = await (await adminUsersCollection()).find({}, { projection: { passwordHash: 0 } }).sort({ createdAt: 1 }).toArray();
  return docs.map((d) => toMember(d as AdminUserDocument));
}

export type CreateMemberResult = { ok: true; id: string } | { ok: false; error: string };

export async function createTeamMember(input: { name: string; email: string; role: TeamRole; password: string }): Promise<CreateMemberResult> {
  const session = await requireAdmin("superadmin");
  if (input.email === getSuperadminEmail()) return { ok: false, error: "That email is the super admin's login. Use a different email for team members." };
  const now = new Date();
  const doc: AdminUserDocument = {
    _id: new ObjectId(),
    email: input.email,
    name: input.name,
    role: input.role,
    passwordHash: await hashPassword(input.password),
    active: true,
    sessionVersion: 1,
    lastLoginAt: null,
    createdBy: session.email,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await (await adminUsersCollection()).insertOne(doc);
  } catch (error) {
    if (isDuplicateKeyError(error)) return { ok: false, error: "A team member with this email already exists." };
    throw error;
  }
  return { ok: true, id: doc._id.toHexString() };
}

/** Changes role and/or active flag. Bumps the session version so the change applies immediately. */
export async function updateTeamMember(id: string, changes: { role?: TeamRole; active?: boolean }): Promise<TeamMember | null> {
  await requireAdmin("superadmin");
  const _id = toObjectId(id);
  if (!_id) return null;
  const doc = await (await adminUsersCollection()).findOneAndUpdate(
    { _id },
    { $set: { ...changes, updatedAt: new Date() }, $inc: { sessionVersion: 1 } },
    { returnDocument: "after", projection: { passwordHash: 0 } },
  );
  return doc ? toMember(doc as AdminUserDocument) : null;
}

export async function resetTeamMemberPassword(id: string, password: string): Promise<TeamMember | null> {
  await requireAdmin("superadmin");
  const _id = toObjectId(id);
  if (!_id) return null;
  const doc = await (await adminUsersCollection()).findOneAndUpdate(
    { _id },
    { $set: { passwordHash: await hashPassword(password), updatedAt: new Date() }, $inc: { sessionVersion: 1 } },
    { returnDocument: "after", projection: { passwordHash: 0 } },
  );
  return doc ? toMember(doc as AdminUserDocument) : null;
}

export async function deleteTeamMember(id: string): Promise<TeamMember | null> {
  await requireAdmin("superadmin");
  const _id = toObjectId(id);
  if (!_id) return null;
  const doc = await (await adminUsersCollection()).findOneAndDelete({ _id }, { projection: { passwordHash: 0 } });
  return doc ? toMember(doc as AdminUserDocument) : null;
}

export type ChangePasswordResult = { ok: true; sessionVersion: number } | { ok: false; error: string };

/** For a signed-in team member. The super admin's password lives in the environment instead. */
export async function changeOwnPassword(current: string, next: string): Promise<ChangePasswordResult> {
  const session = await requireAdmin("viewer");
  if (session.role === "superadmin") return { ok: false, error: "The super admin password is set with ADMIN_PASSWORD in the server environment." };
  const _id = toObjectId(session.userId);
  if (!_id) return { ok: false, error: "Session is invalid. Please sign in again." };
  const collection = await adminUsersCollection();
  const user = await collection.findOne({ _id });
  if (!user || !(await verifyPassword(current, user.passwordHash))) return { ok: false, error: "Your current password is incorrect." };
  const updated = await collection.findOneAndUpdate(
    { _id },
    { $set: { passwordHash: await hashPassword(next), updatedAt: new Date() }, $inc: { sessionVersion: 1 } },
    { returnDocument: "after", projection: { sessionVersion: 1 } },
  );
  return updated ? { ok: true, sessionVersion: updated.sessionVersion } : { ok: false, error: "Account not found." };
}
