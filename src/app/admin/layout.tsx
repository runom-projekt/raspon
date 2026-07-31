import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/anmelden");
  if (session.role !== "ADMIN") redirect("/");

  return (
    <div className="flex min-h-screen flex-col bg-graphite-50 md:flex-row">
      <AdminSidebar />
      <main className="flex-1 overflow-x-hidden p-6 lg:p-10">{children}</main>
    </div>
  );
}
