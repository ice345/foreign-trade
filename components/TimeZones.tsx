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
    <div className="hidden lg:flex items-center gap-3 text-[11px] text-white/60">
      {zones.map((zone) => {
        const formatted = new Intl.DateTimeFormat("zh-CN", {
          timeZone: zone.timeZone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }).format(now);
        return (
          <div key={zone.label} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            {zone.label} {formatted}
          </div>
        );
      })}
    </div>
  );
}
