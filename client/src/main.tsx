// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import AdminLogin from "./components/AdminLogin.tsx";
import AdminDashboard from "./components/AdminDashboard.tsx";
import AdminRoute from "./components/AdminRoute.tsx";

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <BrowserRouter>
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route path="/*" element={<App />} />
    </Routes>
  </BrowserRouter>,
  // </StrictMode>,
);
