import { showSuccess, showError, showWarning, showInfo } from "../utils/toast.js";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import RowActions from "../components/RowActions.jsx";
import AccountantVisitorView from "../components/AccountantVisitorView.jsx";
import { getUserRole, getUserName, getCurrentOrgId } from "../auth.js";
import { accessLevel, canEdit, canView } from "../rbac.js";
import {
  getCustomers,
  fetchCustomersFromAPI,
  addCustomerToAPI,
  updateCustomerAPI,
  updatePaymentStatusAPI,
  updateCustomerStatusAPI,
  uploadDocumentAPI,
  deleteCustomerFromAPI,
} from "../utils/customerStore.js";
import { fetchAllBookings, checkinBookingAPI, checkoutBookingAPI } from "../services/bookingService.js";
import {
  FaUsers,
  FaPhoneAlt,
  FaEnvelope,
  FaBed,
  FaCheckCircle,
  FaThLarge,
  FaList,
  FaIdCard,
  FaFileUpload,
  FaFileAlt,
  FaTimes,
  FaEye,
  FaFilter,
  FaSearch,
  FaReceipt,
  FaMoneyBillWave,
  FaUserFriends,
  FaClock,
  FaCheck,
  FaPlus,
  FaTrash,
  FaVenusMars,
  FaMars,
  FaVenus,
  FaCrown,
  FaEdit,
  FaPrint,
  FaHotel,
  FaSave,
} from "react-icons/fa";
import PaymentWalletIcon from "../components/PaymentWalletIcon.jsx";

// Sliders Filter Icon matching project theme color (#667eea)
const ProjectThemeSlidersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="8" x2="21" y2="8" />
    <circle cx="8" cy="8" r="3" fill="#ffffff" stroke="#667eea" strokeWidth="2.2" />
    <line x1="3" y1="16" x2="21" y2="16" />
    <circle cx="16" cy="16" r="3" fill="#ffffff" stroke="#667eea" strokeWidth="2.2" />
  </svg>
);

// Helper to format Icon + Floor Number + Room Number without room type
function getFloorAndRoomDisplay(roomBookedStr) {
  if (!roomBookedStr) return "1st Floor - Room 101";
  const roomMatch = roomBookedStr.match(/Room\s*(\d+)/i) || roomBookedStr.match(/(\d+)/);
  const roomNum = roomMatch ? (roomMatch[1] || roomMatch[0]) : "101";
  const cleanRoom = `Room ${roomNum.replace(/^Room\s*/i, "")}`;
  const numVal = parseInt(roomNum.replace(/\D/g, ""), 10) || 101;
  const floorNum = Math.floor(numVal / 100) || 1;
  const suffixes = ["th", "st", "nd", "rd"];
  const v = floorNum % 100;
  const suffix = suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
  const floorStr = `${floorNum}${suffix} Floor`;
  return `${floorStr} - ${cleanRoom}`;
}

// Helper for Gender Icon & Badge Style
function renderGenderBadge(gender) {
  const g = (gender || "Male").toLowerCase();
  if (g === "female") {
    return (
      <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: "700", background: "#fdf2f8", color: "#ec4899", display: "inline-flex", alignItems: "center", gap: "4px" }}>
        <FaVenus style={{ fontSize: "11px" }} /> Female
      </span>
    );
  }
  if (g === "other") {
    return (
      <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: "700", background: "#f1f5f9", color: "#64748b", display: "inline-flex", alignItems: "center", gap: "4px" }}>
        <FaVenusMars style={{ fontSize: "11px" }} /> Other
      </span>
    );
  }
  return (
    <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: "700", background: "#eff6ff", color: "#3b82f6", display: "inline-flex", alignItems: "center", gap: "4px" }}>
      <FaMars style={{ fontSize: "11px" }} /> Male
    </span>
  );
}

export default function Customers() {
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") || "";
  const [customersList, setCustomersList] = useState(getCustomers);
  const [q, setQ] = useState(urlSearch);

  // Dynamic Theme Observer State
  const [isDark, setIsDark] = useState(() => document.documentElement.getAttribute("data-theme") === "dark");

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (urlSearch) setQ(urlSearch);
  }, [urlSearch]);

  const [viewMode, setViewMode] = useState("list");

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [genderFilter, setGenderFilter] = useState("all"); // "all", "Male", "Female", "Other"
  const [docFilter, setDocFilter] = useState("all"); // "all", "uploaded", "pending"
  const [paymentFilter, setPaymentFilter] = useState("all"); // "all", "paid", "unpaid"
  const [sortBy, setSortBy] = useState("lastVisit"); // "lastVisit", "spend", "visits"

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false);
  const [selectedDocCustomer, setSelectedDocCustomer] = useState(null);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [editCustomerForm, setEditCustomerForm] = useState({
    name: "",
    gender: "Male",
    phone: "",
    email: "",
    tier: "Daily Guest",
    roomBooked: "Room 101",
    checkIn: "",
    checkOut: "",
    stayDays: 2,
    guestsCount: 1,
    totalBill: 2500,
    paidAmount: 2500,
    paymentStatus: "Paid",
    status: "Active",
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  function openCustomerDetails(c) {
    setSelectedCustomerDetails(c);
    setIsEditingCustomer(false);
    const bill = Number(c.totalBill) || 2500;
    const paid = c.paidAmount !== undefined && c.paidAmount !== null 
      ? Number(c.paidAmount) 
      : (c.paymentStatus === "Paid" ? bill : 0);
    setEditCustomerForm({
      name: c.name || "",
      gender: c.gender || "Male",
      phone: c.phone || "",
      email: c.email || "",
      tier: c.tier || "Daily Guest",
      roomBooked: c.roomBooked || "Room 101",
      checkIn: c.checkIn || "",
      checkOut: c.checkOut || "",
      stayDays: Number(c.stayDays) || 2,
      guestsCount: Number(c.guestsCount) || 1,
      totalBill: bill,
      paidAmount: paid,
      paymentStatus: c.paymentStatus || "Paid",
      status: c.status || "Active",
    });
  }

  async function handleSaveCustomerEdit(e) {
    if (e) e.preventDefault();
    if (!editCustomerForm.name?.trim()) {
      showWarning("Customer name is required.");
      return;
    }
    setIsSavingEdit(true);
    try {
      const res = await updateCustomerAPI(selectedCustomerDetails.id, editCustomerForm);
      if (res && res.success) {
        setCustomersList(res.customers);
        const updatedCustomer = res.customer || { ...selectedCustomerDetails, ...editCustomerForm };
        setSelectedCustomerDetails(updatedCustomer);
        setIsEditingCustomer(false);
        showSuccess("Customer & billing details updated successfully!");
      } else {
        showError("Failed to update customer details.");
      }
    } catch (err) {
      console.error("Save customer edit error:", err);
      showError("Error saving customer changes.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  function handlePrintReceipt() {
    window.print();
  }
  
  const userRole = getUserRole();
  const isSuperAdmin = userRole === "super_admin";

  // If logged in as Super Admin, render dedicated Visitor Management registry
  if (isSuperAdmin) {
    return (
      <div style={{ padding: "0 0 24px 0" }}>
        <AccountantVisitorView isSuperAdmin={true} />
      </div>
    );
  }

  const currentOrg = getCurrentOrgId();
  const isGuest = userRole === "guest";
  const hasFullAccess = canEdit("customers", userRole);
  const accessString = accessLevel(userRole, "customers") || "";

  // Form State for Registering New Guest
  const [newGuestForm, setNewGuestForm] = useState({
    name: "",
    gender: "Male",
    phone: "",
    email: "",
    roomBooked: "Room 101",
    checkIn: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    checkOut: "19 Aug 2026",
    stayDays: 2,
    guestsCount: 1,
    totalBill: 2500,
    paymentStatus: "Paid",
    tier: "Daily Guest",
  });

  useEffect(() => {
    let active = true;
    let authFailed = false;
    let interval;

    const fetchList = () => {
      if (authFailed) return;
      fetchCustomersFromAPI().then((data) => {
        if (!active) return;
        if (data && data.authError) {
          authFailed = true;
          showError("Session expired or unauthorized. Please log in again.");
          if (interval) clearInterval(interval);
          return;
        }
        if (Array.isArray(data)) setCustomersList(data);
      });
    };
    
    // Initial fetch
    fetchList();
    
    // Real-time synchronization polling every 5 seconds
    interval = setInterval(fetchList, 5000);
    
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const scoped = isGuest
    ? customersList.filter((c) => c.name === getUserName())
    : customersList;

  // Category counts
  const dailyCount = scoped.filter((c) => c.tier === "Daily Guest").length;
  const platinumCount = scoped.filter((c) => c.tier === "Platinum").length;
  const goldCount = scoped.filter((c) => c.tier === "Gold").length;
  const silverCount = scoped.filter((c) => c.tier === "Silver").length;
  const allCount = scoped.length;

  // Filtered List
  const filtered = scoped
    .filter((c) => {
      // Category / Loyalty Tier Filter
      if (selectedCategory !== "All" && c.tier !== selectedCategory) return false;

      // Gender Filter
      if (genderFilter !== "all" && (c.gender || "Male").toLowerCase() !== genderFilter.toLowerCase()) return false;

      // Document Status Filter
      if (docFilter === "uploaded" && !c.document) return false;
      if (docFilter === "pending" && c.document) return false;

      // Payment Status Filter
      if (paymentFilter === "paid" && c.paymentStatus !== "Paid") return false;
      if (paymentFilter === "unpaid" && c.paymentStatus === "Paid") return false;

      // Search Query Filtering
      const searchLower = q.toLowerCase();
      if (searchLower) {
        const match =
          c.name.toLowerCase().includes(searchLower) ||
          (c.gender && c.gender.toLowerCase().includes(searchLower)) ||
          c.email.toLowerCase().includes(searchLower) ||
          c.phone.toLowerCase().includes(searchLower) ||
          c.tier.toLowerCase().includes(searchLower) ||
          (c.roomBooked && c.roomBooked.toLowerCase().includes(searchLower)) ||
          (c.invoiceId && c.invoiceId.toLowerCase().includes(searchLower)) ||
          (c.document?.fileName && c.document.fileName.toLowerCase().includes(searchLower));
        if (!match) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "spend") {
        const numA = typeof a.amount === "number" ? a.amount : parseInt(String(a.amount).replace(/[^0-9]/g, "")) || 0;
        const numB = typeof b.amount === "number" ? b.amount : parseInt(String(b.amount).replace(/[^0-9]/g, "")) || 0;
        return numB - numA;
      }
      if (sortBy === "visits") {
        return (b.stays || 0) - (a.stays || 0);
      }
      return 0;
    });

  function resetAllFilters() {
    setSelectedCategory("All");
    setGenderFilter("all");
    setDocFilter("all");
    setPaymentFilter("all");
    setSortBy("lastVisit");
    setQ("");
  }

  async function handleMarkPayment(customerId, newStatus = "Paid") {
    const updated = await updatePaymentStatusAPI(customerId, newStatus);
    setCustomersList(updated);
    if (newStatus === "Paid") showSuccess("Payment recorded successfully.");
    if (selectedCustomerDetails && selectedCustomerDetails.id === customerId) {
      setSelectedCustomerDetails({
        ...selectedCustomerDetails,
        paymentStatus: newStatus,
        paidAmount: newStatus === "Paid" ? (selectedCustomerDetails.totalBill || 2500) : 0,
      });
    }
  }

  async function handleDirectUpload(customerId, e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const updated = await uploadDocumentAPI(customerId, "Aadhaar Card", file);
    setCustomersList(updated);

    const docObj = {
      fileName: file.name,
      docType: "Aadhaar Card",
      fileUrl: URL.createObjectURL(file),
      status: "Uploaded & Verified",
      uploadedAt: "Just now",
    };

    if (selectedDocCustomer && selectedDocCustomer.id === customerId) {
      setSelectedDocCustomer({ ...selectedDocCustomer, document: docObj });
    }
    if (selectedCustomerDetails && selectedCustomerDetails.id === customerId) {
      setSelectedCustomerDetails({ ...selectedCustomerDetails, document: docObj });
    }
  }

  async function handleAddGuestSubmit(e) {
    e.preventDefault();
    if (!newGuestForm.name || !newGuestForm.phone) return;
    const formattedPhone = `${newGuestForm.countryCode || "+91"} ${newGuestForm.phone.trim()}`;
    const updated = await addCustomerToAPI({ ...newGuestForm, phone: formattedPhone });
    setCustomersList(updated);
    showSuccess("Customer added successfully.");
    setIsAddGuestModalOpen(false);
    setNewGuestForm({
      name: "",
      gender: "Male",
      phone: "",
      email: "",
      roomBooked: "Room 101",
      checkIn: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      checkOut: "19 Aug 2026",
      stayDays: 2,
      guestsCount: 1,
      totalBill: 2500,
      paymentStatus: "Paid",
      tier: "Daily Guest",
    });
  }

  async function handleDeleteGuest(customerId) {
    if (window.confirm("Are you sure you want to delete this guest profile?")) {
      const updated = await deleteCustomerFromAPI(customerId);
      setCustomersList(updated);
      if (selectedCustomerDetails && selectedCustomerDetails.id === customerId) {
        setSelectedCustomerDetails(null);
      }
    }
  }

  async function handleCheckIn(customerId) {
    try {
      const customer = customersList.find(c => c.id === customerId);
      if (!customer) throw new Error("Customer not found locally.");
      
      const allBookings = await fetchAllBookings();
      const customerBookings = allBookings.filter(b => 
        (
          (String(b.guestName).toLowerCase().trim() === String(customer.name).toLowerCase().trim() || 
           String(b.guestPhone) === String(customer.phone) ||
           String(b.guestEmail).toLowerCase().trim() === String(customer.email).toLowerCase().trim())
          &&
          (!customer.roomBooked || String(b.roomNumber).replace(/[^0-9]/g, "") === String(customer.roomBooked).replace(/[^0-9]/g, ""))
        )
      );
      
      if (customerBookings.length === 0) {
        showError("No booking found for this customer in the assigned room.");
        return;
      }
      
      // Sort by newest first just in case
      customerBookings.sort((a, b) => b.pkId - a.pkId);
      const targetBooking = customerBookings[0];
      
      if (targetBooking.status === "Active Stay" || targetBooking.status === "Occupied") {
        showError("Booking is already checked in.");
        return;
      }
      if (targetBooking.status === "Completed" || targetBooking.status === "Checked Out") {
        showError("Booking is already checked out.");
        return;
      }
      if (!["Confirmed", "Reserved", "Upcoming"].includes(targetBooking.status)) {
        showError(`Cannot check in. Booking status is ${targetBooking.status}.`);
        return;
      }
      
      const result = await checkinBookingAPI(targetBooking.id || targetBooking.pkId);
      if (!result) throw new Error("Failed to check in via backend.");
      
      // Re-fetch to sync state across the board
      const updated = await fetchCustomersFromAPI();
      setCustomersList(updated);
      if (selectedCustomerDetails && selectedCustomerDetails.id === customerId) {
        setSelectedCustomerDetails((prev) => ({ ...prev, status: "Checked In" }));
      }
      showSuccess("Customer checked in successfully.");
    } catch (err) {
      showError(err.message || "Failed to check in customer.");
    }
  }

  async function handleCheckOut(customer) {
    if (customer.paymentStatus !== "Paid") {
      showWarning(`Payment of ₹${customer.totalBill || 2500} is required before checking out! Please collect payment first.`);
      return;
    }
    if (window.confirm(`Are you sure you want to check out ${customer.name}?`)) {
      try {
        const allBookings = await fetchAllBookings();
        const customerBookings = allBookings.filter(b => 
          (
            (String(b.guestName).toLowerCase().trim() === String(customer.name).toLowerCase().trim() || 
             String(b.guestPhone) === String(customer.phone) ||
             String(b.guestEmail).toLowerCase().trim() === String(customer.email).toLowerCase().trim())
            &&
            (!customer.roomBooked || String(b.roomNumber).replace(/[^0-9]/g, "") === String(customer.roomBooked).replace(/[^0-9]/g, ""))
          )
        );
        
        if (customerBookings.length === 0) {
          showError("No booking found for this customer in the assigned room.");
          return;
        }

        customerBookings.sort((a, b) => b.pkId - a.pkId);
        const targetBooking = customerBookings[0];
        
        if (targetBooking.status === "Completed" || targetBooking.status === "Checked Out") {
          showError("Booking is already checked out.");
          return;
        }
        if (!["Active Stay", "Occupied"].includes(targetBooking.status)) {
          showError(`Cannot check out. Booking status is ${targetBooking.status}.`);
          return;
        }

        const result = await checkoutBookingAPI(targetBooking.id || targetBooking.pkId);
        if (!result) throw new Error("Failed to check out via backend.");
        
        // Re-fetch to sync state
        const updated = await fetchCustomersFromAPI();
        setCustomersList(updated);
        if (selectedCustomerDetails && selectedCustomerDetails.id === customer.id) {
          setSelectedCustomerDetails((prev) => ({ ...prev, status: "Checked Out" }));
        }
        showSuccess("Customer checked out successfully.");
      } catch (err) {
        showError(err.message || "Failed to check out customer.");
      }
    }
  }

  // Summary KPI Calculations
  const totalRevenue = scoped.reduce((acc, c) => acc + (Number(c.totalBill) || 0), 0);
  const unpaidTotal = scoped.filter((c) => c.paymentStatus !== "Paid").reduce((acc, c) => acc + (Number(c.totalBill) || 0), 0);

  return (
    <>
      <PageHeader
        title="Customers & Billing"
        subtitle={
          isGuest
            ? "View your room booking details, invoices & payments"
            : "Unified Customer Profiles, Room Bookings, Stay Duration, ID Documents & Invoices / Payments"
        }
        action={
          !isGuest && hasFullAccess && (
            <button
              type="button"
              onClick={() => setIsAddGuestModalOpen(true)}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#ffffff",
                padding: "10px 20px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "700",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(102, 126, 234, 0.4)",
              }}
            >
              <FaPlus /> Register New Guest
            </button>
          )
        }
      />

      {/* SUMMARY KPI CARDS */}
      {!isGuest && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
          <div
            className="inv-stat-card total"
            onClick={() => setSelectedCategory("All")}
            style={{
              cursor: "pointer",
              padding: "18px",
              borderRadius: "16px",
              background: isDark ? "#0f172a" : "#ffffff",
              border: isDark ? "1px solid #334155" : "1px solid #eef2f6",
              boxShadow: isDark ? "0 4px 14px rgba(0,0,0,0.3)" : "0 2px 10px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: isDark ? "#94a3b8" : "#64748b" }}>Total Registered Guests</span>
              <FaUserFriends style={{ color: "#667eea" }} />
            </div>
            <div style={{ fontSize: "24px", fontWeight: "800", marginTop: "4px", color: isDark ? "#ffffff" : "#0f172a" }}>
              {scoped.length} Guests
            </div>
          </div>

          <div
            className="inv-stat-card low"
            onClick={() => setPaymentFilter("unpaid")}
            style={{
              cursor: "pointer",
              padding: "18px",
              borderRadius: "16px",
              background: isDark ? "rgba(220, 38, 38, 0.15)" : "#ffffff",
              border: isDark ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid #eef2f6",
              boxShadow: isDark ? "0 4px 14px rgba(0,0,0,0.3)" : "0 2px 10px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: isDark ? "#fca5a5" : "#64748b" }}>Unpaid Billing Dues</span>
              <span style={{ fontSize: "11px", color: isDark ? "#f87171" : "#dc2626", fontWeight: "700" }}>Filter Unpaid</span>
            </div>
            <div style={{ fontSize: "24px", fontWeight: "800", marginTop: "4px", color: isDark ? "#ef4444" : "#dc2626" }}>
              ₹{unpaidTotal.toLocaleString("en-IN")}
            </div>
          </div>

          <div
            className="inv-stat-card val"
            style={{
              padding: "18px",
              borderRadius: "16px",
              background: isDark ? "rgba(16, 185, 129, 0.15)" : "#ffffff",
              border: isDark ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid #eef2f6",
              boxShadow: isDark ? "0 4px 14px rgba(0,0,0,0.3)" : "0 2px 10px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: isDark ? "#6ee7b7" : "#64748b" }}>Total Billing Revenue</span>
              <PaymentWalletIcon color="#10b981" size={22} />
            </div>
            <div style={{ fontSize: "24px", fontWeight: "800", marginTop: "4px", color: "#10b981" }}>
              ₹{totalRevenue.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER CARD */}
      <section className="panel" style={{ padding: "24px", borderRadius: "20px" }}>
        {!isGuest && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
            {/* TOP ROW: SEARCH BAR + GENDER SEGMENTED SWITCHER + FILTERS BUTTON + VIEW TOGGLE */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              {/* UPGRADED SAAS SEARCH INPUT BAR WITH PERFECT FLEXBOX ALIGNMENT */}
              <div
                className="cust-search-box"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flex: "1 1 280px",
                  maxWidth: "380px",
                  width: "100%",
                  padding: "9px 14px",
                  borderRadius: "14px",
                  transition: "all 0.2s ease",
                }}
              >
                <FaSearch
                  style={{
                    color: "#94a3b8",
                    fontSize: "13.5px",
                    flexShrink: 0,
                  }}
                />
                <input
                  type="text"
                  className="cust-search-input"
                  placeholder="Search guest by name, room, phone, email..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  style={{
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    fontSize: "13.5px",
                    fontWeight: "500",
                    width: "100%",
                    margin: 0,
                    padding: 0,
                  }}
                />
                {q && (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    style={{
                      background: "#e2e8f0",
                      border: "none",
                      color: "#64748b",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "auto", flexWrap: "wrap" }}>
                {/* PROJECT THEME FILTERS DRAWER PILL BUTTON */}
                <button
                  type="button"
                  className="cust-filter-btn"
                  onClick={() => setIsFilterDrawerOpen(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    borderRadius: "999px",
                    border: isDark ? "1px solid #334155" : "none",
                    background: isDark ? "#0f172a" : "#f1f5f9",
                    color: isDark ? "#e2e8f0" : "#475569",
                    fontSize: "13.5px",
                    fontWeight: "700",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <ProjectThemeSlidersIcon />
                  <span>Filters</span>

                  {/* ACTIVE TIER BADGE */}
                  <span
                    style={{
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "#ffffff",
                      borderRadius: "999px",
                      fontSize: "11px",
                      padding: "2px 8px",
                      fontWeight: "700",
                      marginLeft: "2px",
                      boxShadow: "0 2px 6px rgba(102, 126, 234, 0.3)",
                    }}
                  >
                    {selectedCategory}
                  </span>
                </button>

                {/* LIST / GRID VIEW TOGGLE SWITCH */}
                <div className="view-mode-toggle">
                  <button
                    type="button"
                    className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                    onClick={() => setViewMode("grid")}
                    title="Grid View"
                  >
                    <FaThLarge />
                  </button>
                  <button
                    type="button"
                    className={`view-btn ${viewMode === "list" ? "active" : ""}`}
                    onClick={() => setViewMode("list")}
                    title="List View"
                  >
                    <FaList />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LIST VIEW */}
        {viewMode === "list" ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
              <thead>
                <tr style={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "12px", textAlign: "left", whiteSpace: "nowrap" }}>
                  <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>Customer</th>
                  <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>Gender</th>
                  <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>Contact</th>
                  <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>Booked Room & Stay</th>
                  <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>Payment Status</th>
                  <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>Identity Document (ID)</th>
                  <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>Category Tier</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", whiteSpace: "nowrap" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="cust-table-row"
                    onClick={() => openCustomerDetails(c)}
                    style={{
                      background: isDark ? "#0f172a" : "#ffffff",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                      borderRadius: "12px",
                      border: isDark ? "1px solid #334155" : "1px solid #eef2f6",
                      cursor: "pointer",
                    }}
                  >
                    {/* CUSTOMER NAME + VERIFIED CHECK */}
                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <img
                          src={c.image}
                          alt={c.name}
                          style={{ width: "42px", height: "42px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 }}
                        />
                        <div style={{ minWidth: 0, overflow: "hidden" }}>
                          <div className="cust-name" style={{ fontWeight: "700", color: isDark ? "#ffffff" : "#0f172a", fontSize: "14px", display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                            <span>{c.name}</span>
                            <FaCheckCircle style={{ color: "#3b82f6", fontSize: "12px", flexShrink: 0 }} />
                          </div>
                          <div style={{ fontSize: "11px", color: isDark ? "#94a3b8" : "#64748b" }}>{c.username}</div>
                        </div>
                      </div>
                    </td>

                    {/* GENDER BADGE */}
                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      {renderGenderBadge(c.gender)}
                    </td>

                    {/* CONTACT */}
                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      <div style={{ fontSize: "12.5px", color: isDark ? "#e2e8f0" : "#334155", fontWeight: "600" }}>{c.email}</div>
                      <div style={{ fontSize: "11px", color: isDark ? "#94a3b8" : "#64748b" }}>{c.phone}</div>
                    </td>

                    {/* BOOKED ROOM & STAY DURATION & STATUS */}
                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      <div className="cust-info-val" style={{ fontSize: "13px", fontWeight: "700", color: isDark ? "#ffffff" : "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                        <FaBed style={{ color: "#667eea", flexShrink: 0 }} />
                        <span>{getFloorAndRoomDisplay(c.roomBooked)}</span>
                        {c.status && (
                          <span style={{ 
                            marginLeft: "8px", 
                            padding: "4px 10px", 
                            borderRadius: "999px", 
                            fontSize: "11px", 
                            fontWeight: "800", 
                            textTransform: "uppercase",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                            background: c.status === "Checked In" ? "#dcfce7" : c.status === "Checked Out" ? "#f3f4f6" : "#fef3c7", 
                            color: c.status === "Checked In" ? "#166534" : c.status === "Checked Out" ? "#4b5563" : "#b45309",
                            border: `1px solid ${c.status === "Checked In" ? "#bbf7d0" : c.status === "Checked Out" ? "#e5e7eb" : "#fde68a"}`
                          }}>
                            {c.status === "Active" ? "Pending Check-In" : c.status}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "11px", color: isDark ? "#94a3b8" : "#64748b", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <FaClock style={{ fontSize: "10px" }} />
                        <span>{c.stayDays || 2} Days ({c.checkIn || "Recent"} - {c.checkOut || "Checkout"})</span>
                      </div>
                    </td>

                    {/* MERGED BILLING & PAYMENT STATUS */}
                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          className={`badge ${c.paymentStatus === "Paid" ? "paid" : "unpaid"}`}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "999px",
                            fontSize: "11px",
                            fontWeight: "700",
                            background: c.paymentStatus === "Paid" ? "#dcfce7" : "#fee2e2",
                            color: c.paymentStatus === "Paid" ? "#15803d" : "#b91c1c",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {c.paymentStatus === "Paid" ? <FaCheck style={{ fontSize: "10px" }} /> : <FaTimes style={{ fontSize: "10px" }} />}
                          {c.paymentStatus === "Paid" ? "Paid" : "Unpaid"}
                        </span>
                        <strong className="cust-spend-val" style={{ fontSize: "13.5px", color: isDark ? "#ffffff" : "#0f172a" }}>
                          ₹{(Number(c.totalBill) || 2500).toLocaleString("en-IN")}
                        </strong>
                      </div>
                    </td>

                    {/* IDENTITY DOCUMENT */}
                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      {c.document ? (
                        <button
                          type="button"
                          className="cust-doc-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDocCustomer(c);
                          }}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "10px",
                            fontSize: "12px",
                            fontWeight: "600",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            maxWidth: "180px",
                          }}
                          title={c.document.name}
                        >
                          <FaFileAlt style={{ color: "#6366f1", flexShrink: 0 }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.document.name}
                          </span>
                          <FaEye style={{ fontSize: "11px", opacity: 0.7, flexShrink: 0 }} />
                        </button>
                      ) : (
                        <label
                          className="cust-upload-btn"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "10px",
                            fontSize: "11.5px",
                            fontWeight: "600",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <FaFileUpload style={{ color: "#6366f1", flexShrink: 0 }} /> Upload ID
                          <input
                            type="file"
                            accept="*"
                            style={{ display: "none" }}
                            onChange={(e) => handleDirectUpload(c.id, e)}
                          />
                        </label>
                      )}
                    </td>

                    {/* CATEGORY TIER */}
                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      <span
                        className="cust-tier-badge"
                        style={{
                          padding: "4px 12px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: "700",
                          background: c.tierBg || "#f1f5f9",
                          color: c.tierColor || "#475569",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span style={{ flexShrink: 0 }}>{c.tierIcon || "👤"}</span>
                        <span>{c.tier}</span>
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                        {(hasFullAccess || ((accessString === "Read & Write" || accessString === "Edit") && (!currentOrg || c.orgId === currentOrg || c.org_id === currentOrg))) && (
                          <>
                            {c.status === "Checked In" ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCheckOut(c);
                                }}
                                style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #ef4444", background: "#fef2f2", color: "#ef4444", fontSize: "11px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                              >
                                <FaTimes /> Check Out
                              </button>
                            ) : c.status !== "Checked Out" ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCheckIn(c.id);
                                }}
                                style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #10b981", background: "#ecfdf5", color: "#10b981", fontSize: "11px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                              >
                                <FaCheck /> Check In
                              </button>
                            ) : null}
                          </>
                        )}

                        {hasFullAccess && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGuest(c.id);
                            }}
                            title="Delete Guest"
                            style={{ background: "transparent", border: "none", color: "#dc2626", cursor: "pointer", padding: "6px" }}
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b", fontSize: "14px" }}>
                No customers found matching search criteria.
              </div>
            )}
          </div>
        ) : (
          /* GRID CARD VIEW */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
            {filtered.map((c) => (
              <div
                key={c.id}
                className="cust-grid-card"
                onClick={() => openCustomerDetails(c)}
                style={{
                  background: isDark ? "#0f172a" : "#ffffff",
                  border: isDark ? "1px solid #334155" : "1px solid #eef2f6",
                  borderRadius: "20px",
                  padding: "20px",
                  boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "16px",
                  cursor: "pointer",
                }}
              >
                {/* PROFILE HEADER */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                  <img
                    src={c.image}
                    alt={c.name}
                    style={{ width: "60px", height: "60px", borderRadius: "14px", objectFit: "cover", flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                      <h3 className="cust-name" style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: isDark ? "#ffffff" : "#0f172a", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>{c.name}</span>
                        <FaCheckCircle style={{ color: "#3b82f6", fontSize: "13px", flexShrink: 0 }} />
                      </h3>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {renderGenderBadge(c.gender)}
                      </div>
                    </div>

                    <div style={{ fontSize: "11.5px", color: isDark ? "#94a3b8" : "#64748b", marginTop: "2px" }}>
                      {c.username} • <span style={{ fontWeight: "700" }}>{c.tier}</span>
                    </div>

                    <div style={{ fontSize: "11px", color: isDark ? "#94a3b8" : "#64748b", marginTop: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span><FaPhoneAlt style={{ fontSize: "9px" }} /> {c.phone}</span>
                    </div>
                  </div>
                </div>

                {/* EMBEDDED DETAILS */}
                <div className="cust-info-box" style={{ background: isDark ? "#1e293b" : "#f8fafc", padding: "10px 14px", borderRadius: "12px", border: isDark ? "1px solid #334155" : "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="cust-info-val" style={{ fontSize: "12px", fontWeight: "700", color: isDark ? "#ffffff" : "#0f172a", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <FaBed style={{ color: "#667eea" }} />
                      {getFloorAndRoomDisplay(c.roomBooked)}
                    </span>
                    <span className="cust-info-val" style={{ fontSize: "12px", fontWeight: "700", color: isDark ? "#ffffff" : "#0f172a", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <FaClock style={{ color: "#10b981" }} />
                      {c.stayDays || 2} Days
                    </span>
                  </div>
                  
                  {c.status && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", fontWeight: "600", color: isDark ? "#94a3b8" : "#64748b" }}>Status:</span>
                      <span style={{ 
                        padding: "4px 8px", 
                        borderRadius: "999px", 
                        fontSize: "10.5px", 
                        fontWeight: "800", 
                        textTransform: "uppercase",
                        background: c.status === "Checked In" ? "#dcfce7" : c.status === "Checked Out" ? "#f3f4f6" : "#fef3c7", 
                        color: c.status === "Checked In" ? "#166534" : c.status === "Checked Out" ? "#4b5563" : "#b45309",
                        border: `1px solid ${c.status === "Checked In" ? "#bbf7d0" : c.status === "Checked Out" ? "#e5e7eb" : "#fde68a"}`
                      }}>
                        {c.status === "Active" ? "Pending Check-In" : c.status}
                      </span>
                    </div>
                  )}
                </div>

                {/* CARD FOOTER */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "10px" }}>
                  <div>
                    <div style={{ fontSize: "10.5px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase" }}>Total Bill</div>
                    <strong className="cust-spend-val" style={{ fontSize: "16px", fontWeight: "800", color: isDark ? "#ffffff" : "#0f172a" }}>
                      ₹{(Number(c.totalBill) || 2500).toLocaleString("en-IN")}
                    </strong>
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {(hasFullAccess || ((accessString === "Read & Write" || accessString === "Edit") && (!currentOrg || c.orgId === currentOrg || c.org_id === currentOrg))) && (
                      <>
                        {c.status === "Checked In" ? (
                          <button
                            type="button"
                            onClick={() => handleCheckOut(c)}
                            style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #ef4444", background: "#fef2f2", color: "#ef4444", fontSize: "11px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            <FaTimes /> Check Out
                          </button>
                        ) : c.status !== "Checked Out" ? (
                          <button
                            type="button"
                            onClick={() => handleCheckIn(c.id)}
                            style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #10b981", background: "#ecfdf5", color: "#10b981", fontSize: "11px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            <FaCheck /> Check In
                          </button>
                        ) : null}
                      </>
                    )}

                    {hasFullAccess && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGuest(c.id);
                        }}
                        title="Delete Guest"
                        style={{ background: "transparent", border: "none", color: "#dc2626", cursor: "pointer", padding: "6px" }}
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* REGISTER NEW GUEST MODAL */}
      {isAddGuestModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddGuestModalOpen(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "20px" }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>Register New Hotel Guest</h3>
              <button type="button" onClick={() => setIsAddGuestModalOpen(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#cbd5e1", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer" }}><FaTimes /></button>
            </div>

            <form onSubmit={handleAddGuestSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Full Name</label>
                  <input type="text" required placeholder="e.g. Vikram Malhotra" value={newGuestForm.name} onChange={(e) => setNewGuestForm({ ...newGuestForm, name: e.target.value })} className="modal-input" />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Gender</label>
                  <select value={newGuestForm.gender} onChange={(e) => setNewGuestForm({ ...newGuestForm, gender: e.target.value })} className="modal-select">
                    <option value="Male">👨 Male</option>
                    <option value="Female">👩 Female</option>
                    <option value="Other">👤 Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Mobile Number ({newGuestForm.phone.length}/10)</label>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <select
                      value={newGuestForm.countryCode || "+91"}
                      onChange={(e) => setNewGuestForm({ ...newGuestForm, countryCode: e.target.value })}
                      className="modal-select"
                      style={{ width: "auto", flexShrink: 0, padding: "10px 8px", fontWeight: "700" }}
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+61">🇦🇺 +61</option>
                      <option value="+65">🇸🇬 +65</option>
                    </select>
                    <input
                      type="tel"
                      required
                      placeholder="9876512345"
                      maxLength={10}
                      value={newGuestForm.phone}
                      onChange={(e) => setNewGuestForm({ ...newGuestForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                      className="modal-input"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Email Address</label>
                  <input type="email" placeholder="vikram@mail.com" value={newGuestForm.email} onChange={(e) => setNewGuestForm({ ...newGuestForm, email: e.target.value })} className="modal-input" />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Booked Room</label>
                  <input type="text" required placeholder="e.g. Room 101" value={newGuestForm.roomBooked} onChange={(e) => setNewGuestForm({ ...newGuestForm, roomBooked: e.target.value })} className="modal-input" />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Category Tier</label>
                  <select value={newGuestForm.tier} onChange={(e) => setNewGuestForm({ ...newGuestForm, tier: e.target.value })} className="modal-select">
                    <option value="Daily Guest">Daily Guest</option>
                    <option value="Silver">Silver Member</option>
                    <option value="Gold">Gold Member</option>
                    <option value="Platinum">Platinum VIP</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Total Bill (₹)</label>
                  <input type="number" required placeholder="2500" value={newGuestForm.totalBill} onChange={(e) => setNewGuestForm({ ...newGuestForm, totalBill: e.target.value })} className="modal-input" />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Payment Status</label>
                  <select value={newGuestForm.paymentStatus} onChange={(e) => setNewGuestForm({ ...newGuestForm, paymentStatus: e.target.value })} className="modal-select">
                    <option value="Paid">✓ Paid</option>
                    <option value="Unpaid">✖ Unpaid</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Guests Count</label>
                  <input type="number" value={newGuestForm.guestsCount} onChange={(e) => setNewGuestForm({ ...newGuestForm, guestsCount: e.target.value })} className="modal-input" />
                </div>
              </div>

              <div style={{ paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setIsAddGuestModalOpen(false)} className="modal-select" style={{ width: "auto", padding: "10px 20px" }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 22px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#ffffff", fontSize: "13.5px", fontWeight: "700", cursor: "pointer" }}>Save Guest</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER DETAILS & BILLING MODAL (WITH EDIT & PRINT CAPABILITIES) */}
      {selectedCustomerDetails && (
        <div className="modal-backdrop" onClick={() => setSelectedCustomerDetails(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "20px" }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "620px", width: "100%", maxHeight: "90vh", overflowY: "auto", borderRadius: "20px", background: isDark ? "#0f172a" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)", border: isDark ? "1px solid #334155" : "1px solid #e2e8f0" }}>
            
            {/* MODAL HEADER */}
            <div style={{ padding: "18px 24px", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between", borderTopLeftRadius: "19px", borderTopRightRadius: "19px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                <img src={selectedCustomerDetails.image} alt="" style={{ width: "45px", height: "45px", borderRadius: "12px", objectFit: "cover", flexShrink: 0 }} />
                <div style={{ minWidth: 0, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3 style={{ margin: 0, fontSize: "16.5px", fontWeight: "700", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                      {selectedCustomerDetails.name}
                    </h3>
                    {isEditingCustomer && (
                      <span style={{ fontSize: "10.5px", padding: "2px 8px", borderRadius: "999px", background: "rgba(99, 102, 241, 0.25)", color: "#a5b4fc", border: "1px solid rgba(99, 102, 241, 0.4)", fontWeight: "700" }}>
                        EDIT MODE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "12px", color: "#94a3b8", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                    {selectedCustomerDetails.phone} • {selectedCustomerDetails.email}
                  </div>
                </div>
              </div>
            </div>

            {/* MODAL BODY */}
            <div style={{ padding: "22px 24px" }}>
              {isEditingCustomer ? (
                /* EDIT FORM */
                <form onSubmit={handleSaveCustomerEdit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px", color: isDark ? "#cbd5e1" : "#475569" }}>Guest Name *</label>
                      <input
                        type="text"
                        required
                        value={editCustomerForm.name}
                        onChange={(e) => setEditCustomerForm({ ...editCustomerForm, name: e.target.value })}
                        className="modal-input"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1", background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px", color: isDark ? "#cbd5e1" : "#475569" }}>Gender</label>
                      <select
                        value={editCustomerForm.gender}
                        onChange={(e) => setEditCustomerForm({ ...editCustomerForm, gender: e.target.value })}
                        className="modal-select"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1", background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px", color: isDark ? "#cbd5e1" : "#475569" }}>Phone Number</label>
                      <input
                        type="text"
                        value={editCustomerForm.phone}
                        onChange={(e) => setEditCustomerForm({ ...editCustomerForm, phone: e.target.value })}
                        className="modal-input"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1", background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px", color: isDark ? "#cbd5e1" : "#475569" }}>Email Address</label>
                      <input
                        type="email"
                        value={editCustomerForm.email}
                        onChange={(e) => setEditCustomerForm({ ...editCustomerForm, email: e.target.value })}
                        className="modal-input"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1", background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px", color: isDark ? "#cbd5e1" : "#475569" }}>Booked Room</label>
                      <input
                        type="text"
                        required
                        value={editCustomerForm.roomBooked}
                        onChange={(e) => setEditCustomerForm({ ...editCustomerForm, roomBooked: e.target.value })}
                        className="modal-input"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1", background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px", color: isDark ? "#cbd5e1" : "#475569" }}>Loyalty Category Tier</label>
                      <select
                        value={editCustomerForm.tier}
                        onChange={(e) => setEditCustomerForm({ ...editCustomerForm, tier: e.target.value })}
                        className="modal-select"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1", background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}
                      >
                        <option value="Daily Guest">Daily Guest</option>
                        <option value="Silver">Silver Member</option>
                        <option value="Gold">Gold Member</option>
                        <option value="Platinum">Platinum VIP</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px", color: isDark ? "#cbd5e1" : "#475569" }}>Check-In Date</label>
                      <input
                        type="text"
                        placeholder="e.g. 17 Aug 2026"
                        value={editCustomerForm.checkIn}
                        onChange={(e) => setEditCustomerForm({ ...editCustomerForm, checkIn: e.target.value })}
                        className="modal-input"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1", background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px", color: isDark ? "#cbd5e1" : "#475569" }}>Check-Out Date</label>
                      <input
                        type="text"
                        placeholder="e.g. 19 Aug 2026"
                        value={editCustomerForm.checkOut}
                        onChange={(e) => setEditCustomerForm({ ...editCustomerForm, checkOut: e.target.value })}
                        className="modal-input"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1", background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px", color: isDark ? "#cbd5e1" : "#475569" }}>Stay Duration (Nights)</label>
                      <input
                        type="number"
                        min="1"
                        value={editCustomerForm.stayDays}
                        onChange={(e) => setEditCustomerForm({ ...editCustomerForm, stayDays: Number(e.target.value) || 1 })}
                        className="modal-input"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1", background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px", color: isDark ? "#cbd5e1" : "#475569" }}>Guests Count</label>
                      <input
                        type="number"
                        min="1"
                        value={editCustomerForm.guestsCount}
                        onChange={(e) => setEditCustomerForm({ ...editCustomerForm, guestsCount: Number(e.target.value) || 1 })}
                        className="modal-input"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1", background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px", color: isDark ? "#cbd5e1" : "#475569" }}>Total Bill (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={editCustomerForm.totalBill}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setEditCustomerForm({
                            ...editCustomerForm,
                            totalBill: val,
                            paidAmount: editCustomerForm.paymentStatus === "Paid" ? val : editCustomerForm.paidAmount,
                          });
                        }}
                        className="modal-input"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1", background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px", color: isDark ? "#cbd5e1" : "#475569" }}>Paid Amount (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={editCustomerForm.paidAmount}
                        onChange={(e) => setEditCustomerForm({ ...editCustomerForm, paidAmount: Number(e.target.value) || 0 })}
                        className="modal-input"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1", background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px", color: isDark ? "#cbd5e1" : "#475569" }}>Payment Status</label>
                      <select
                        value={editCustomerForm.paymentStatus}
                        onChange={(e) => {
                          const stat = e.target.value;
                          setEditCustomerForm({
                            ...editCustomerForm,
                            paymentStatus: stat,
                            paidAmount: stat === "Paid" ? editCustomerForm.totalBill : (stat === "Unpaid" ? 0 : editCustomerForm.paidAmount),
                          });
                        }}
                        className="modal-select"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1", background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}
                      >
                        <option value="Paid">✓ Paid</option>
                        <option value="Partial">⚡ Partial</option>
                        <option value="Unpaid">✖ Unpaid</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px", color: isDark ? "#cbd5e1" : "#475569" }}>Current Stay Status</label>
                    <select
                      value={editCustomerForm.status}
                      onChange={(e) => setEditCustomerForm({ ...editCustomerForm, status: e.target.value })}
                      className="modal-select"
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1", background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}
                    >
                      <option value="Active">Pending Check-In (Active)</option>
                      <option value="Checked In">✓ Checked In (In-House Guest)</option>
                      <option value="Checked Out">Completed (Checked Out)</option>
                    </select>
                  </div>

                  <div style={{ paddingTop: "14px", borderTop: isDark ? "1px solid #334155" : "1px solid #e2e8f0", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => setIsEditingCustomer(false)}
                      className="modal-select"
                      style={{ width: "auto", padding: "10px 18px", borderRadius: "8px", background: isDark ? "#1e293b" : "#f1f5f9", color: isDark ? "#cbd5e1" : "#475569", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1", fontWeight: "600", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingEdit}
                      style={{
                        padding: "10px 22px",
                        borderRadius: "8px",
                        border: "none",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "#ffffff",
                        fontSize: "13.5px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <FaSave /> {isSavingEdit ? "Saving Changes..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              ) : (
                /* VIEW DETAILS */
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="modal-info-block" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: isDark ? "#1e293b" : "#f8fafc", padding: "12px 16px", borderRadius: "12px", border: isDark ? "1px solid #334155" : "1px solid #e2e8f0" }}>
                    <div>
                      <span style={{ fontSize: "12px", opacity: 0.7 }}>Gender:</span>
                      <div style={{ marginTop: "4px" }}>{renderGenderBadge(selectedCustomerDetails.gender)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "12px", opacity: 0.7 }}>Loyalty Tier:</span>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "#6366f1", marginTop: "2px" }}>{selectedCustomerDetails.tierIcon || "👤"} {selectedCustomerDetails.tier}</div>
                    </div>
                  </div>

                  <div className="modal-info-block" style={{ display: "flex", flexDirection: "column", gap: "9px", background: isDark ? "#1e293b" : "#f8fafc", padding: "16px", borderRadius: "12px", border: isDark ? "1px solid #334155" : "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ opacity: 0.7 }}>Booking ID:</span>
                      <strong>{selectedCustomerDetails.id}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ opacity: 0.7 }}>Invoice Number:</span>
                      <strong style={{ color: "#667eea" }}>{selectedCustomerDetails.invoiceId || `INV-2026-${selectedCustomerDetails.id}`}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ opacity: 0.7 }}>Branch:</span>
                      <strong>{selectedCustomerDetails.orgName || "Default Branch"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ opacity: 0.7 }}>Booked Room:</span>
                      <strong style={{ color: "#667eea" }}>{getFloorAndRoomDisplay(selectedCustomerDetails.roomBooked)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ opacity: 0.7 }}>Guests Count:</span>
                      <strong>{selectedCustomerDetails.guestsCount || 1} Guest(s)</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ opacity: 0.7 }}>Check-In / Out:</span>
                      <strong>{selectedCustomerDetails.checkIn || "17 Aug 2026"} → {selectedCustomerDetails.checkOut || "19 Aug 2026"} ({selectedCustomerDetails.stayDays || 2} Nights)</strong>
                    </div>
                    
                    <hr style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0", margin: "6px 0" }} />
                    
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px" }}>
                      <span style={{ opacity: 0.7 }}>Total Bill:</span>
                      <strong style={{ color: "#10b981", fontSize: "15px" }}>₹{(Number(selectedCustomerDetails.totalBill) || 2500).toLocaleString("en-IN")}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ opacity: 0.7 }}>Paid Amount:</span>
                      <strong style={{ color: "#3b82f6" }}>₹{(Number(selectedCustomerDetails.paidAmount) || (selectedCustomerDetails.paymentStatus === "Paid" ? Number(selectedCustomerDetails.totalBill) : 0)).toLocaleString("en-IN")}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ opacity: 0.7 }}>Pending Amount:</span>
                      <strong style={{ color: Math.max(0, (Number(selectedCustomerDetails.totalBill) || 2500) - (Number(selectedCustomerDetails.paidAmount) || (selectedCustomerDetails.paymentStatus === "Paid" ? Number(selectedCustomerDetails.totalBill) : 0))) > 0 ? "#ef4444" : "#10b981" }}>
                        ₹{Math.max(0, (Number(selectedCustomerDetails.totalBill) || 2500) - (Number(selectedCustomerDetails.paidAmount) || (selectedCustomerDetails.paymentStatus === "Paid" ? Number(selectedCustomerDetails.totalBill) : 0))).toLocaleString("en-IN")}
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ opacity: 0.7 }}>Payment Status:</span>
                      <strong style={{ color: selectedCustomerDetails.paymentStatus === "Paid" ? "#10b981" : selectedCustomerDetails.paymentStatus === "Partial" ? "#f59e0b" : "#dc2626" }}>
                        {selectedCustomerDetails.paymentStatus}
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", alignItems: "center" }}>
                      <span style={{ opacity: 0.7 }}>Stay Status:</span>
                      <span style={{ padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: "700", background: selectedCustomerDetails.status === "Checked In" ? "#dcfce7" : selectedCustomerDetails.status === "Checked Out" ? "#e5e7eb" : "#fef3c7", color: selectedCustomerDetails.status === "Checked In" ? "#15803d" : selectedCustomerDetails.status === "Checked Out" ? "#374151" : "#b45309" }}>
                        {selectedCustomerDetails.status === "Active" ? "Pending Check-In" : selectedCustomerDetails.status}
                      </span>
                    </div>
                  </div>

                  {/* BOTTOM ACTIONS */}
                  <div style={{ paddingTop: "14px", borderTop: isDark ? "1px solid #334155" : "1px solid #e2e8f0", display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {selectedCustomerDetails.paymentStatus !== "Paid" && (
                      <button
                        type="button"
                        onClick={() => {
                          handleMarkPayment(selectedCustomerDetails.id, "Paid");
                          setSelectedCustomerDetails({ ...selectedCustomerDetails, paymentStatus: "Paid", paidAmount: Number(selectedCustomerDetails.totalBill) || 2500 });
                        }}
                        style={{ flex: 1, minWidth: "130px", padding: "10px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#ffffff", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      >
                        ✓ Collect Payment
                      </button>
                    )}

                    {selectedCustomerDetails.status !== "Checked Out" && (
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedCustomerDetails.status === "Checked In") {
                            handleCheckOut(selectedCustomerDetails);
                            if (selectedCustomerDetails.paymentStatus === "Paid") {
                              setSelectedCustomerDetails({ ...selectedCustomerDetails, status: "Checked Out" });
                            }
                          } else {
                            handleCheckIn(selectedCustomerDetails.id);
                            setSelectedCustomerDetails({ ...selectedCustomerDetails, status: "Checked In" });
                          }
                        }}
                        style={{ flex: 1, minWidth: "120px", padding: "10px", borderRadius: "10px", border: "none", background: selectedCustomerDetails.status === "Checked In" ? "#fee2e2" : "#dcfce7", color: selectedCustomerDetails.status === "Checked In" ? "#b91c1c" : "#15803d", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
                      >
                        {selectedCustomerDetails.status === "Checked In" ? "✖ Check Out" : "✓ Check In"}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsEditingCustomer(true)}
                      style={{ padding: "10px 16px", borderRadius: "10px", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1", background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <FaEdit /> Edit
                    </button>

                    <button
                      type="button"
                      onClick={handlePrintReceipt}
                      style={{ padding: "10px 16px", borderRadius: "10px", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1", background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <FaPrint /> Print Receipt
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedCustomerDetails(null)}
                      className="modal-select"
                      style={{ width: "auto", flex: "0 0 auto", padding: "10px 18px", borderRadius: "10px", background: isDark ? "#334155" : "#f1f5f9", color: isDark ? "#ffffff" : "#0f172a", border: "none", fontWeight: "600", cursor: "pointer" }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE INVOICE STYLESHEET AND A4 PRINT LAYOUT */}
      <style>{`
        #customer-printable-invoice {
          display: none;
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
          #customer-printable-invoice,
          #customer-printable-invoice * {
            visibility: visible !important;
          }
          #customer-printable-invoice {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            z-index: 999999 !important;
          }
          .modal-backdrop, .sidebar, .header, header, nav, .row-actions-container {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
        }
      `}</style>

      {/* DEDICATED PRINTABLE A4 INVOICE / RECEIPT */}
      <div id="customer-printable-invoice">
        {selectedCustomerDetails && (
          <div style={{ width: "100%", maxWidth: "800px", margin: "0 auto", padding: "32px", background: "#ffffff", color: "#0f172a", fontFamily: "'Inter', -apple-system, sans-serif", boxSizing: "border-box" }}>
            
            {/* INVOICE TOP HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #e2e8f0", paddingBottom: "20px", marginBottom: "24px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#4f46e5", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                    <FaHotel />
                  </div>
                  <div>
                    <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.5px" }}>
                      {selectedCustomerDetails.orgName || "Grand Horizon Hotel & Resort"}
                    </h1>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Hospitality & Luxury Suites • Guest Receipt & Tax Invoice</span>
                  </div>
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "8px", lineHeight: "1.4" }}>
                  Branch ID: <strong>{selectedCustomerDetails.orgId || "HQ01"}</strong> • GSTIN / Tax ID: <strong>08AAACH7894M1Z5</strong><br />
                  Support: +91 98765 43210 • Email: reservations@hotel.com
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ display: "inline-block", background: "#f1f5f9", padding: "6px 14px", borderRadius: "8px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "10.5px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>INVOICE NUMBER</span>
                  <div style={{ fontSize: "16px", fontWeight: "800", color: "#4f46e5" }}>
                    {selectedCustomerDetails.invoiceId || `INV-2026-${selectedCustomerDetails.id}`}
                  </div>
                </div>
                <div style={{ fontSize: "11.5px", color: "#475569" }}>
                  <strong>Issue Date:</strong> {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </div>
                <div style={{ fontSize: "11.5px", color: "#475569" }}>
                  <strong>Booking Reference:</strong> {selectedCustomerDetails.id}
                </div>
              </div>
            </div>

            {/* GUEST & STAY DETAILS DUAL CARDS */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", background: "#f8fafc", padding: "18px 20px", borderRadius: "12px", marginBottom: "24px", border: "1px solid #e2e8f0" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>BILLED TO (GUEST)</div>
                <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>{selectedCustomerDetails.name}</div>
                <div style={{ fontSize: "12px", color: "#475569", marginTop: "2px" }}><strong>Phone:</strong> {selectedCustomerDetails.phone}</div>
                <div style={{ fontSize: "12px", color: "#475569" }}><strong>Email:</strong> {selectedCustomerDetails.email}</div>
                <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "4px" }}>
                  <strong>Gender:</strong> {selectedCustomerDetails.gender || "Male"} • <strong>Loyalty Tier:</strong> {selectedCustomerDetails.tier || "Daily Guest"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>RESERVATION DETAILS</div>
                <div style={{ fontSize: "14.5px", fontWeight: "800", color: "#0f172a" }}>{getFloorAndRoomDisplay(selectedCustomerDetails.roomBooked)}</div>
                <div style={{ fontSize: "12px", color: "#475569", marginTop: "2px" }}>
                  <strong>Check-In:</strong> {selectedCustomerDetails.checkIn || "17 Aug 2026"}
                </div>
                <div style={{ fontSize: "12px", color: "#475569" }}>
                  <strong>Check-Out:</strong> {selectedCustomerDetails.checkOut || "19 Aug 2026"}
                </div>
                <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "4px" }}>
                  <strong>Stay Duration:</strong> {selectedCustomerDetails.stayDays || 2} Night(s) • <strong>Occupants:</strong> {selectedCustomerDetails.guestsCount || 1} Guest(s)
                </div>
              </div>
            </div>

            {/* ITEMIZED BILL TABLE */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px" }}>
              <thead>
                <tr style={{ background: "#f1f5f9", borderBottom: "2px solid #cbd5e1" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#334155" }}>#</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#334155" }}>Description</th>
                  <th style={{ padding: "10px 14px", textAlign: "center", fontSize: "12px", fontWeight: "700", color: "#334155" }}>Nights / Qty</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontSize: "12px", fontWeight: "700", color: "#334155" }}>Rate (₹)</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontSize: "12px", fontWeight: "700", color: "#334155" }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "12px 14px", fontSize: "13px", color: "#64748b" }}>1</td>
                  <td style={{ padding: "12px 14px", fontSize: "13.5px", fontWeight: "600", color: "#0f172a" }}>
                    Room Accommodation Tariff<br />
                    <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "normal" }}>{selectedCustomerDetails.roomBooked} — Standard Amenities, High-speed Wi-Fi, Daily Housekeeping</span>
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "center", fontSize: "13px", color: "#334155" }}>{selectedCustomerDetails.stayDays || 2}</td>
                  <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "13px", color: "#334155" }}>
                    ₹{Math.round((Number(selectedCustomerDetails.totalBill) || 2500) / (Number(selectedCustomerDetails.stayDays) || 2)).toLocaleString("en-IN")}
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "13.5px", fontWeight: "700", color: "#0f172a" }}>
                    ₹{(Number(selectedCustomerDetails.totalBill) || 2500).toLocaleString("en-IN")}
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "12px 14px", fontSize: "13px", color: "#64748b" }}>2</td>
                  <td style={{ padding: "12px 14px", fontSize: "13.5px", fontWeight: "600", color: "#0f172a" }}>
                    GST & Service Taxes (CGST 6% + SGST 6%)<br />
                    <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "normal" }}>Included in room tariff</span>
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "center", fontSize: "13px", color: "#334155" }}>-</td>
                  <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "13px", color: "#334155" }}>Included</td>
                  <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "13.5px", fontWeight: "700", color: "#0f172a" }}>₹0</td>
                </tr>
              </tbody>
            </table>

            {/* BILL SUMMARY & STAMP */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px", alignItems: "flex-start", marginBottom: "28px" }}>
              <div>
                <div style={{
                  display: "inline-block",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: selectedCustomerDetails.paymentStatus === "Paid" ? "2px solid #16a34a" : "2px solid #dc2626",
                  background: selectedCustomerDetails.paymentStatus === "Paid" ? "#f0fdf4" : "#fef2f2",
                  color: selectedCustomerDetails.paymentStatus === "Paid" ? "#15803d" : "#b91c1c",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "14.5px", fontWeight: "900", letterSpacing: "0.5px" }}>
                    {selectedCustomerDetails.paymentStatus === "Paid" ? "✓ PAYMENT RECEIVED - FULLY PAID" : "✖ PAYMENT OUTSTANDING - PENDING"}
                  </div>
                  <div style={{ fontSize: "11.5px", marginTop: "2px", color: selectedCustomerDetails.paymentStatus === "Paid" ? "#166534" : "#991b1b" }}>
                    {selectedCustomerDetails.paymentStatus === "Paid" ? "Thank you! Your payment has been received in full." : "Please settle remaining payment before or at check-out."}
                  </div>
                </div>

                <div style={{ marginTop: "14px", fontSize: "11.5px", color: "#64748b", lineHeight: "1.5" }}>
                  <strong>Payment Mode:</strong> Cash / UPI / Card Settlement • <strong>Status:</strong> {selectedCustomerDetails.status || "Active Stay"}<br />
                  <strong>Source:</strong> {selectedCustomerDetails.source || "Hotel Front Desk"}
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "16px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569", marginBottom: "8px" }}>
                  <span>Subtotal:</span>
                  <span>₹{(Number(selectedCustomerDetails.totalBill) || 2500).toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569", marginBottom: "8px" }}>
                  <span>Taxes & Service Fees:</span>
                  <span>₹0 (Included)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15.5px", fontWeight: "800", color: "#0f172a", borderTop: "2px solid #cbd5e1", paddingTop: "8px", marginBottom: "8px" }}>
                  <span>Grand Total:</span>
                  <span>₹{(Number(selectedCustomerDetails.totalBill) || 2500).toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", fontWeight: "700", color: "#16a34a", marginBottom: "6px" }}>
                  <span>Amount Paid:</span>
                  <span>₹{(Number(selectedCustomerDetails.paidAmount) || (selectedCustomerDetails.paymentStatus === "Paid" ? Number(selectedCustomerDetails.totalBill) : 0)).toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "800", color: Math.max(0, (Number(selectedCustomerDetails.totalBill) || 2500) - (Number(selectedCustomerDetails.paidAmount) || (selectedCustomerDetails.paymentStatus === "Paid" ? Number(selectedCustomerDetails.totalBill) : 0))) > 0 ? "#dc2626" : "#475569", borderTop: "1px dashed #cbd5e1", paddingTop: "6px" }}>
                  <span>Balance Due:</span>
                  <span>₹{Math.max(0, (Number(selectedCustomerDetails.totalBill) || 2500) - (Number(selectedCustomerDetails.paidAmount) || (selectedCustomerDetails.paymentStatus === "Paid" ? Number(selectedCustomerDetails.totalBill) : 0))).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* TERMS & SIGNATURE */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid #e2e8f0", paddingTop: "20px", marginTop: "20px" }}>
              <div style={{ fontSize: "11px", color: "#64748b", maxWidth: "420px", lineHeight: "1.4" }}>
                <strong>Guest Notice & Hotel Policies:</strong><br />
                • Standard check-out time is 11:00 AM. Late check-out is subject to room availability.<br />
                • Room keys must be returned at reception upon checkout.<br />
                • This is a computer-generated receipt and requires no physical seal.
              </div>
              <div style={{ textAlign: "center", minWidth: "160px" }}>
                <div style={{ borderBottom: "1px solid #94a3b8", width: "160px", height: "40px", marginBottom: "6px" }}></div>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase" }}>Authorized Signatory</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FILTER DRAWER */}
      {isFilterDrawerOpen && (
        <div className="modal-backdrop" onClick={() => setIsFilterDrawerOpen(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: isDark ? "rgba(15, 23, 42, 0.75)" : "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "flex-end", zIndex: 1100 }}>
          <div className="cust-drawer-content" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "380px", height: "100vh", background: isDark ? "#0f172a" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a", borderLeft: isDark ? "1px solid #334155" : "none", boxShadow: "-10px 0 30px rgba(0, 0, 0, 0.3)", display: "flex", flexDirection: "column", padding: "24px", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: isDark ? "#ffffff" : "#0f172a" }}>Filters & Sorting</h3>
              <button type="button" onClick={() => setIsFilterDrawerOpen(false)} style={{ border: "none", background: isDark ? "rgba(255, 255, 255, 0.1)" : "#f1f5f9", color: isDark ? "#94a3b8" : "#64748b", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer" }}><FaTimes /></button>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px", color: isDark ? "#cbd5e1" : "#475569" }}>Filter by Category Tier</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="modal-select" style={{ color: isDark ? "#ffffff" : "#0f172a", background: isDark ? "#1e293b" : "#ffffff", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1" }}>
                <option value="All" style={{ background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}>All Categories ({allCount})</option>
                <option value="Daily Guest" style={{ background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}>Daily Guests ({dailyCount})</option>
                <option value="Platinum" style={{ background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}>Platinum VIP ({platinumCount})</option>
                <option value="Gold" style={{ background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}>Gold Members ({goldCount})</option>
                <option value="Silver" style={{ background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}>Silver Members ({silverCount})</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px", color: isDark ? "#cbd5e1" : "#475569" }}>Filter by Gender</label>
              <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)} className="modal-select" style={{ color: isDark ? "#ffffff" : "#0f172a", background: isDark ? "#1e293b" : "#ffffff", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1" }}>
                <option value="all" style={{ background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}>👥 All Genders</option>
                <option value="Male" style={{ background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}>👨 Male Guests</option>
                <option value="Female" style={{ background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}>👩 Female Guests</option>
                <option value="Other" style={{ background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}>👤 Other</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px", color: isDark ? "#cbd5e1" : "#475569" }}>Filter by Payment Status</label>
              <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="modal-select" style={{ color: isDark ? "#ffffff" : "#0f172a", background: isDark ? "#1e293b" : "#ffffff", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1" }}>
                <option value="all" style={{ background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}>All Payment Statuses</option>
                <option value="paid" style={{ background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}>✓ Paid Only</option>
                <option value="unpaid" style={{ background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}>✖ Unpaid Only</option>
              </select>
            </div>

            <div style={{ marginTop: "auto", display: "flex", gap: "10px" }}>
              <button type="button" onClick={resetAllFilters} className="modal-select" style={{ flex: 1, color: isDark ? "#ffffff" : "#0f172a", background: isDark ? "#1e293b" : "#ffffff", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1" }}>Reset Filters</button>
              <button type="button" onClick={() => setIsFilterDrawerOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#ffffff", fontWeight: "700", cursor: "pointer" }}>Apply Filters</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW ID DOCUMENT MODAL */}
      {selectedDocCustomer && (
        <div className="modal-backdrop" onClick={() => setSelectedDocCustomer(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "20px" }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>Identity Document View</h3>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>{selectedDocCustomer.name} ({selectedDocCustomer.gender || "Male"})</span>
              </div>
              <button type="button" onClick={() => setSelectedDocCustomer(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#cbd5e1", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer" }}><FaTimes /></button>
            </div>

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {selectedDocCustomer.document ? (
                <div className="modal-info-block" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <FaFileAlt style={{ color: "#6366f1", fontSize: "24px" }} />
                    <div>
                      <strong style={{ fontSize: "14px", display: "block" }}>{selectedDocCustomer.document.name}</strong>
                      <span style={{ fontSize: "11.5px", opacity: 0.7 }}>Uploaded on {selectedDocCustomer.document.uploadedAt}</span>
                    </div>
                  </div>
                  {selectedDocCustomer.document.url && (
                    <img src={selectedDocCustomer.document.url} alt="ID Document" style={{ width: "100%", maxHeight: "250px", borderRadius: "10px", objectFit: "contain", border: "1px solid rgba(255,255,255,0.1)" }} />
                  )}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#64748b" }}>No ID Document uploaded for this guest yet.</div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setSelectedDocCustomer(null)} className="modal-select" style={{ width: "auto", padding: "10px 20px" }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}