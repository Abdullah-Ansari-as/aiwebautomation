import { ArrowLeft, Mail, Reply } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageStatusBadge, NoDatabaseNotice, Row, linkButton } from "@/components/admin/admin-kit";
import { Card } from "@/components/admin/admin-ui";
import { ActionButton } from "@/components/admin/controls";
import { deleteMessageAction, setMessageStatusAction } from "@/lib/actions/inbox";
import { hasRole } from "@/lib/auth/roles";
import { requireAdmin } from "@/lib/auth/session";
import { CONTACT_TOPICS } from "@/lib/form-options";
import { optionLabel } from "@/lib/inquiry-options";
import { getMessage, markMessageRead } from "@/lib/server/messages";
import { isDatabaseConfigured } from "@/lib/server/mongodb";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Message" };

export default async function MessagePage({ params }: PageProps<"/admin/messages/[id]">) {
  const session = await requireAdmin();
  if (!isDatabaseConfigured()) return <NoDatabaseNotice />;
  const { id } = await params;
  const message = await getMessage(id);
  if (!message) notFound();
  if (message.status === "new") await markMessageRead(message.id);
  const canWrite = hasRole(session.role, "admin");
  const replyHref = `mailto:${message.email}?subject=${encodeURIComponent(`Re: your message (${message.reference})`)}&body=${encodeURIComponent(`Hi ${message.name.split(" ")[0]},\n\n`)}`;

  return (
    <>
      <Link href="/admin/messages" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All messages
      </Link>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{message.name}</h1>
        <MessageStatusBadge status={message.status === "new" ? "read" : message.status} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card title={optionLabel(CONTACT_TOPICS, message.topic)}>
          <p className="whitespace-pre-wrap break-words p-5 text-sm leading-relaxed text-foreground">{message.message}</p>
        </Card>
        <div className="space-y-6">
          <Card title="From">
            <dl className="space-y-4 p-5">
              <Row label="Name">{message.name}</Row>
              <Row label="Email">
                <a href={`mailto:${message.email}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" /> {message.email}
                </a>
              </Row>
              <Row label="Received">{formatDateTime(message.createdAt)}</Row>
              <Row label="Reference">{message.reference}</Row>
              <Row label="Sent from page">{message.sourcePath ?? "—"}</Row>
            </dl>
          </Card>
          <Card title="Actions">
            <div className="space-y-3 p-5">
              <a href={replyHref} className={`${linkButton} w-full`}>
                <Reply className="h-4 w-4" aria-hidden="true" /> Reply by email
              </a>
              {canWrite && (
                <>
                  {message.status !== "replied" && <ActionButton action={setMessageStatusAction.bind(null, message.id, "replied")}>Mark as replied</ActionButton>}
                  {message.status !== "archived" ? (
                    <ActionButton action={setMessageStatusAction.bind(null, message.id, "archived")}>Archive</ActionButton>
                  ) : (
                    <ActionButton action={setMessageStatusAction.bind(null, message.id, "read")}>Move back to inbox</ActionButton>
                  )}
                  <ActionButton action={deleteMessageAction.bind(null, message.id)} variant="danger" confirm="Delete this message permanently?">
                    Delete
                  </ActionButton>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
