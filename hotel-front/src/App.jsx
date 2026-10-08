import { Component } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import RoomManagement from "./pages/RoomManagement.jsx";
import Customers from "./pages/Customers.jsx";
import Housekeeping from "./pages/Housekeeping.jsx";
import Payroll from "./pages/Payroll.jsx";
import Reports from "./pages/Reports.jsx";
import CRM from "./pages/CRM.jsx";
import Offers from "./pages/Offers.jsx";
import OTA from "./pages/OTA.jsx";
import Inventory from "./pages/Inventory.jsx";
import Settings from "./pages/Settings.jsx";
import RoleManagement from "./pages/RoleManagement.jsx";
import Organizations from "./pages/Organizations.jsx";
import Employees from "./pages/Employees.jsx";
import AiIntegrations from "./pages/AiIntegrations.jsx";
import HotelAiHub from "./pages/hotel-ai/HotelAiHub.jsx";
import Notifications from "./pages/Notifications.jsx";
import Profile from "./pages/Profile.jsx";
import Queries from "./pages/Queries.jsx";
import Balance from "./pages/Balance.jsx";
import NoAccess from "./pages/NoAccess.jsx";
import { isAuthenticated, getUserRole } from "./auth.js";
import { accessLevel } from "./rbac.js";
import RoomDetails from "./pages/RoomDetails";
import NewBooking from "./pages/NewBooking.jsx";
import Calendar from "./pages/Calendar.jsx";
import LandingPage from "./pages/LandingPage.jsx";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
          <h2>Something went wrong.</h2>
          <p style={{ color: "#ef4444" }}>{this.state.error?.message || "An unexpected error occurred."}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "8px 16px",
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "16px",
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RequireAccess({ moduleKey, children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  const role = getUserRole();
  if (role === "guest") {
    const allowed = ["dashboard", "customers", "billing", "crm", "profile", "settings"];
    if (!allowed.includes(moduleKey)) {
      return <Navigate to="/dashboard" replace />;
    }
  }
  if (!accessLevel(role, moduleKey)) {
    return <NoAccess moduleKey={moduleKey} />;
  }
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/home" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calendar" element={<RequireAccess moduleKey="calendar"><Calendar /></RequireAccess>} />
          <Route path="/rooms" element={<RequireAccess moduleKey="rooms"><RoomManagement /></RequireAccess>} />
          <Route path="/rooms/:id" element={<RequireAccess moduleKey="rooms"><RoomDetails /></RequireAccess>} />
          <Route path="/book-now" element={<RequireAccess moduleKey="rooms"><NewBooking /></RequireAccess>} />
          <Route path="/customers" element={<RequireAccess moduleKey="customers"><Customers /></RequireAccess>} />
          <Route path="/billing" element={<Navigate to="/customers" replace />} />
          <Route path="/housekeeping" element={<RequireAccess moduleKey="housekeeping"><Housekeeping /></RequireAccess>} />
          <Route path="/staff-dashboard" element={<RequireAccess moduleKey="housekeeping"><Housekeeping defaultTab="portal" /></RequireAccess>} />
          <Route path="/maintenance" element={<Navigate to="/inventory?tab=maintenance" replace />} />
          <Route path="/payroll" element={<RequireAccess moduleKey="payroll"><Payroll /></RequireAccess>} />
          <Route path="/accounting" element={<RequireAccess moduleKey="payroll"><Payroll /></RequireAccess>} />
          <Route path="/reports" element={<RequireAccess moduleKey="reports"><Reports /></RequireAccess>} />
          <Route path="/crm" element={<RequireAccess moduleKey="crm"><CRM /></RequireAccess>} />
          <Route path="/offers" element={<RequireAccess moduleKey="offers"><Offers /></RequireAccess>} />
          <Route path="/ota" element={<RequireAccess moduleKey="ota"><OTA /></RequireAccess>} />
          <Route path="/inventory" element={<RequireAccess moduleKey="inventory"><Inventory /></RequireAccess>} />
          <Route path="/settings" element={<RequireAccess moduleKey="settings"><Settings /></RequireAccess>} />
          <Route path="/employees" element={<RequireAccess moduleKey="employees"><Employees /></RequireAccess>} />
          <Route path="/roles" element={<RequireAccess moduleKey="roles"><RoleManagement /></RequireAccess>} />
          <Route path="/organizations" element={<RequireAccess moduleKey="organizations"><Organizations /></RequireAccess>} />
          <Route path="/hotel-ai" element={<RequireAccess moduleKey="hotel_ai"><HotelAiHub /></RequireAccess>} />
          <Route path="/hotel-ai/*" element={<RequireAccess moduleKey="hotel_ai"><HotelAiHub /></RequireAccess>} />
          <Route path="/ai-integrations" element={<RequireAccess moduleKey="ai"><AiIntegrations /></RequireAccess>} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/queries" element={<Queries />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/balance" element={<Balance />} />
          <Route path="/orders" element={<RequireAccess moduleKey="orders"><Housekeeping defaultTab="kitchen" defaultSubTab="orders" /></RequireAccess>} />
          <Route path="/kitchen" element={<RequireAccess moduleKey="kitchen"><Housekeeping defaultTab="kitchen" /></RequireAccess>} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <ToastContainer />
    </ErrorBoundary>
  );
}
