import { buildMetadata } from "@/lib/metadata";
import RegisterClient from "./RegisterClient";

export const metadata = buildMetadata({
  title: "注册 — GlobalPush",
  description: "创建 GlobalPush 账号，获取全球优质推广资源。",
});

export default function RegisterPage() {
  return <RegisterClient />;
}
