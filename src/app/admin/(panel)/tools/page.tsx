import type { Metadata } from "next";
import { ToolsView } from "@/components/admin/views/tools-view";

export const metadata: Metadata = { title: "AI Tools" };

export default function Page() {
  return <ToolsView />;
}
