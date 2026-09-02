import { Navigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

/**
 * Wraps a route so that only role="admin" users can reach it. Assumes it's
 * nested inside ProtectedRoute (or another check that token exists) — this
 * only checks role, not whether the user is logged in at all.
 */
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const toasted = useRef(false);

  useEffect(() => {
    if (!isAdmin && !toasted.current) {
      toasted.current = true;
      toast.error("Admin access required.");
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
