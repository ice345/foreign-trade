"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Globe, Home, Cpu, ShoppingBag, Sparkles, Users, MessageCircle, Megaphone, Video } from "lucide-react";

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

const sections: Section[] = [
  {
    key: "country",
    label: "国家选择",
    options: [
      { value: "美国", label: "🇺🇸 美国", icon: <Globe className="h-4 w-4" /> },
      { value: "英国", label: "🇬🇧 英国", icon: <Globe className="h-4 w-4" /> },
      { value: "德国", label: "🇩🇪 德国", icon: <Globe className="h-4 w-4" /> },
      { value: "日本", label: "🇯🇵 日本", icon: <Globe className="h-4 w-4" /> }
    ]
  },
  {
    key: "platform",
    label: "平台类型",
    options: [
      { value: "Facebook 群组", label: "Facebook 群组", icon: <Users className="h-4 w-4" /> },
      { value: "Telegram 频道", label: "Telegram 频道", icon: <MessageCircle className="h-4 w-4" /> },
      { value: "Deal 站编辑", label: "Deal 站编辑", icon: <Megaphone className="h-4 w-4" /> },
      { value: "TikTok 红人", label: "TikTok 红人", icon: <Video className="h-4 w-4" /> }
    ]
  },
  {
    key: "category",
    label: "类目筛选",
    options: [
      { value: "家居", label: "家居", icon: <Home className="h-4 w-4" /> },
      { value: "电子", label: "电子", icon: <Cpu className="h-4 w-4" /> },
      { value: "服饰", label: "服饰", icon: <ShoppingBag className="h-4 w-4" /> },
      { value: "美妆", label: "美妆", icon: <Sparkles className="h-4 w-4" /> }
    ]
  }
];

export default function MarketFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const toggleParam = (key: string, value: string) => {
    const search = new URLSearchParams(params.toString());
    if (search.get(key) === value) {
      search.delete(key);
    } else {
      search.set(key, value);
    }
    router.push(`/explore?${search.toString()}`);
  };

  const clearAll = () => {
    router.push("/explore");
  };

  return (
    <aside className="card sticky top-24 space-y-6 border-white/5 bg-panel/50 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">筛选条件</h3>
        <button onClick={clearAll} className="text-xs text-white/50 hover:text-white">
          清除
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
                  key={option.value}
                  onClick={() => toggleParam(section.key, option.value)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-all ${
                    active
                      ? "border-accent/40 bg-accent/10 text-white"
                      : "border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:text-white"
                  }`}
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
