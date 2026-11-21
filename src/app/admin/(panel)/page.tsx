import type { Metadata } from "next";
import { OverviewView } from "@/components/admin/views/overview-view";

export const metadata: Metadata = { title: "Overview" };

export default function AdminOverviewPage() {
  return <OverviewView />;
}
