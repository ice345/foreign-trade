import { buildMetadata } from "@/lib/metadata";
import ForgotPasswordClient from "./ForgotPasswordClient";

export const metadata = buildMetadata({
  title: "找回密码 — GlobalPush",
  description: "通过邮箱或手机号重置你的 GlobalPush 密码。",
});

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
