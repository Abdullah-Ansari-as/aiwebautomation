import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";

export default function LeadNotFound() {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-border p-12 text-center">
      <SearchX className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
      <h1 className="mt-3 text-lg font-semibold text-foreground">Lead not found</h1>
      <p className="mt-1 text-sm text-muted-foreground">It may have been removed, or the link is incorrect.</p>
      <Link href="/admin/leads" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to all leads
      </Link>
    </div>
  );
}
