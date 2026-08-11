import type { ReactNode } from "react";
import { requireChatGPTUser } from "../chatgpt-auth";
import { AppShell } from "../../components/layout/AppShell";

export const dynamic = "force-dynamic";

export default async function MainAppLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await requireChatGPTUser("/records");
  return <AppShell user={user}>{children}</AppShell>;
}
