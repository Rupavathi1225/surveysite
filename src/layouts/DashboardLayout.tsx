import { Outlet } from "react-router-dom";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <DashboardHeader />
      <main className="md:ml-64 pt-16 p-4 md:p-6 transition-all">
        <Outlet />
      </main>
    </div>
  );
}
