import { Suspense } from "react";
import SearchBar from "@/components/SearchBar";
import SearchClient from "./SearchClient";

export default function SearchPage() {
  return (
    <div className="page-container py-16">
      <div className="mb-8 space-y-3">
        <h1 className="text-3xl font-semibold">搜索结果</h1>
        <Suspense fallback={<div className="h-12 bg-white/5 rounded-full animate-pulse" />}>
          <SearchBar />
        </Suspense>
      </div>
      <Suspense fallback={<div className="text-white/60">加载中...</div>}>
        <SearchClient />
      </Suspense>
    </div>
  );
}
