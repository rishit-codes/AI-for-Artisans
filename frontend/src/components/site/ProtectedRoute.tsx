import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

/**
 * Wraps a route so that unauthenticated users are redirected to /login.
 * The original path is saved in location state so Login can redirect back after sign-in.
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
