"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return <PaginationControls key={page} page={page} total={total} totalPages={totalPages} onPageChange={onPageChange} />;
}

function PaginationControls({ page, total, totalPages, onPageChange }: {
  page: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const [inputValue, setInputValue] = useState(String(page));

  const jumpToPage = () => {
    const num = parseInt(inputValue, 10);
    if (isNaN(num)) {
      setInputValue(String(page));
      return;
    }
    const clamped = Math.max(1, Math.min(num, totalPages));
    setInputValue(String(clamped));
    if (clamped !== page) {
      onPageChange(clamped);
    }
  };

  return (
    <div className="flex items-center justify-center gap-4 pt-6 text-sm text-white/70">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="flex items-center gap-1 rounded border border-white/10 px-3 py-1.5 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronLeft size={16} />
        上一页
      </button>
      <span className="flex items-center gap-1 text-white/50">
        第
        <input
          type="number"
          min={1}
          max={totalPages}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={jumpToPage}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              jumpToPage();
            }
          }}
          className="w-12 rounded border border-white/10 bg-white/5 px-1 py-0.5 text-center text-sm text-white outline-none focus:border-accent"
        />
        / {totalPages} 页 · 共 {total} 条
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="flex items-center gap-1 rounded border border-white/10 px-3 py-1.5 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
      >
        下一页
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
