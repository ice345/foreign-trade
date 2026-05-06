import WalletClient from "./WalletClient";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "钱包 — GlobalPush",
  description: "查看余额、充值记录与交易明细。",
  robots: { index: false, follow: false },
});

export default function WalletPage() {
  return <WalletClient />;
}
