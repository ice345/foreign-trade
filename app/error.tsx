"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-white">出了点问题</h2>
        <p className="mt-2 text-sm text-white/60">
          页面加载时发生错误，请稍后重试。
        </p>
      </div>
      <button
        onClick={reset}
        className="btn-outline flex items-center gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        重试
      </button>
    </div>
  );
}
