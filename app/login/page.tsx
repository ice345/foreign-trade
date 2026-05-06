import { buildMetadata } from "@/lib/metadata";
import LoginClient from "./LoginClient";

export const metadata = buildMetadata({
  title: "登录 — GlobalPush",
  description: "登录你的 GlobalPush 账号，管理海外推广资源。",
});

export default function LoginPage() {
  return <LoginClient />;
}
