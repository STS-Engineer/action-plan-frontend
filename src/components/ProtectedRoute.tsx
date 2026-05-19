import { Navigate, useLocation } from "react-router";
import { getStoredAccessToken } from "../services/axiosInstance";
import { storeRedirect } from "../utils/actionDeepLink";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = getStoredAccessToken();
  const location = useLocation();

  if (!token) {
    storeRedirect(`${location.pathname}${location.search}${location.hash}`);

    return <Navigate to="/login" replace />;
  }

  return children;
}
