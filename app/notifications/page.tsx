import { buildMetadata } from "@/lib/metadata";
import NotificationsClient from "./NotificationsClient";

export const metadata = buildMetadata({
  title: "消息通知 — GlobalPush",
  description: "查看你的 GlobalPush 消息通知和订单状态更新。",
  robots: { index: false, follow: false },
});

export default function NotificationsPage() {
  return <NotificationsClient />;
}
