import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { ADMIN_SESSION_KEY } from "../utils/adminAuth";

export default function AdminRoute({ children }: { children: ReactNode }) {
  const password = sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (!password) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}
