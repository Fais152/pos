import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/server/auth";

export default async function KasirLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["owner", "kasir"]);
  return <AppShell roles={["owner", "kasir"]}>{children}</AppShell>;
}
