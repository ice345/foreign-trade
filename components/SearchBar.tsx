"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export default function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        router.push(`/search?q=${encodeURIComponent(query)}`);
      }}
      className="glass-surface flex w-full max-w-2xl gap-2 rounded-xl p-2"
    >
      <div className="relative min-w-0 flex-1">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
          <Search className="h-5 w-5" />
        </div>

        <input
          aria-label="搜索推广渠道"
          className="h-12 w-full rounded-lg border border-transparent bg-transparent pl-12 pr-4 text-base outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-border)] focus:bg-white/5"
          placeholder="搜索渠道、平台、标签..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <button className="btn-primary h-12 shrink-0 px-3 sm:px-5" type="submit">
        搜索
      </button>
    </form>
  );
}
