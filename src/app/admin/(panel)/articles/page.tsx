import type { Metadata } from "next";
import { ArticlesView } from "@/components/admin/views/articles-view";

export const metadata: Metadata = { title: "Articles" };

export default function Page() {
  return <ArticlesView />;
}
