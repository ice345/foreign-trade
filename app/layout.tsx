import "./globals.css";
import Providers from "./providers";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" className="dark">
      <body className="font-sans">
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
