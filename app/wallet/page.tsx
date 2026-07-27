import WalletClient from "./WalletClient";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "历史钱包 — GlobalPush",
  description: "查看只读的历史余额与交易明细。",
  robots: { index: false, follow: false },
});

export default function WalletPage() {
  return <WalletClient />;
}
