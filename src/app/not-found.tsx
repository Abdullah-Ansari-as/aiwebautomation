import { ArrowLeft, Search } from "lucide-react";
import type { Metadata } from "next";
import { LinkButton } from "@/components/shared/button";
import { AmbientBackground } from "@/components/shared/background";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { buildSearchIndex } from "@/lib/search-index";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <Header searchIndex={buildSearchIndex()} />
      <main id="main-content" className="flex-1">
    <section className="relative isolate overflow-hidden">
      <AmbientBackground intensity="subtle" />
      <div className="container-site flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <p className="text-gradient text-7xl font-semibold tracking-tight">404</p>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">This page could not be found</h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          The link may be outdated or the page may have moved. Try the tools directory or head back home.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <LinkButton href="/">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to home
          </LinkButton>
          <LinkButton href="/tools" variant="outline">
            <Search className="h-4 w-4" aria-hidden="true" /> Browse AI tools
          </LinkButton>
        </div>
      </div>
    </section>
      </main>
      <Footer />
    </>
  );
}
