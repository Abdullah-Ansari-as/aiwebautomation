import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { EmptyBlock, LinkTabs, MessageStatusBadge, NoDatabaseNotice } from "@/components/admin/admin-kit";
import { requireAdmin } from "@/lib/auth/session";
import { CONTACT_TOPICS, MESSAGE_STATUSES } from "@/lib/form-options";
import { isOneOf, optionLabel } from "@/lib/inquiry-options";
import { countMessagesByStatus, listMessages } from "@/lib/server/messages";
import { isDatabaseConfigured } from "@/lib/server/mongodb";
import { cn, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  await requireAdmin();
  if (!isDatabaseConfigured()) return <NoDatabaseNotice />;
  const params = await searchParams;
  const requested = typeof params.status === "string" ? params.status : "";
  const status = isOneOf(MESSAGE_STATUSES, requested) ? requested : undefined;
  const [messages, counts] = await Promise.all([listMessages(status), countMessagesByStatus()]);

  return (
    <>
      <AdminPageHeader title="Messages" description="Messages sent through the contact form." />
      <LinkTabs
        label="Filter messages"
        active={status ?? ""}
        tabs={[
          { value: "", label: "Inbox", href: "/admin/messages", count: counts.new + counts.read + counts.replied },
          ...MESSAGE_STATUSES.map((s) => ({ value: s.value, label: s.label, href: `/admin/messages?status=${s.value}`, count: counts[s.value] })),
        ]}
      />
      {messages.length === 0 ? (
        <EmptyBlock title="No messages here">New messages from the contact page appear here and are emailed to you when email is configured.</EmptyBlock>
      ) : (
        <ul className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-soft">
          {messages.map((m) => (
            <li key={m.id} className="border-b border-border last:border-b-0">
              <Link href={`/admin/messages/${m.id}`} className="group grid gap-2 px-5 py-4 transition-colors hover:bg-surface-muted/60 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_7rem_10rem_1rem] md:items-center">
                <div className="min-w-0">
                  <p className={cn("truncate text-foreground group-hover:text-primary", m.status === "new" ? "font-semibold" : "font-medium")}>{m.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{m.email}</p>
                </div>
                <div className="min-w-0 text-sm">
                  <p className="truncate font-medium text-foreground">{optionLabel(CONTACT_TOPICS, m.topic)}</p>
                  <p className="truncate text-muted-foreground">{m.message}</p>
                </div>
                <div>
                  <MessageStatusBadge status={m.status} />
                </div>
                <p className="text-sm text-muted-foreground">{formatDateTime(m.createdAt)}</p>
                <ChevronRight className="hidden h-4 w-4 text-muted-foreground md:block" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
