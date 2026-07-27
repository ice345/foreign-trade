"use client";

import { useEffect, useState } from "react";

type Zone = {
  label: string;
  timeZone: string;
};

const businessZone: Zone = {
  label: process.env.NEXT_PUBLIC_BUSINESS_TZ_LABEL ?? "中国",
  timeZone: process.env.NEXT_PUBLIC_BUSINESS_TZ ?? "Asia/Shanghai"
};

const zones: Zone[] = [
  { label: "美国西部", timeZone: "America/Los_Angeles" },
  { label: "美国东部", timeZone: "America/New_York" },
  { label: "英国", timeZone: "Europe/London" },
  { label: "欧洲中部", timeZone: "Europe/Berlin" },
  businessZone
];

export default function TimeZones() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(timer);
  }, []);

  return (
    <details className="group relative hidden lg:block">
      <summary className="cursor-pointer list-none rounded-lg px-2 py-2 text-xs text-[var(--text-tertiary)] transition hover:bg-white/5 hover:text-white">
        全球时间
      </summary>
      <div className="glass-surface absolute right-0 top-full mt-3 w-48 rounded-lg p-2 shadow-elevated">
      {zones.map((zone) => {
        const formatted = new Intl.DateTimeFormat("zh-CN", {
          timeZone: zone.timeZone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }).format(now);
        return (
          <div key={zone.label} className="flex items-center justify-between rounded-md px-3 py-2 text-xs text-[var(--text-secondary)]">
            <span>{zone.label}</span><span className="font-medium text-white">{formatted}</span>
          </div>
        );
      })}
      </div>
    </details>
  );
}
