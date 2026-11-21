"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { LEAD_STATUSES, LIMITS, isOneOf } from "@/lib/inquiry-options";
import { cleanText } from "@/lib/sanitize";
import { addLeadNote, isLeadId, updateLeadStatus } from "@/lib/server/leads";
import { logServerError } from "@/lib/server/log";

export type LeadActionState = { ok?: boolean; error?: string; message?: string };

export async function updateLeadStatusAction(leadId: string, _previous: LeadActionState, formData: FormData): Promise<LeadActionState> {
  await requireAdmin();
  const status = String(formData.get("status") ?? "");
  if (!isLeadId(leadId) || !isOneOf(LEAD_STATUSES, status)) return { error: "Invalid status." };
  try {
    if (!(await updateLeadStatus(leadId, status))) return { error: "This lead no longer exists." };
  } catch (error) {
    logServerError("[leads] status update failed", error);
    return { error: "Couldn't save the status. Please try again." };
  }
  refresh();
  return { ok: true, message: "Status updated." };
}

export async function addLeadNoteAction(leadId: string, _previous: LeadActionState, formData: FormData): Promise<LeadActionState> {
  await requireAdmin();
  const body = cleanText(formData.get("note"), { multiline: true });
  if (!isLeadId(leadId)) return { error: "Invalid lead." };
  if (!body) return { error: "Write a note first." };
  if (body.length > LIMITS.note) return { error: `Notes can be up to ${LIMITS.note} characters.` };
  try {
    if (!(await addLeadNote(leadId, body))) return { error: "This lead no longer exists." };
  } catch (error) {
    logServerError("[leads] adding note failed", error);
    return { error: "Couldn't save the note. Please try again." };
  }
  refresh();
  return { ok: true, message: "Note added." };
}
