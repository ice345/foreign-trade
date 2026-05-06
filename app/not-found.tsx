import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        <SearchX className="h-8 w-8" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-white">页面未找到</h2>
        <p className="mt-2 text-sm text-white/60">
          您访问的页面不存在或已被移除。
        </p>
      </div>
      <Link href="/" className="btn">
        返回首页
      </Link>
    </div>
  );
}
