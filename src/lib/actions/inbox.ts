"use server";

import { refresh } from "next/cache";
import { actorLabel, requireAdmin } from "@/lib/auth/session";
import { FORM_LIMITS, MESSAGE_STATUSES, SUBMISSION_STATUSES } from "@/lib/form-options";
import { isOneOf, optionLabel } from "@/lib/inquiry-options";
import { cleanText } from "@/lib/sanitize";
import { logActivity } from "@/lib/server/activity";
import { isObjectIdString } from "@/lib/server/ids";
import { logServerError } from "@/lib/server/log";
import { deleteMessage, setMessageStatus } from "@/lib/server/messages";
import { deleteSubmission, reviewSubmission } from "@/lib/server/submissions";
import { deleteSubscriber } from "@/lib/server/subscribers";
import type { ActionState } from "./types";

const FAILED = "Something went wrong. Please try again.";

export async function setMessageStatusAction(id: string, status: string): Promise<ActionState> {
  const session = await requireAdmin("admin");
  if (!isObjectIdString(id) || !isOneOf(MESSAGE_STATUSES, status)) return { error: "Invalid request." };
  try {
    const message = await setMessageStatus(id, status);
    if (!message) return { error: "This message no longer exists." };
    await logActivity(actorLabel(session), "message.status", `Message from ${message.name} marked ${optionLabel(MESSAGE_STATUSES, status).toLowerCase()}`, `/admin/messages/${id}`);
  } catch (error) {
    logServerError("[messages] status failed", error);
    return { error: FAILED };
  }
  refresh();
  return { ok: true, message: "Updated." };
}

export async function deleteMessageAction(id: string): Promise<ActionState> {
  const session = await requireAdmin("admin");
  if (!isObjectIdString(id)) return { error: "Invalid request." };
  try {
    const message = await deleteMessage(id);
    if (!message) return { error: "This message no longer exists." };
    await logActivity(actorLabel(session), "message.deleted", `Deleted message from ${message.name}`, "/admin/messages");
  } catch (error) {
    logServerError("[messages] delete failed", error);
    return { error: FAILED };
  }
  return { ok: true, message: "Message deleted.", redirectTo: "/admin/messages" };
}

export async function reviewSubmissionAction(id: string, _previous: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin("admin");
  const status = cleanText(formData.get("status"));
  const note = cleanText(formData.get("note"), { multiline: true }).slice(0, FORM_LIMITS.reviewNote) || null;
  if (!isObjectIdString(id) || !isOneOf(SUBMISSION_STATUSES, status)) return { error: "Invalid request." };
  try {
    const submission = await reviewSubmission(id, status, note, session.name.slice(0, 254));
    if (!submission) return { error: "This submission no longer exists." };
    await logActivity(actorLabel(session), "submission.reviewed", `${submission.toolName} submission ${status === "pending" ? "moved back to pending" : status}`, "/admin/submissions");
  } catch (error) {
    logServerError("[submissions] review failed", error);
    return { error: FAILED };
  }
  refresh();
  return { ok: true, message: "Saved." };
}

export async function deleteSubmissionAction(id: string): Promise<ActionState> {
  const session = await requireAdmin("admin");
  if (!isObjectIdString(id)) return { error: "Invalid request." };
  try {
    const submission = await deleteSubmission(id);
    if (!submission) return { error: "This submission no longer exists." };
    await logActivity(actorLabel(session), "submission.deleted", `Deleted submission ${submission.toolName}`, "/admin/submissions");
  } catch (error) {
    logServerError("[submissions] delete failed", error);
    return { error: FAILED };
  }
  refresh();
  return { ok: true, message: "Submission deleted." };
}

export async function deleteSubscriberAction(id: string): Promise<ActionState> {
  const session = await requireAdmin("admin");
  if (!isObjectIdString(id)) return { error: "Invalid request." };
  try {
    const subscriber = await deleteSubscriber(id);
    if (!subscriber) return { error: "This subscriber no longer exists." };
    await logActivity(actorLabel(session), "subscriber.deleted", "Deleted a newsletter subscriber (data removal)", "/admin/subscribers");
  } catch (error) {
    logServerError("[subscribers] delete failed", error);
    return { error: FAILED };
  }
  refresh();
  return { ok: true, message: "Subscriber deleted." };
}
