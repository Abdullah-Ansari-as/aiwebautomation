/**
 * Shared result shape for admin Server Actions used with `useActionState`.
 * (Kept out of the "use server" files, which may only export async functions.)
 */
export type ActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  /** A one-time secret to show the admin, e.g. a generated password. */
  secret?: string;
  /** Where to send the admin after success, e.g. a newly created record. */
  redirectTo?: string;
  fieldErrors?: Record<string, string>;
};

/** Result shape for public forms (contact, newsletter, tool submission). */
export type PublicFormState =
  | { status: "idle" }
  | { status: "success"; message?: string; reference?: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };
