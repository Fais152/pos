import { AppShell } from "@/components/layout/app-shell";
import { requireOwner } from "@/server/auth";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  await requireOwner();
  return <AppShell roles={["owner"]}>{children}</AppShell>;
}
