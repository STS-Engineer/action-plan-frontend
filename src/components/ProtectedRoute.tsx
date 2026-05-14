import { Navigate, useLocation } from "react-router";
import { storeRedirect } from "../utils/actionDeepLink";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    storeRedirect(`${location.pathname}${location.search}${location.hash}`);

    return <Navigate to="/login" replace />;
  }

  return children;
}
