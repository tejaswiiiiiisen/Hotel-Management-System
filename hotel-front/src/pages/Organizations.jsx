import { showSuccess, showError, showWarning, showInfo } from "../utils/toast.js";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import RowActions from "../components/RowActions.jsx";
import { setCurrentOrg, getAuthHeaders } from "../auth.js";
import { 
  FaBuilding, 
  FaUpload, 
  FaTimes, 
  FaThLarge, 
  FaList, 
  FaMapMarkerAlt, 
  FaCalendarAlt, 
  FaArrowRight, 
  FaEdit, 
  FaTrash, 
  FaSearch,
  FaSlidersH
} from "react-icons/fa";
import { FiExternalLink } from "react-icons/fi";
import "./Organizations.css";

const API_BASE = "/api/organizations";
const BACKUP_API_BASE = "http://localhost:4000/api/organizations";

function generateFrontendOrgId(orgName) {
  let prefix = "OG";
  if (orgName && typeof orgName === "string") {
    const clean = orgName.replace(/[^a-zA-Z]/g, "").toUpperCase();
    if (clean.length >= 2) {
      prefix = clean.substring(0, 2);
    } else if (clean.length === 1) {
      prefix = clean + "X";
    }
  }
  const nums = Math.floor(100 + Math.random() * 900);
  return `${prefix}${nums}`;
}


export default function Organizations() {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem("orgs_view_mode") || "grid";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem("orgs_view_mode", viewMode);
  }, [viewMode]);

  // DYNAMIC DARK / LIGHT MODE DETECTOR
  const [theme, setTheme] = useState(
    document.documentElement.getAttribute("data-theme") || "light"
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const currentTheme =
        document.documentElement.getAttribute("data-theme") || "light";
      setTheme(currentTheme);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  const isDark = theme === "dark";

  // Dynamic theme variables matching Queries.jsx & Screenshot 1
  const cardBg = isDark ? "#1e293b" : "#ffffff";
  const border = isDark ? "1px solid #334155" : "1px solid #e2e8f0";
  const textColor = isDark ? "#f8fafc" : "#0f172a";
  const subColor = isDark ? "#94a3b8" : "#64748b";
  const inputBg = isDark ? "#0f172a" : "#f8fafc";
  const inputBorder = isDark ? "1px solid #334155" : "1px solid #e2e8f0";

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilterDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dynamic Theme Colors for Modal
  const modalTheme = {
    overlayBg: isDark ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.4)",
    cardBg: isDark ? "#1a1f37" : "#ffffff",
    cardBorder: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #e2e8f0",
    cardShadow: isDark ? "0 20px 40px rgba(0,0,0,0.6)" : "0 20px 40px rgba(0,0,0,0.12)",
    titleColor: isDark ? "#ffffff" : "#1a202c",
    closeBtnColor: isDark ? "#a0aec0" : "#718096",
    labelColor: isDark ? "#cbd5e0" : "#4a5568",
    subLabelColor: isDark ? "#a0aec0" : "#718096",
    inputBg: isDark ? "#0d1127" : "#f8fafc",
    inputBorder: isDark ? "1px solid #2d3748" : "1px solid #cbd5e0",
    inputColor: isDark ? "#ffffff" : "#1a202c",
    orgIdBg: isDark ? "#090d1f" : "rgba(128, 90, 213, 0.08)",
    orgIdBorder: isDark ? "1px solid #4a5568" : "1px solid rgba(128, 90, 213, 0.3)",
    orgIdColor: isDark ? "#b794f4" : "#6b46c1",
    cancelBorder: isDark ? "1px solid #4a5568" : "1px solid #cbd5e0",
    cancelColor: isDark ? "#cbd5e0" : "#4a5568",
    logoBoxBg: isDark ? "rgba(128, 90, 213, 0.15)" : "rgba(128, 90, 213, 0.08)",
    logoBoxBorder: isDark ? "1px dashed #805ad5" : "1px dashed #805ad5",
    logoBoxColor: isDark ? "#b794f4" : "#6b46c1",
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [formOrgId, setFormOrgId] = useState("");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState("Active");
  const [formBranch, setFormBranch] = useState("");
  const [formPlace, setFormPlace] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formState, setFormState] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formLogoFile, setFormLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [saving, setSaving] = useState(false);

  const [backendStats, setBackendStats] = useState(null);

  // Fetch Organizations & Stats from MySQL Database
  const fetchOrganizations = async () => {
    setLoading(true);
    setError("");
    try {
      let res = await fetch(API_BASE, { headers: getAuthHeaders() });
      if (!res.ok) {
        res = await fetch(BACKUP_API_BASE, { headers: getAuthHeaders() });
      }
      const data = await res.json();
      if (data && data.success && Array.isArray(data.organizations)) {
        const withBranchLogos = await Promise.all(data.organizations.map(async (org) => {
          if (org.logoUrl || !org.orgId) return org;
          try {
            const logoResponse = await fetch(`http://localhost:4000/api/site-settings?orgId=${encodeURIComponent(org.orgId)}`, {
              headers: getAuthHeaders(),
            });
            const logoData = await logoResponse.json();
            return { ...org, logoUrl: logoData.logo || "" };
          } catch { return org; }
        }));
        setOrgs(withBranchLogos);
        if (data.stats) {
          setBackendStats(data.stats);
        }
      } else {
        throw new Error(data?.message || "Invalid DB response");
      }
    } catch (err) {
      console.error("Failed to connect to MySQL backend:", err);
      // Fallback local display if server unreachable
      setOrgs([
        { id: 1, orgId: "AJ01", logo: "🏨", name: "Ajmer Branch", description: "Ajmer prime location hotel branch", status: "Active", created: "6/01/2026" },
        { id: 2, orgId: "JP01", logo: "🏰", name: "Jaipur Branch", description: "Jaipur pink city heritage branch", status: "Active", created: "6/05/2026" },
        { id: 3, orgId: "MA330", logo: "🍵", name: "Matcha Tea", description: "Premium hospitality & cafe franchise", status: "Active", created: "6/28/2026" },
        { id: 4, orgId: "CH560", logo: "👕", name: "Cheery Clothing", description: "Boutique hotel apparel & merchandise", status: "Active", created: "6/10/2026" },
        { id: 5, orgId: "AS435", logo: "🌟", name: "Ashirwad", description: "Luxury resort & suites", status: "Active", created: "7/01/2026" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Enter an organization -> open its dashboard in that context.
  function openOrg(org) {
    if (typeof org === "object" && org !== null) {
      setCurrentOrg(org.name || org.orgName, org.orgId || org.org_id);
    } else if (typeof org === "string") {
      const found = orgs.find((item) => item.name === org || item.orgId === org);
      if (found) {
        setCurrentOrg(found.name, found.orgId || found.org_id);
      } else {
        setCurrentOrg(org);
      }
    } else {
      setCurrentOrg("Matcha Tea");
    }
    window.dispatchEvent(new Event("storage"));
    navigate("/dashboard");
  }

  // Open Modal for Create
  function handleOpenCreate() {
    setEditingOrg(null);
    setFormName("");
    setFormOrgId(generateFrontendOrgId(""));
    setFormDescription("");
    setFormStatus("Active");
    setFormBranch("");
    setFormPlace("");
    setFormCity("");
    setFormState("");
    setFormAddress("");
    setFormLogoFile(null);
    setLogoPreview("");
    setIsModalOpen(true);
  }

  // Open Modal for Edit
  function handleOpenEdit(org) {
    setEditingOrg(org);
    setFormOrgId(org.orgId || generateFrontendOrgId(org.name));
    setFormName(org.name || "");
    setFormDescription(org.description === "-" ? "" : org.description || "");
    setFormStatus(org.status || "Active");
    setFormBranch(org.branch || "");
    setFormPlace(org.place || "");
    setFormCity(org.city || "");
    setFormState(org.state || "");
    setFormAddress(org.address || "");
    setFormLogoFile(null);
    setLogoPreview(org.logoUrl || "");
    setIsModalOpen(true);
  }

  // Handle Logo Image Selection
  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      setFormLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  }

  // Submit Create or Edit Form via Multer / FormData API
  async function handleSubmitOrg(e) {
    e.preventDefault();
    if (!formName.trim()) {
      showWarning("Organization name is required.");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("orgId", formOrgId);
      formData.append("name", formName.trim());
      formData.append("description", formDescription.trim());
      formData.append("status", formStatus);
      formData.append("branch", formBranch);
      formData.append("place", formPlace);
      formData.append("city", formCity);
      formData.append("state", formState);
      formData.append("address", formAddress);
      if (formLogoFile) {
        formData.append("logo", formLogoFile);
      }

      const url = editingOrg ? `${API_BASE}/${editingOrg.id}` : API_BASE;
      const method = editingOrg ? "PUT" : "POST";

      const authHeaders = { ...getAuthHeaders() };
      delete authHeaders["Content-Type"];

      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsModalOpen(false);
        fetchOrganizations();
      } else {
        showError(data.message || "Failed to save organization.");
      }
    } catch (err) {
      console.error("Save Organization error:", err);
      showError("Server error while saving organization.");
    } finally {
      setSaving(false);
    }
  }

  // Delete Organization
  async function removeOrg(id) {
    if (!window.confirm("Are you sure you want to delete this organization?")) return;
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrgs((prev) => prev.filter((o) => o.id !== id));
      } else {
        showError(data.message || "Failed to delete organization.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      showError("Error deleting organization.");
    }
  }

  const totalCount = backendStats ? backendStats.total : orgs.length;
  const activeCount = backendStats ? backendStats.active : orgs.filter((o) => o.status === "Active").length;
  const inactiveCount = backendStats ? backendStats.inactive : orgs.length - activeCount;

  const stats = [
    {
      title: "Total Organizations",
      count: totalCount,
      filterKey: "all",
      bg: "#f8fafc",
      border: "1px solid #e2e8f0",
      titleColor: "#475569",
      valueColor: "#0f172a",
      darkBg: "rgba(255, 255, 255, 0.05)",
      darkBorder: "1px solid rgba(255, 255, 255, 0.1)",
      darkTitleColor: "#cbd5e0",
      darkValueColor: "#ffffff"
    },
    {
      title: "Active Organizations",
      count: activeCount,
      filterKey: "Active",
      bg: "#f0fdf4",
      border: "1px solid #dcfce7",
      titleColor: "#15803d",
      valueColor: "#15803d",
      darkBg: "rgba(21, 128, 61, 0.15)",
      darkBorder: "1px solid rgba(34, 197, 94, 0.3)",
      darkTitleColor: "#4ade80",
      darkValueColor: "#4ade80"
    },
    {
      title: "Total Properties",
      count: activeCount,
      filterKey: "all",
      bg: "#eff6ff",
      border: "1px solid #dbeafe",
      titleColor: "#1d4ed8",
      valueColor: "#1d4ed8",
      darkBg: "rgba(29, 78, 216, 0.15)",
      darkBorder: "1px solid rgba(59, 130, 246, 0.3)",
      darkTitleColor: "#60a5fa",
      darkValueColor: "#60a5fa"
    },
    {
      title: "Inactive Organizations",
      count: inactiveCount,
      filterKey: "Inactive",
      bg: "#fef2f2",
      border: "1px solid #fecaca",
      titleColor: "#b91c1c",
      valueColor: "#b91c1c",
      darkBg: "rgba(185, 28, 28, 0.15)",
      darkBorder: "1px solid rgba(239, 68, 68, 0.3)",
      darkTitleColor: "#f87171",
      darkValueColor: "#f87171"
    },
  ];

  const displayOrgs = orgs.filter((o) => {
    if (selectedFilter === "Active" && (o.status || "").toLowerCase() !== "active") return false;
    if (selectedFilter === "Inactive" && (o.status || "").toLowerCase() === "active") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (o.name || "").toLowerCase().includes(q);
      const matchId = (o.orgId || "").toLowerCase().includes(q);
      const matchDesc = (o.description || "").toLowerCase().includes(q);
      const matchCity = (o.city || "").toLowerCase().includes(q);
      const matchBranch = (o.branch || "").toLowerCase().includes(q);
      const matchState = (o.state || "").toLowerCase().includes(q);
      return matchName || matchId || matchDesc || matchCity || matchBranch || matchState;
    }
    return true;
  });

  return (
    <>
      <PageHeader
        title="Organizations"
        subtitle="Manage all organizations in the system"
        action={
          <button className="btn-primary" onClick={handleOpenCreate}>
            + Create Organization
          </button>
        }
      />

      <section
        className="stats"
        style={{
          display: "flex",
          gap: "14px",
          overflowX: "auto",
          paddingBottom: "8px",
          marginBottom: "20px",
          scrollbarWidth: "thin",
        }}
      >
        {stats.map((s) => {
          const bg = isDark ? s.darkBg : s.bg;
          const border = isDark ? s.darkBorder : s.border;
          const titleColor = isDark ? s.darkTitleColor : s.titleColor;
          const valueColor = isDark ? s.darkValueColor : s.valueColor;

          return (
            <div
              className={`stat-card ${selectedFilter === s.filterKey ? "active" : ""}`}
              key={s.title}
              onClick={() => setSelectedFilter(s.filterKey)}
              title={`Click to filter ${s.title}`}
              style={{
                background: bg,
                border: border,
                borderRadius: "16px",
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                flex: "1 0 auto",
                minWidth: "max-content",
                cursor: "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                userSelect: "none"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: titleColor }}>
                  {s.title} :
                </span>
                <span style={{ fontSize: "20px", fontWeight: "800", color: valueColor, lineHeight: "1" }}>
                  {s.count}
                </span>
              </div>
              <FiExternalLink style={{ fontSize: "14px", color: titleColor, opacity: 0.7, flexShrink: 0, marginLeft: "4px" }} />
            </div>
          );
        })}
      </section>

      <section className="panel" style={{ padding: "24px" }}>
        <div style={{ marginBottom: "18px" }}>
          <h2 style={{ margin: "0 0 4px 0", fontSize: "1.25rem", fontWeight: "700", color: textColor }}>
            All Organizations & Hotel Branches
          </h2>
          <p style={{ margin: 0, fontSize: "0.875rem", color: subColor }}>
            Select any branch below to view its Rooms, Employees/Staff, Housekeeping & Operations.
          </p>
        </div>

        {/* Search & Filter Toolbar matching Screenshot 1 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          {/* Left: Pill Search Input */}
          <div style={{ position: "relative", width: "420px", maxWidth: "100%" }}>
            <FaSearch
              style={{
                position: "absolute",
                left: "18px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
                fontSize: "14px",
              }}
            />
            <input
              type="text"
              placeholder="Search organizations, city, branch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 20px 12px 46px",
                borderRadius: "99px",
                border: inputBorder,
                background: inputBg,
                color: textColor,
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: subColor,
                  cursor: "pointer",
                  fontSize: "14px",
                }}
                title="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* Right Controls: Filters Button + Grid/List View Toggle Icons */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {loading && <span style={{ fontSize: "13px", color: "#805ad5", fontWeight: "bold" }}>Loading...</span>}

            {/* Filters Button */}
            <div ref={filterRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setShowFilterDropdown((prev) => !prev)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: isDark ? "#0f172a" : "#f1f5f9",
                  border: "none",
                  color: textColor,
                  padding: "8px 16px",
                  borderRadius: "99px",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <FaSlidersH style={{ color: "#6366f1", fontSize: "14px" }} />
                <span>Filters</span>
                <span
                  style={{
                    fontSize: "11.5px",
                    fontWeight: "800",
                    background: "#6366f1",
                    color: "#ffffff",
                    padding: "2px 10px",
                    borderRadius: "99px",
                    textTransform: "capitalize",
                  }}
                >
                  {selectedFilter === "all" ? "All" : selectedFilter}
                </span>
              </button>

              {showFilterDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: "200px",
                    background: cardBg,
                    border: border,
                    borderRadius: "16px",
                    boxShadow: isDark
                      ? "0 10px 30px rgba(0,0,0,0.5)"
                      : "0 10px 25px rgba(0,0,0,0.08)",
                    padding: "8px",
                    zIndex: 99,
                  }}
                >
                  {[
                    { id: "all", label: "All Organizations", count: totalCount },
                    { id: "Active", label: "Active", count: activeCount },
                    { id: "Inactive", label: "Inactive", count: inactiveCount },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSelectedFilter(opt.id);
                        setShowFilterDropdown(false);
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "none",
                        background: selectedFilter === opt.id ? (isDark ? "rgba(99, 102, 241, 0.2)" : "#eff6ff") : "transparent",
                        color: selectedFilter === opt.id ? "#6366f1" : textColor,
                        fontWeight: selectedFilter === opt.id ? "700" : "500",
                        fontSize: "13.5px",
                        cursor: "pointer",
                      }}
                    >
                      <span>{opt.label}</span>
                      <span style={{ fontSize: "11px", fontWeight: "700", background: isDark ? "#334155" : "#e2e8f0", padding: "2px 7px", borderRadius: "99px" }}>
                        {opt.count}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Grid / List View Toggle Icons */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: isDark ? "#0f172a" : "#eef2ff",
                borderRadius: "16px",
                padding: "4px",
                gap: "4px",
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Grid Card View"
                style={{
                  background: viewMode === "grid" ? (isDark ? "#6366f1" : "#ffffff") : "transparent",
                  color: viewMode === "grid" ? (isDark ? "#ffffff" : "#4f46e5") : subColor,
                  border: "none",
                  borderRadius: "12px",
                  width: "40px",
                  height: "38px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  cursor: "pointer",
                  boxShadow: viewMode === "grid" ? "0 4px 12px rgba(99, 102, 241, 0.25)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                <FaThLarge />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                title="List Table View"
                style={{
                  background: viewMode === "list" ? (isDark ? "#6366f1" : "#ffffff") : "transparent",
                  color: viewMode === "list" ? (isDark ? "#ffffff" : "#4f46e5") : subColor,
                  border: "none",
                  borderRadius: "12px",
                  width: "40px",
                  height: "38px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  cursor: "pointer",
                  boxShadow: viewMode === "list" ? "0 4px 12px rgba(99, 102, 241, 0.25)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                <FaList />
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ padding: "12px", background: "rgba(229, 62, 62, 0.1)", color: "#e53e3e", borderRadius: "8px", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        {viewMode === "grid" ? (
          /* ==================== GRID VIEW (CARDS) ==================== */
          displayOrgs.length === 0 && !loading ? (
            <div className="orgs-empty-state">
              <div className="orgs-empty-icon">🏢</div>
              <h3 className="orgs-empty-title">No Organizations Found</h3>
              <p className="orgs-empty-desc">
                {searchQuery
                  ? `No organizations match "${searchQuery}". Try clearing the search or changing filters.`
                  : "No organizations found in database. Click '+ Create Organization' to add one!"}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  className="btn-primary"
                  style={{ marginTop: "8px", fontSize: "13px", padding: "8px 16px" }}
                  onClick={() => setSearchQuery("")}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="orgs-grid-container">
              {displayOrgs.map((o) => (
                <div
                  key={o.id}
                  className="org-card"
                  onClick={() => openOrg(o)}
                  title={`Click to open ${o.name} Dashboard`}
                >
                  {/* Card Header: Logo, Name, Location & Status */}
                  <div className="org-card-header">
                    <div className="org-card-identity">
                      <div className="org-card-logo-wrap">
                        {o.logoUrl ? (
                          <img
                            src={o.logoUrl}
                            alt={o.name}
                            className="org-card-logo-img"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="org-card-logo-icon">{o.logo || "🏢"}</span>
                        )}
                      </div>
                      <div className="org-card-title-box">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                          <h3 className="org-card-name" title={o.name} style={{ margin: 0 }}>
                            {o.name}
                          </h3>
                          <span className="org-card-chip org-code" title="Organization Code / ID" style={{ fontSize: "11.5px", padding: "2px 8px" }}>
                            #{o.orgId || "N/A"}
                          </span>
                        </div>
                        <span className="org-card-location">
                          <FaMapMarkerAlt />
                          {o.city
                            ? `${o.city}${o.state ? `, ${o.state}` : ""}`
                            : o.branch || "Hotel & Hospitality"}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`org-status-pill ${(o.status || "").toLowerCase() === "active" ? "active" : "inactive"}`}
                      title={`Status: ${(o.status || "").toLowerCase() === "active" ? "Active" : "Inactive"}`}
                    >
                      <span className="org-status-dot" />
                      {(o.status || "").toLowerCase() === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Card Body: Description & Tags */}
                  <div className="org-card-body">
                    <p className="org-card-desc">
                      {o.description && o.description !== "-"
                        ? o.description
                        : "A premier hotel organization offering exceptional hospitality, modern accommodations, and world-class guest services."}
                    </p>

                    <div className="org-card-meta-row">
                      {o.created && (
                        <span className="org-card-chip" title="Created Date">
                          <FaCalendarAlt /> {o.created}
                        </span>
                      )}
                      {o.branch && (
                        <span className="org-card-chip" title="Branch Location">
                          🏨 {o.branch}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Enter Dashboard & Actions */}
                  <div className="org-card-footer" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="org-btn-manage"
                      onClick={() => openOrg(o)}
                      title={`Go inside ${o.name} Dashboard`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "8px 16px",
                        borderRadius: "10px",
                        fontSize: "12.5px",
                        fontWeight: "700",
                        color: "#ffffff",
                        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(99, 102, 241, 0.25)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span>Enter Dashboard</span>
                      <FaArrowRight style={{ fontSize: "11px" }} />
                    </button>

                    <div className="org-card-actions-group">
                      <button
                        type="button"
                        className="org-action-icon-btn"
                        onClick={() => handleOpenEdit(o)}
                        title={`Edit ${o.name}`}
                      >
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        className="org-action-icon-btn danger"
                        onClick={() => removeOrg(o.id)}
                        title={`Delete ${o.name}`}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* ==================== LIST VIEW (TABLE) ==================== */
          <table>
            <thead>
              <tr>
                <th style={{ width: "110px" }}>Org ID</th>
                <th>Logo & Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created Date</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayOrgs.length === 0 && !loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "32px 24px", color: "#a0aec0" }}>
                    {searchQuery
                      ? `No organizations match "${searchQuery}".`
                      : "No organizations found in database. Click '+ Create Organization' to add one!"}
                  </td>
                </tr>
              ) : (
                displayOrgs.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => openOrg(o)}
                    style={{ cursor: "pointer" }}
                    title={`Click to open ${o.name} Dashboard`}
                  >
                    <td>
                      <span className="badge orgid">
                        {o.orgId || "N/A"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {o.logoUrl ? (
                          <img
                            src={o.logoUrl}
                            alt={o.name}
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "8px",
                              objectFit: "cover",
                              border: "1px solid rgba(255,255,255,0.2)"
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="org-logo" style={{ fontSize: "20px" }}>{o.logo || "🏢"}</span>
                        )}
                        <div>
                          <strong style={{ fontSize: "14px", display: "block" }}>{o.name}</strong>
                          {o.branch && (
                            <span style={{ fontSize: "11px", color: "#64748b" }}>{o.branch}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{o.description}</td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "5px 12px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: "700",
                          background: (o.status || "").toLowerCase() === "active"
                            ? (isDark ? "rgba(16, 185, 129, 0.18)" : "#dcfce7")
                            : (isDark ? "rgba(239, 68, 68, 0.18)" : "#fee2e2"),
                          color: (o.status || "").toLowerCase() === "active"
                            ? (isDark ? "#34d399" : "#15803d")
                            : (isDark ? "#f87171" : "#b91c1c"),
                          border: (o.status || "").toLowerCase() === "active"
                            ? (isDark ? "1px solid rgba(52, 211, 153, 0.3)" : "1px solid #bbf7d0")
                            : (isDark ? "1px solid rgba(248, 113, 113, 0.3)" : "1px solid #fca5a5"),
                        }}
                      >
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: (o.status || "").toLowerCase() === "active" ? "#10b981" : "#ef4444",
                            boxShadow: (o.status || "").toLowerCase() === "active" ? "0 0 6px #10b981" : "0 0 6px #ef4444",
                            display: "inline-block",
                          }}
                        />
                        {(o.status || "").toLowerCase() === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>{o.created}</td>
                    <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => openOrg(o)}
                          style={{
                            fontSize: "12px",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                            border: "none",
                            color: "#ffffff",
                            fontWeight: "700",
                            cursor: "pointer",
                            boxShadow: "0 2px 6px rgba(99, 102, 241, 0.2)",
                          }}
                        >
                          <span>Enter</span>
                          <FaArrowRight style={{ fontSize: "10px" }} />
                        </button>
                        <RowActions
                          items={[
                            { label: "Edit", onClick: () => handleOpenEdit(o) },
                            { label: "Delete", danger: true, onClick: () => removeOrg(o.id) },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        <div className="table-footer">
          <span>
            Showing {displayOrgs.length > 0 ? `1-${displayOrgs.length}` : "0"} of {displayOrgs.length} organizations
            {searchQuery || selectedFilter !== "all" ? ` (filtered from ${orgs.length})` : ""}
          </span>
          <span className="pager">
            <button className="btn-sm" disabled>Previous</button>
            <span className="pager-info">Page 1 of 1</span>
            <button className="btn-sm" disabled>Next</button>
          </span>
        </div>
      </section>

      {/* CREATE / EDIT ORGANIZATION MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: modalTheme.overlayBg,
          backdropFilter: "blur(6px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999
        }}>
          <div className="modal-card" style={{
            background: modalTheme.cardBg,
            borderRadius: "16px",
            padding: "28px",
            width: "100%",
            maxWidth: "500px",
            boxShadow: modalTheme.cardShadow,
            border: modalTheme.cardBorder,
            color: modalTheme.titleColor,
            transition: "background 0.25s ease, border 0.25s ease, color 0.25s ease"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "20px", display: "flex", alignItems: "center", gap: "8px", color: modalTheme.titleColor }}>
                <FaBuilding style={{ color: "#805ad5" }} />
                {editingOrg ? "Edit Organization" : "Create Organization"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", color: modalTheme.closeBtnColor, fontSize: "18px", cursor: "pointer" }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmitOrg}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: modalTheme.labelColor }}>
                  Org ID <span style={{ fontSize: "12px", color: modalTheme.subLabelColor }}>(Auto-generated)</span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={formOrgId}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: modalTheme.orgIdBg,
                    border: modalTheme.orgIdBorder,
                    color: modalTheme.orgIdColor,
                    fontSize: "14px",
                    fontWeight: "bold",
                    fontFamily: "monospace",
                    letterSpacing: "1px",
                    cursor: "not-allowed"
                  }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: modalTheme.labelColor }}>
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Palace Hotel"
                  value={formName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormName(val);
                    if (!editingOrg) {
                      setFormOrgId(generateFrontendOrgId(val));
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: modalTheme.inputBg,
                    border: modalTheme.inputBorder,
                    color: modalTheme.inputColor,
                    fontSize: "14px"
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: modalTheme.labelColor }}>
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Brief description of the property or organization"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: modalTheme.inputBg,
                    border: modalTheme.inputBorder,
                    color: modalTheme.inputColor,
                    fontSize: "14px",
                    resize: "none"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: modalTheme.labelColor }}>
                    Branch
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Downtown Branch"
                    value={formBranch}
                    onChange={(e) => setFormBranch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: modalTheme.inputBg,
                      border: modalTheme.inputBorder,
                      color: modalTheme.inputColor,
                      fontSize: "14px"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: modalTheme.labelColor }}>
                    Place
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Connaught Place"
                    value={formPlace}
                    onChange={(e) => setFormPlace(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: modalTheme.inputBg,
                      border: modalTheme.inputBorder,
                      color: modalTheme.inputColor,
                      fontSize: "14px"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: modalTheme.labelColor }}>
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. New Delhi"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: modalTheme.inputBg,
                      border: modalTheme.inputBorder,
                      color: modalTheme.inputColor,
                      fontSize: "14px"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: modalTheme.labelColor }}>
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Delhi"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: modalTheme.inputBg,
                      border: modalTheme.inputBorder,
                      color: modalTheme.inputColor,
                      fontSize: "14px"
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: modalTheme.labelColor }}>
                  Full Address
                </label>
                <textarea
                  rows="2"
                  placeholder="Complete street address"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: modalTheme.inputBg,
                    border: modalTheme.inputBorder,
                    color: modalTheme.inputColor,
                    fontSize: "14px",
                    resize: "none"
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: modalTheme.labelColor }}>
                  Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: modalTheme.inputBg,
                    border: modalTheme.inputBorder,
                    color: modalTheme.inputColor,
                    fontSize: "14px"
                  }}
                >
                  <option value="Active" style={{ background: modalTheme.cardBg, color: modalTheme.inputColor }}>Active</option>
                  <option value="Inactive" style={{ background: modalTheme.cardBg, color: modalTheme.inputColor }}>Inactive</option>
                </select>
              </div>

              {/* LOGO IMAGE UPLOAD FIELD */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: modalTheme.labelColor }}>
                  Organization Logo / Image
                </label>

                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  {logoPreview && (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "10px",
                        objectFit: "cover",
                        border: "2px solid #805ad5"
                      }}
                    />
                  )}

                  <label style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    background: modalTheme.logoBoxBg,
                    color: modalTheme.logoBoxColor,
                    border: modalTheme.logoBoxBorder,
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "500"
                  }}>
                    <FaUpload /> Select Logo File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    background: "transparent",
                    border: modalTheme.cancelBorder,
                    color: modalTheme.cancelColor,
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "10px 22px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                    color: "#fff",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(118, 75, 162, 0.4)"
                  }}
                >
                  {saving ? "Saving..." : (editingOrg ? "Update Organization" : "Create Organization")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
