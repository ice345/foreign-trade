import "./globals.css";
import Providers from "./providers";
import type { Metadata } from "next";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "GlobalPush · 资源聚合平台",
  description: "GlobalPush 提供全球优质资源导航、优惠与精选工具。",
  metadataBase: new URL("https://globalpush.example.com"),
  openGraph: {
    title: "GlobalPush · 资源聚合平台",
    description: "浏览、搜索、收藏全球资源与优惠内容。",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" className="dark">
      <body className={`${jakarta.variable} font-sans`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <SiteNav />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
