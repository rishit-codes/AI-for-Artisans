import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/site/ProtectedRoute";
import AdminRoute from "@/components/site/AdminRoute";
import { useAppearanceEffects } from "@/hooks/use-appearance";
import { useNotificationsWs } from "@/hooks/use-notifications-ws";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import VerifyEmail from "./pages/VerifyEmail.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Trends from "./pages/Trends.tsx";
import Mandi from "./pages/Mandi.tsx";
import Advisor from "./pages/Advisor.tsx";
import AdvisorOnboarding from "./pages/AdvisorOnboarding.tsx";
import Reports from "./pages/Reports.tsx";
import Profile from "./pages/Profile.tsx";
import Marketplace from "./pages/Marketplace.tsx";
import Cart from "./pages/Cart.tsx";
import Checkout from "./pages/Checkout.tsx";
import Settings from "./pages/Settings.tsx";
import Admin from "./pages/Admin.tsx";
import KarigarCard from "./pages/KarigarCard.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

// Mounted once, app-wide, regardless of which page/layout is active — some
// pages (e.g. Dashboard.tsx) predate AppShell and use their own layout, so
// this can't live inside AppShell without missing them. Needs to be a real
// child of QueryClientProvider since useNotificationsWs() calls
// useQueryClient(); it can't be called directly in App() above that provider.
const NotificationsSocket = () => {
  useNotificationsWs();
  return null;
};

const App = () => {
  useAppearanceEffects();
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <NotificationsSocket />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/karigar/:id" element={<KarigarCard />} />

          {/* Protected routes — redirect to /login if not signed in */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/trends" element={<ProtectedRoute><Trends /></ProtectedRoute>} />
          <Route path="/mandi" element={<ProtectedRoute><Mandi /></ProtectedRoute>} />
          <Route path="/advisor" element={<ProtectedRoute><Advisor /></ProtectedRoute>} />
          <Route path="/advisor/onboarding" element={<ProtectedRoute><AdvisorOnboarding /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminRoute><Admin /></AdminRoute></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
