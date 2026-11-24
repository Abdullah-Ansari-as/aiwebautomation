/**
 * Option lists for the public contact and tool-submission forms, shared by
 * the client forms and server-side validation.
 */

export const CONTACT_TOPICS = [
  { value: "general", label: "General question" },
  { value: "services", label: "Automation services / hiring" },
  { value: "correction", label: "Correction or update" },
  { value: "listing", label: "Tool listing" },
  { value: "partnership", label: "Partnership" },
  { value: "advertising", label: "Advertising" },
  { value: "other", label: "Other" },
] as const;

export const SUBMISSION_PRICING = [
  { value: "Free", label: "Free" },
  { value: "Freemium", label: "Freemium" },
  { value: "Paid", label: "Paid" },
] as const;

export const SUBMISSION_RELATIONSHIPS = [
  { value: "founder", label: "Founder / team member" },
  { value: "user", label: "User" },
  { value: "other", label: "Other" },
] as const;

export const MESSAGE_STATUSES = [
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "replied", label: "Replied" },
  { value: "archived", label: "Archived" },
] as const;

export const SUBMISSION_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number]["value"];
export type MessageStatus = (typeof MESSAGE_STATUSES)[number]["value"];
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number]["value"];
export type SubmissionPricing = (typeof SUBMISSION_PRICING)[number]["value"];

export const FORM_LIMITS = {
  name: 120,
  email: 254,
  message: 4000,
  messageMin: 20,
  toolName: 80,
  website: 300,
  submissionDescription: 2000,
  submissionDescriptionMin: 40,
  reviewNote: 1000,
} as const;
