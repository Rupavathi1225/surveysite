import { Outlet } from "react-router-dom";
import AdminTopNav from "@/components/admin/AdminTopNav";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AdminTopNav />
      <main className="container mx-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
