import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <AdminHeader />
      <main className="md:ml-64 pt-16 p-4 md:p-6 transition-all">
        <Outlet />
      </main>
    </div>
  );
}
