import { useEffect, useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import ExperiencesPage from "./pages/ExperiencesPage";
import OffersPage from "./pages/OffersPage";
import ServicesPage from "./pages/ServicesPage";
import SchedulerPage from "./pages/SchedulerPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import BookingPage from "./pages/BookingPage";
import RoomsPage from "./pages/RoomsPage";
import RoomDetailsPage from "./pages/RoomDetailsPage";
import ProfilePage from "./pages/ProfilePage";
import WishlistPage from "./pages/WishlistPage";
import { WishlistProvider } from "./context/WishlistContext";
import { NotificationProvider } from "./context/NotificationContext";
import { apiFetch } from "./lib/api";
import type { User } from "./types";

// Scroll to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Protected Route Guard: Requires signed-in user to access.
// If user is not logged in, redirects to /login.
function RequireAuth({ children }: { children: JSX.Element }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let active = true;
    const isExplicitlyLoggedIn =
      sessionStorage.getItem("website_user_logged_in") === "true" ||
      localStorage.getItem("website_user_logged_in") === "true" ||
      sessionStorage.getItem("user_logged_in") === "true";

    if (!isExplicitlyLoggedIn) {
      setUser(null);
      setLoading(false);
      return;
    }
    apiFetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active) {
          if (d && d.user) setUser(d.user);
          else setUser(null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center font-jost text-slate-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default function App() {
  return (
    <WishlistProvider>
      <NotificationProvider>
        <ScrollToTop />
        <Routes>
          {/* Public Landing Website Page */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Auth Pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

                    {/* Protected Pages - User Login Required */}
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />
          <Route
            path="/wishlist"
            element={
              <RequireAuth>
                <WishlistPage />
              </RequireAuth>
            }
          />
          <Route
            path="/scheduler"
            element={
              <RequireAuth>
                <SchedulerPage />
              </RequireAuth>
            }
          />

          {/* Public Pages that have internal Auth Modals for specific actions */}
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:slug" element={<RoomDetailsPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/experiences" element={<ExperiencesPage />} />
          <Route path="/offers" element={<OffersPage />} />
          {/* Fallback to Home if unknown route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </NotificationProvider>
    </WishlistProvider>
  );
}
