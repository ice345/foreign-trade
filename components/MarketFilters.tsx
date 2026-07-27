"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Globe, Home, Cpu, ShoppingBag, Sparkles, Users, MessageCircle, Megaphone, Video } from "lucide-react";
import { buildExploreFilterUrl } from "@/lib/explore-filters";

type Option = {
  value: string;
  label: string;
  icon?: React.ReactNode;
};

type Section = {
  key: string;
  label: string;
  options: Option[];
};

type Props = {
  facets: { countries: string[]; platforms: string[]; categories: string[] }
}

function sectionIcon(key: string, value: string) {
  if (key === "country") return <Globe className="h-4 w-4" />
  if (key === "platform") {
    if (value.includes("Facebook")) return <Users className="h-4 w-4" />
    if (value.includes("Telegram")) return <MessageCircle className="h-4 w-4" />
    if (value.includes("TikTok")) return <Video className="h-4 w-4" />
    return <Megaphone className="h-4 w-4" />
  }
  if (value.includes("家居")) return <Home className="h-4 w-4" />
  if (value.includes("电子")) return <Cpu className="h-4 w-4" />
  if (value.includes("服饰")) return <ShoppingBag className="h-4 w-4" />
  return <Sparkles className="h-4 w-4" />
}

export default function MarketFilters({ facets }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const sections: Section[] = [
    { key: "country", label: "国家选择", options: facets.countries.map((value) => ({ value, label: value, icon: sectionIcon("country", value) })) },
    { key: "platform", label: "平台", options: facets.platforms.map((value) => ({ value, label: value, icon: sectionIcon("platform", value) })) },
    { key: "category", label: "类目筛选", options: facets.categories.map((value) => ({ value, label: value, icon: sectionIcon("category", value) })) }
  ];

  const toggleParam = (key: string, value: string) => {
    const href = buildExploreFilterUrl(new URLSearchParams(params.toString()), key, value)
    startTransition(() => router.push(href, { scroll: false }));
  };

  const clearAll = () => {
    startTransition(() => router.push("/explore", { scroll: false }));
  };

  return (
    <aside className="card sticky top-24 space-y-6 border-white/5 bg-panel/50 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">筛选条件</h3>
        <button type="button" onClick={clearAll} disabled={isPending} className="text-xs text-white/50 hover:text-white disabled:opacity-50">
          {isPending ? "更新中" : "清除"}
        </button>
      </div>

      {sections.map((section) => (
        <div key={section.key} className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-white/40">
            {section.label}
          </p>
          <div className="grid gap-2">
            {section.options.map((option) => {
              const active = params.get(section.key) === option.value;
              return (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => toggleParam(section.key, option.value)}
                  aria-pressed={active}
                  disabled={isPending}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-all ${
                    active
                      ? "border-accent/40 bg-accent/10 text-white"
                      : "border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:text-white"
                  } disabled:cursor-wait disabled:opacity-60`}
                >
                  {option.icon}
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}
