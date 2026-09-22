import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Lead 管理后台｜Ascendia Partners"
};

export default async function AdminPage() {
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/login");
  return <AdminDashboard adminEmail={admin.email} />;
}
