"use client";

import { ArrowRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const popular = ["Writing", "Image generation", "Coding", "Automation"];

/** Hero search: sends the query to the tools directory (`/tools?q=`). */
export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/tools?q=${encodeURIComponent(q)}` : "/tools");
  };

  return (
    <div>
      <form
        role="search"
        onSubmit={submit}
        className="group relative flex items-center rounded-2xl border border-border-strong bg-surface/90 p-1.5 shadow-lift backdrop-blur transition-[border-color,box-shadow] focus-within:border-primary/60 focus-within:shadow-glow"
      >
        <Search className="ml-3 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <label htmlFor="hero-search" className="sr-only">
          Search AI tools
        </label>
        <input
          id="hero-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search AI tools — e.g. “video editing” or “Claude”"
          className="h-12 min-w-0 flex-1 bg-transparent px-3 text-[0.95rem] text-foreground outline-none placeholder:text-muted-foreground focus-visible:outline-none"
        />
        <button
          type="submit"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white transition-all hover:bg-primary-hover active:scale-[0.97] dark:text-primary-foreground sm:px-5"
        >
          <span className="hidden sm:inline">Search</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only sm:hidden">Search</span>
        </button>
      </form>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Popular:</span>
        {popular.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => router.push(`/tools?q=${encodeURIComponent(term)}`)}
            className="rounded-full border border-border bg-surface/60 px-3 py-1 text-xs font-medium text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
