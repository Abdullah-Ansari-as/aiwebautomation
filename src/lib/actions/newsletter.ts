"use server";

import { logActivity } from "@/lib/server/activity";
import { logServerError } from "@/lib/server/log";
import { isSubscriberToken, unsubscribeByToken } from "@/lib/server/subscribers";
import type { PublicFormState } from "./types";

export async function unsubscribeAction(_previous: PublicFormState, formData: FormData): Promise<PublicFormState> {
  const token = formData.get("token");
  if (!isSubscriberToken(token)) return { status: "error", message: "This unsubscribe link isn't valid." };
  try {
    if (!(await unsubscribeByToken(token))) return { status: "error", message: "This unsubscribe link isn't valid." };
  } catch (error) {
    logServerError("[newsletter] unsubscribe failed", error);
    return { status: "error", message: "Something went wrong. Please try again in a moment." };
  }
  await logActivity("website", "subscriber.unsubscribed", "A subscriber unsubscribed", "/admin/subscribers");
  return { status: "success" };
}
