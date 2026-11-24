import "server-only";
import type { ObjectId } from "mongodb";
import { COLLECTIONS } from "../../../db/schema.mjs";
import type { TeamRole } from "@/lib/auth/roles";
import { toObjectId } from "./ids";
import { getCollection } from "./mongodb";

/**
 * Raw team-member lookups used by the sign-in flow and the session check.
 * These do NOT check permissions — admin-facing functions live in
 * `admin-users.ts`, which guards every call.
 */

export interface AdminUserDocument {
  _id: ObjectId;
  email: string;
  name: string;
  role: TeamRole;
  passwordHash: string;
  active: boolean;
  sessionVersion: number;
  lastLoginAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function adminUsersCollection() {
  return getCollection<AdminUserDocument>(COLLECTIONS.adminUsers);
}

export async function findUserByEmail(email: string): Promise<AdminUserDocument | null> {
  return (await adminUsersCollection()).findOne({ email });
}

export async function findUserById(id: string): Promise<AdminUserDocument | null> {
  const _id = toObjectId(id);
  if (!_id) return null;
  return (await adminUsersCollection()).findOne({ _id });
}

export async function recordLogin(id: ObjectId): Promise<void> {
  await (await adminUsersCollection()).updateOne({ _id: id }, { $set: { lastLoginAt: new Date() } });
}
