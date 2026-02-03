import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Auth Pages
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import ForgotPassword from "@/pages/auth/ForgotPassword";

// Layouts
import DashboardLayout from "@/layouts/DashboardLayout";
import AdminLayout from "@/layouts/AdminLayout";

// Dashboard Pages
import Dashboard from "@/pages/dashboard/Dashboard";
import BalanceHistory from "@/pages/dashboard/BalanceHistory";
import UpdateAccount from "@/pages/dashboard/UpdateAccount";
import Inbox from "@/pages/dashboard/Inbox";
import Affiliates from "@/pages/dashboard/Affiliates";
import Withdrawal from "@/pages/dashboard/Withdrawal";
import ConvertPoints from "@/pages/dashboard/ConvertPoints";
import DailySurveys from "@/pages/dashboard/DailySurveys";
import Contest from "@/pages/dashboard/Contest";
import News from "@/pages/dashboard/News";
import Promocode from "@/pages/dashboard/Promocode";
import WithdrawalHistory from "@/pages/dashboard/WithdrawalHistory";
import Leaderboard from "@/pages/dashboard/Leaderboard";
import SupportTicket from "@/pages/dashboard/SupportTicket";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import SurveyProviders from "@/pages/admin/SurveyProviders";
import SingleLinkProviders from "@/pages/admin/SingleLinkProviders";
import SurveyLinks from "@/pages/admin/SurveyLinks";
import AdminContests from "@/pages/admin/AdminContests";
import AdminTransactions from "@/pages/admin/AdminTransactions";
import AdminWithdrawals from "@/pages/admin/AdminWithdrawals";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminNews from "@/pages/admin/AdminNews";
import AdminPromocodes from "@/pages/admin/AdminPromocodes";
import AdminPages from "@/pages/admin/AdminPages";
import AdminPaymentMethods from "@/pages/admin/AdminPaymentMethods";
import AdminChangePassword from "@/pages/admin/AdminChangePassword";
import AdminUpdateProfile from "@/pages/admin/AdminUpdateProfile";
import AdminSettings from "@/pages/admin/AdminSettings";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* User Dashboard Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="balance-history" element={<BalanceHistory />} />
              <Route path="account" element={<UpdateAccount />} />
              <Route path="inbox" element={<Inbox />} />
              <Route path="affiliates" element={<Affiliates />} />
              <Route path="withdraw" element={<Withdrawal />} />
              <Route path="convert" element={<ConvertPoints />} />
              <Route path="surveys" element={<DailySurveys />} />
              <Route path="contest" element={<Contest />} />
              <Route path="news" element={<News />} />
              <Route path="promocode" element={<Promocode />} />
              <Route path="withdrawal-history" element={<WithdrawalHistory />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="support" element={<SupportTicket />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="survey-providers" element={<SurveyProviders />} />
              <Route path="single-link-providers" element={<SingleLinkProviders />} />
              <Route path="survey-links" element={<SurveyLinks />} />
              <Route path="contests" element={<AdminContests />} />
              <Route path="transactions" element={<AdminTransactions />} />
              <Route path="withdrawals" element={<AdminWithdrawals />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="news" element={<AdminNews />} />
              <Route path="promocodes" element={<AdminPromocodes />} />
              <Route path="pages" element={<AdminPages />} />
              <Route path="payment-methods" element={<AdminPaymentMethods />} />
              <Route path="change-password" element={<AdminChangePassword />} />
              <Route path="update-profile" element={<AdminUpdateProfile />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
