import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { AnalyticsListener } from "@/components/shared/analytics-listener";
import { buildSearchIndex } from "@/lib/search-index";

/** Public website chrome: header with global search, main content, footer. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header searchIndex={buildSearchIndex()} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
      <AnalyticsListener />
    </>
  );
}
