import { showSuccess, showError, showWarning, showInfo } from "../utils/toast.js";
import React, { useState, useEffect, useMemo } from "react";
import { 
  FaSave, 
  FaPlus, 
  FaTimes, 
  FaCrown, 
  FaTrash, 
  FaEdit, 
  FaSearch, 
  FaShieldAlt, 
  FaCheck, 
  FaBan, 
  FaEye, 
  FaLock, 
  FaUndo, 
  FaUserShield, 
  FaChevronDown, 
  FaChevronUp, 
  FaLayerGroup,
  FaCheckCircle,
  FaInfoCircle
} from "react-icons/fa";
import PageHeader from "../components/PageHeader.jsx";
import { MODULES, ROLES, ACCESS } from "../rbac.js";
import { getCurrentOrgId } from "../auth.js";

const BACKEND_URL = "http://localhost:4000";

// Curated Category Groupings for intuitive enterprise management
const CATEGORIES = [
  {
    id: "operations",
    label: "OPERATIONS",
    description: "Daily hotel operations, guest rooms, housekeeping and maintenance tasks",
    moduleKeys: ["rooms", "housekeeping", "maintenance"],
  },
  {
    id: "people_finance",
    label: "PEOPLE & FINANCE",
    description: "Guest billing, staff directory, employee logins and payroll records",
    moduleKeys: ["customers", "employees", "payroll"],
  },
  {
    id: "business",
    label: "BUSINESS & DISTRIBUTION",
    description: "Revenue analytics, CRM loyalty, OTA channel sync and stock inventory",
    moduleKeys: ["reports", "crm", "ota", "inventory"],
  },
  {
    id: "administration",
    label: "ADMINISTRATION & SYSTEM",
    description: "Global system configuration, AI integrations, multi-tenant orgs and RBAC",
    moduleKeys: ["dashboard", "settings", "ai", "organizations", "roles"],
  },
];

// Rich descriptions for every module
const MODULE_DESCRIPTIONS = {
  dashboard: "Overview of key metrics, live occupancy, daily check-ins and performance charts.",
  rooms: "Manage room inventory, room types, pricing, status updates, and floor plans.",
  customers: "Manage guest profiles, check-in history, invoices, payments, and folio billing.",
  housekeeping: "Assign cleaning tasks, update room cleanliness states, and monitor staff.",
  maintenance: "Log asset tickets, schedule equipment repairs, and track maintenance issues.",
  employees: "Staff directory, employee credentials, system role assignment, and logins.",
  payroll: "Salary calculations, monthly payroll processing, allowances, and pay slips.",
  reports: "Executive analytics, financial reports, occupancy rates, and revenue exports.",
  crm: "Guest loyalty tiers, reward points, promotional campaigns, and guest history.",
  ota: "External channel integrations (Booking.com, Expedia, Agoda) & rate syncing.",
  inventory: "Stock items, purchase orders, supplier management, and reorder thresholds.",
  settings: "Site settings, tax rules, branding parameters, and security audit log.",
  ai: "Hotel AI concierge integrations, chatbot automation, and API connectors.",
  organizations: "Manage branch properties, hotel franchises, and multi-tenant licenses.",
  roles: "Configure roles, permission access matrix, and module authorization rules.",
};

export default function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({});
  const [originalPermissions, setOriginalPermissions] = useState({});
  
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [accessFilter, setAccessFilter] = useState("all"); // "all", "edit", "view", "none"
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [showAddRole, setShowAddRole] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");

  const currentOrgId = getCurrentOrgId();

  // Dynamic light / dark mode theme observer
  const [isDark, setIsDark] = useState(
    () => document.documentElement.getAttribute("data-theme") === "dark"
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = sessionStorage.getItem("authToken") || "";
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

      const [rolesRes, rolePermsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/rbac/roles`, { headers }),
        fetch(`${BACKEND_URL}/api/rbac/role-permissions`, { headers }),
      ]);

      if (rolesRes.status === 403 || rolePermsRes.status === 403) {
        throw new Error("403 Forbidden: Only Super Admin can access the Roles & Permissions studio.");
      }

      if (!rolesRes.ok || !rolePermsRes.ok) {
        throw new Error("Failed to fetch RBAC data from server.");
      }

      const rolesData = await rolesRes.json();
      const rolePermsData = await rolePermsRes.json();

      // Normalize role permissions so every role has explicit permissions for EVERY module in MODULES
      const normalizedRolePerms = {};
      rolesData.forEach((role) => {
        const rName = (role.name || "").toLowerCase().replace(/\s+/g, "_");
        const existingForRole = rolePermsData[role.id] || {};
        const defaultRoleAccess = ACCESS[rName] || {};

        normalizedRolePerms[role.id] = {};

        MODULES.forEach((mod) => {
          if (existingForRole[mod.key] !== undefined) {
            normalizedRolePerms[role.id][mod.key] = {
              can_view: Boolean(existingForRole[mod.key].can_view),
              can_edit: Boolean(existingForRole[mod.key].can_edit),
            };
          } else {
            // Default fallback if never set in DB
            const defAction = defaultRoleAccess[mod.key];
            if (rName === "super_admin") {
              normalizedRolePerms[role.id][mod.key] = { can_view: true, can_edit: true };
            } else if (defAction) {
              const canEdit =
                defAction.toLowerCase().includes("full") ||
                defAction.toLowerCase().includes("crud") ||
                defAction.toLowerCase().includes("manage");
              normalizedRolePerms[role.id][mod.key] = { can_view: true, can_edit: canEdit };
            } else {
              normalizedRolePerms[role.id][mod.key] = { can_view: false, can_edit: false };
            }
          }
        });
      });

      setRoles(rolesData);
      setRolePermissions(JSON.parse(JSON.stringify(normalizedRolePerms)));
      setOriginalPermissions(JSON.parse(JSON.stringify(normalizedRolePerms)));

      // Auto-select first role if none selected or if selected role not found
      if (rolesData && rolesData.length > 0) {
        setSelectedRoleId((prev) => {
          const exists = rolesData.find((r) => r.id === prev);
          return exists ? prev : rolesData[0].id;
        });
      }
    } catch (err) {
      console.error("RBAC Fetch Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || roles[0] || null;
  }, [roles, selectedRoleId]);

  const selectedRoleIdentifier = useMemo(() => {
    if (!selectedRole) return "";
    return (selectedRole.name || "").toLowerCase().replace(/\s+/g, "_");
  }, [selectedRole]);

  const isSuperAdmin = selectedRoleIdentifier === "super_admin";
  const isSystemRole = Object.keys(ROLES).includes(selectedRoleIdentifier);

  // Check unsaved changes across the entire matrix or for currently selected role
  const isDirty = useMemo(() => {
    return JSON.stringify(rolePermissions) !== JSON.stringify(originalPermissions);
  }, [rolePermissions, originalPermissions]);

  const selectedRoleIsDirty = useMemo(() => {
    if (!selectedRoleId) return false;
    const current = rolePermissions[selectedRoleId] || {};
    const original = originalPermissions[selectedRoleId] || {};
    return JSON.stringify(current) !== JSON.stringify(original);
  }, [rolePermissions, originalPermissions, selectedRoleId]);

  // Set Access Level for a single module in selected role
  // level: 'none' | 'view' | 'edit'
  const handleSetAccessLevel = (roleId, moduleKey, level) => {
    const role = roles.find((r) => r.id === roleId);
    if (role && (role.name || "").toLowerCase() === "super_admin") return;

    setRolePermissions((prev) => {
      const currentRolePerms = prev[roleId] || {};
      let can_view = false;
      let can_edit = false;

      if (level === "view") {
        can_view = true;
        can_edit = false;
      } else if (level === "edit") {
        can_view = true;
        can_edit = true;
      } else {
        // level === 'none' (No Access)
        can_view = false;
        can_edit = false;
      }

      return {
        ...prev,
        [roleId]: {
          ...currentRolePerms,
          [moduleKey]: { can_view, can_edit },
        },
      };
    });
  };

  // Bulk Quick Action for the currently selected role
  const handleBulkSetRole = (actionType) => {
    if (!selectedRoleId || isSuperAdmin) return;

    setRolePermissions((prev) => {
      const currentRolePerms = { ...(prev[selectedRoleId] || {}) };

      MODULES.forEach((mod) => {
        if (actionType === "full") {
          currentRolePerms[mod.key] = { can_view: true, can_edit: true };
        } else if (actionType === "view") {
          currentRolePerms[mod.key] = { can_view: true, can_edit: false };
        } else if (actionType === "clear") {
          currentRolePerms[mod.key] = { can_view: false, can_edit: false };
        }
      });

      return {
        ...prev,
        [selectedRoleId]: currentRolePerms,
      };
    });
  };

  // Discard changes and revert to original state
  const handleDiscardChanges = () => {
    setRolePermissions(JSON.parse(JSON.stringify(originalPermissions)));
    showInfo("All unsaved permission changes have been discarded.");
  };

  // Save permissions matrix
  const handleSaveMatrix = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const token = sessionStorage.getItem("authToken") || "";
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

      let hasError = false;

      for (const role of roles) {
        const roleName = (role.name || "").toLowerCase();
        if (roleName === "super_admin") continue;

        const rolePerms = rolePermissions[role.id] || {};
        // Explicitly map all modules to guarantee No Access is stored properly
        const permissionsPayload = MODULES.map((mod) => {
          const modPerm = rolePerms[mod.key] || { can_view: false, can_edit: false };
          return {
            module_key: mod.key,
            can_view: Boolean(modPerm.can_view),
            can_edit: Boolean(modPerm.can_edit),
          };
        });

        const res = await fetch(`${BACKEND_URL}/api/rbac/role-permissions`, {
          method: "POST",
          headers,
          body: JSON.stringify({ role_id: role.id, permissions: permissionsPayload }),
        });

        if (!res.ok) {
          hasError = true;
          console.error("Failed to save permissions for role ID", role.id);
        }
      }

      if (hasError) {
        showError("Some permissions failed to save. Please try again.");
      } else {
        setOriginalPermissions(JSON.parse(JSON.stringify(rolePermissions)));
        localStorage.setItem("rbac_last_updated", String(Date.now()));
        window.dispatchEvent(new CustomEvent("user_permissions_updated"));
        window.dispatchEvent(new Event("storage"));
        showSuccess("Permissions updated and saved successfully!");
      }
    } catch (err) {
      console.error(err);
      showError("Failed to save permissions.");
    } finally {
      setSaving(false);
    }
  };

  // Add or Edit Role Modal submit
  const handleAddOrEditRole = async () => {
    if (!newRoleName.trim()) return;

    const newNameClean = newRoleName.toLowerCase().replace(/\s+/g, "_");

    if (!editingRoleId && roles.find((r) => r.name.toLowerCase() === newNameClean)) {
      showWarning("Role already exists!");
      return;
    }

    if (editingRoleId && roles.find((r) => r.id !== editingRoleId && r.name.toLowerCase() === newNameClean)) {
      showWarning("Role name already exists!");
      return;
    }

    try {
      const token = sessionStorage.getItem("authToken") || "";
      const url = editingRoleId
        ? `${BACKEND_URL}/api/rbac/roles/${editingRoleId}`
        : `${BACKEND_URL}/api/rbac/roles`;

      const method = editingRoleId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newNameClean, description: newRoleDescription }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${editingRoleId ? "update" : "create"} role`);
      }

      const returnedRole = await res.json();

      if (editingRoleId) {
        setRoles(roles.map((r) => (r.id === editingRoleId ? returnedRole : r)));
        showSuccess("Role updated successfully.");
      } else {
        setRoles([...roles, returnedRole]);
        setRolePermissions((prev) => ({ ...prev, [returnedRole.id]: {} }));
        setOriginalPermissions((prev) => ({ ...prev, [returnedRole.id]: {} }));
        setSelectedRoleId(returnedRole.id);
        showSuccess("New role created successfully.");
      }

      setShowAddRole(false);
      setNewRoleName("");
      setNewRoleDescription("");
      setEditingRoleId(null);
    } catch (err) {
      showError(err.message);
    }
  };

  // Delete Role
  const handleDeleteRole = async (e, roleId, roleName) => {
    e.stopPropagation();
    if (roleName === "super_admin") {
      showWarning("Cannot delete Super Admin role.");
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete the "${roleName}" role?`)) return;

    try {
      const token = sessionStorage.getItem("authToken") || "";
      const res = await fetch(`${BACKEND_URL}/api/rbac/roles/${roleId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete role");
      }

      const remainingRoles = roles.filter((r) => r.id !== roleId);
      setRoles(remainingRoles);
      
      const newPerms = { ...rolePermissions };
      delete newPerms[roleId];
      setRolePermissions(newPerms);

      const newOrig = { ...originalPermissions };
      delete newOrig[roleId];
      setOriginalPermissions(newOrig);

      if (selectedRoleId === roleId && remainingRoles.length > 0) {
        setSelectedRoleId(remainingRoles[0].id);
      }

      showSuccess("Role deleted successfully.");
    } catch (err) {
      showError(err.message);
    }
  };

  const toggleCategoryCollapse = (catId) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // Compute stats for selected role
  const roleStats = useMemo(() => {
    if (!selectedRole) return { total: 0, edit: 0, view: 0, none: 0 };
    if (isSuperAdmin) {
      return { total: MODULES.length, edit: MODULES.length, view: 0, none: 0 };
    }

    const currentRolePerms = rolePermissions[selectedRole.id] || {};
    let edit = 0;
    let view = 0;
    let none = 0;

    MODULES.forEach((mod) => {
      const p = currentRolePerms[mod.key];
      if (p?.can_edit) edit++;
      else if (p?.can_view) view++;
      else none++;
    });

    return { total: edit + view, edit, view, none };
  }, [selectedRole, isSuperAdmin, rolePermissions]);

  // Filter modules based on search and access level
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return CATEGORIES.map((cat) => {
      const matchingModules = cat.moduleKeys
        .map((key) => MODULES.find((m) => m.key === key))
        .filter(Boolean)
        .filter((mod) => {
          const modDesc = MODULE_DESCRIPTIONS[mod.key] || "";
          const matchesSearch =
            !q ||
            mod.label.toLowerCase().includes(q) ||
            mod.key.toLowerCase().includes(q) ||
            modDesc.toLowerCase().includes(q);

          if (!matchesSearch) return false;

          if (accessFilter === "all") return true;
          if (isSuperAdmin) {
            return accessFilter === "edit";
          }

          const perm = (rolePermissions[selectedRole?.id] || {})[mod.key];
          if (accessFilter === "edit") return Boolean(perm?.can_edit);
          if (accessFilter === "view") return Boolean(perm?.can_view && !perm?.can_edit);
          if (accessFilter === "none") return !perm?.can_view && !perm?.can_edit;
          return true;
        });

      return {
        ...cat,
        modules: matchingModules,
      };
    }).filter((cat) => cat.modules.length > 0);
  }, [searchQuery, accessFilter, isSuperAdmin, rolePermissions, selectedRole]);

  const themeVars = {
    bgMain: isDark ? "#0f172a" : "#f8fafc",
    bgCard: isDark ? "#1e293b" : "#ffffff",
    bgCardSecondary: isDark ? "#172033" : "#f1f5f9",
    border: isDark ? "#334155" : "#e2e8f0",
    borderLight: isDark ? "#283548" : "#f1f5f9",
    textMain: isDark ? "#f8fafc" : "#0f172a",
    textMuted: isDark ? "#94a3b8" : "#64748b",
    textHeading: isDark ? "#e2e8f0" : "#1e293b",
    accent: "#6366f1",
    accentHover: "#4f46e5",
    accentBg: isDark ? "rgba(99, 102, 241, 0.15)" : "#eef2ff",
    modalOverlay: isDark ? "rgba(0,0,0,0.75)" : "rgba(15,23,42,0.45)",
    shadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.05)",
  };

  // Helper description text for roles
  const getRoleDescription = (role) => {
    if (role.description) return role.description;
    const rId = (role.name || "").toLowerCase().replace(/\s+/g, "_");
    if (rId === "super_admin") return "Master root administrator with full unrestricted system access across all modules.";
    if (rId === "manager") return "Oversees all hotel operations, room bookings, staff schedules, and operational reports.";
    if (rId === "front_desk") return "Handles front office tasks, guest check-in/out, folio billing, and customer records.";
    if (rId === "housekeeping") return "Inspects room readiness, updates cleanliness states, and manages cleaning tasks.";
    if (rId === "accountant") return "Manages financial folios, invoices, expenses, staff payroll, and fiscal records.";
    if (rId === "chef") return "Manages restaurant kitchen inventory, food stock orders, and preparation schedules.";
    if (rId === "guest") return "Guest portal account with restricted self-service access to personal bookings.";
    return "Custom operational role with configurable access rights.";
  };

  // Helper to format role names cleanly (e.g. front_desk -> Front Desk)
  const formatRoleName = (name) => {
    if (!name) return "";
    return name
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Restrict access explicitly if in branch mode
  if (currentOrgId) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px auto", fontSize: "28px" }}>
          <FaLock />
        </div>
        <h2 style={{ color: "#ef4444", fontSize: "22px", fontWeight: "800", marginBottom: "8px" }}>403 Access Restricted</h2>
        <p style={{ color: themeVars.textMuted, fontSize: "14px", lineHeight: "1.6" }}>
          Roles & Permissions are managed globally from the Main Superadmin Dashboard. Branch managers inherit preset operational policies.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", color: themeVars.textMuted }}>
        <div style={{ width: "48px", height: "48px", border: "3px solid #e2e8f0", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px auto" }} />
        <p style={{ fontSize: "15px", fontWeight: "600" }}>Loading Roles & Permissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", maxWidth: "500px", margin: "0 auto" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px auto", fontSize: "28px" }}>
          <FaBan />
        </div>
        <h2 style={{ color: "#ef4444", fontSize: "22px", fontWeight: "800", marginBottom: "8px" }}>Access Error</h2>
        <p style={{ color: themeVars.textMuted, fontSize: "14px", marginBottom: "24px" }}>{error}</p>
        <button className="btn-primary" onClick={fetchData} style={{ padding: "10px 24px", borderRadius: "10px", background: "#6366f1", border: "none", color: "#fff", fontWeight: "600" }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* PAGE HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <PageHeader
            title="Roles & Permissions"
            subtitle="Configure granular access controls and define what each staff role can view and manage."
          />
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => {
              setShowAddRole(true);
              setEditingRoleId(null);
              setNewRoleName("");
              setNewRoleDescription("");
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#6366f1",
              color: "#ffffff",
              border: "none",
              padding: "10px 20px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(99, 102, 241, 0.25)",
              transition: "all 0.2s ease",
            }}
          >
            <FaPlus style={{ fontSize: "12px" }} /> Add New Role
          </button>
        </div>
      </div>

      {/* MAIN 2-COLUMN ENTERPRISE WORKSPACE */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 340px) 1fr", gap: "24px", alignItems: "start" }}>
        
        {/* LEFT COLUMN: ROLES LIST & MANAGEMENT */}
        <div
          style={{
            background: themeVars.bgCard,
            borderRadius: "20px",
            border: `1px solid ${themeVars.border}`,
            boxShadow: themeVars.shadow,
            overflow: "hidden",
            position: "sticky",
            top: "24px",
          }}
        >
          {/* Header of Role List */}
          <div style={{ padding: "18px 20px", borderBottom: `1px solid ${themeVars.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: themeVars.bgCardSecondary }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: themeVars.textMain, display: "flex", alignItems: "center", gap: "8px" }}>
                <FaUserShield style={{ color: "#6366f1" }} /> System Roles
              </h3>
              <span style={{ fontSize: "12px", color: themeVars.textMuted }}>{roles.length} roles configured</span>
            </div>
          </div>

          {/* List of Roles */}
          <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px", maxHeight: "calc(100vh - 240px)", overflowY: "auto" }}>
            {roles.map((role) => {
              const rId = (role.name || "").toLowerCase().replace(/\s+/g, "_");
              const isSelected = selectedRoleId === role.id;
              const isSuper = rId === "super_admin";
              const isSys = Object.keys(ROLES).includes(rId);

              // Calculate active permissions count for badge
              let permCount = 0;
              if (isSuper) {
                permCount = MODULES.length;
              } else {
                const pMap = rolePermissions[role.id] || {};
                MODULES.forEach((m) => {
                  if (pMap[m.key]?.can_view || pMap[m.key]?.can_edit) permCount++;
                });
              }

              // Color badge
              let roleAccentColor = isSuper ? "#a855f7" : isSys ? "#3b82f6" : "#10b981";

              return (
                <div
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "14px",
                    cursor: "pointer",
                    border: isSelected
                      ? `2px solid ${roleAccentColor}`
                      : `1px solid ${themeVars.borderLight}`,
                    background: isSelected
                      ? isDark
                        ? "rgba(99, 102, 241, 0.12)"
                        : "rgba(99, 102, 241, 0.05)"
                      : "transparent",
                    transition: "all 0.15s ease",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: roleAccentColor,
                          display: "inline-block",
                        }}
                      />
                      <span style={{ fontSize: "14px", fontWeight: isSelected ? "700" : "600", color: themeVars.textMain }}>
                        {formatRoleName(role.name)}
                      </span>
                      {isSuper && (
                        <FaCrown style={{ color: "#eab308", fontSize: "12px" }} title="Master Root Administrator" />
                      )}
                    </div>

                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "2px 8px",
                        borderRadius: "20px",
                        background: isSuper
                          ? "rgba(168, 85, 247, 0.15)"
                          : permCount > 0
                          ? isDark
                            ? "rgba(16, 185, 129, 0.15)"
                            : "#dcfce7"
                          : isDark
                          ? "rgba(148, 163, 184, 0.15)"
                          : "#f1f5f9",
                        color: isSuper
                          ? "#a855f7"
                          : permCount > 0
                          ? isDark
                            ? "#34d399"
                            : "#16a34a"
                          : themeVars.textMuted,
                      }}
                    >
                      {isSuper ? "Full Access" : `${permCount}/${MODULES.length}`}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: "4px 0 0 16px",
                      fontSize: "12px",
                      color: themeVars.textMuted,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {getRoleDescription(role)}
                  </p>

                  {/* Actions for custom roles */}
                  {!isSuper && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginTop: "8px",
                        marginLeft: "16px",
                        paddingTop: "6px",
                        borderTop: isSelected ? `1px dashed ${themeVars.border}` : "none",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setEditingRoleId(role.id);
                          setNewRoleName(role.name);
                          setNewRoleDescription(role.description || "");
                          setShowAddRole(true);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#3b82f6",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontWeight: "600",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: 0,
                        }}
                      >
                        <FaEdit style={{ fontSize: "10px" }} /> Edit
                      </button>

                      <button
                        onClick={(e) => handleDeleteRole(e, role.id, rId)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontWeight: "600",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: 0,
                        }}
                      >
                        <FaTrash style={{ fontSize: "10px" }} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: PERMISSION STUDIO FOR SELECTED ROLE */}
        {selectedRole && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* ROLE BANNER & CONTEXT CARD */}
            <div
              style={{
                background: themeVars.bgCard,
                borderRadius: "20px",
                border: `1px solid ${themeVars.border}`,
                padding: "24px",
                boxShadow: themeVars.shadow,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: themeVars.textMain }}>
                      {formatRoleName(selectedRole.name)}
                    </h2>
                    
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        padding: "3px 12px",
                        borderRadius: "20px",
                        background: isSuperAdmin
                          ? "rgba(168, 85, 247, 0.15)"
                          : isSystemRole
                          ? "rgba(59, 130, 246, 0.15)"
                          : "rgba(16, 185, 129, 0.15)",
                        color: isSuperAdmin ? "#a855f7" : isSystemRole ? "#3b82f6" : "#10b981",
                        border: isSuperAdmin
                          ? "1px solid rgba(168, 85, 247, 0.3)"
                          : isSystemRole
                          ? "1px solid rgba(59, 130, 246, 0.3)"
                          : "1px solid rgba(16, 185, 129, 0.3)",
                      }}
                    >
                      {isSuperAdmin ? "👑 Master Root" : isSystemRole ? "🛡️ System Role" : "✨ Custom Role"}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: "14px", color: themeVars.textMuted, maxWidth: "700px" }}>
                    {getRoleDescription(selectedRole)}
                  </p>
                </div>

                {/* Quick Role summary metrics */}
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <div
                    style={{
                      background: themeVars.bgCardSecondary,
                      padding: "10px 16px",
                      borderRadius: "12px",
                      border: `1px solid ${themeVars.border}`,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#10b981" }}>
                      {roleStats.edit}
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: themeVars.textMuted, textTransform: "uppercase" }}>
                      Full Edit
                    </div>
                  </div>

                  <div
                    style={{
                      background: themeVars.bgCardSecondary,
                      padding: "10px 16px",
                      borderRadius: "12px",
                      border: `1px solid ${themeVars.border}`,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#0284c7" }}>
                      {roleStats.view}
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: themeVars.textMuted, textTransform: "uppercase" }}>
                      View Only
                    </div>
                  </div>

                  <div
                    style={{
                      background: themeVars.bgCardSecondary,
                      padding: "10px 16px",
                      borderRadius: "12px",
                      border: `1px solid ${themeVars.border}`,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "18px", fontWeight: "800", color: themeVars.textMuted }}>
                      {roleStats.none}
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: themeVars.textMuted, textTransform: "uppercase" }}>
                      No Access
                    </div>
                  </div>
                </div>
              </div>

              {/* SUPER ADMIN NOTICE OR BULK ACTION CONTROLS */}
              {isSuperAdmin ? (
                <div
                  style={{
                    marginTop: "20px",
                    padding: "16px 20px",
                    borderRadius: "14px",
                    background: isDark ? "rgba(168, 85, 247, 0.12)" : "#faf5ff",
                    border: "1px solid rgba(168, 85, 247, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                  }}
                >
                  <FaCrown style={{ color: "#a855f7", fontSize: "20px", flexShrink: 0 }} />
                  <div style={{ fontSize: "13px", color: isDark ? "#e9d5ff" : "#6b21a8", lineHeight: "1.5" }}>
                    <strong>Master Root Administrator:</strong> This role automatically possesses unrestricted Read, Write, Edit, and Manage authorization across all ERP modules. These permissions are permanently protected.
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    marginTop: "20px",
                    paddingTop: "16px",
                    borderTop: `1px solid ${themeVars.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <span style={{ fontSize: "13px", fontWeight: "600", color: themeVars.textHeading }}>
                    Quick presets for this role:
                  </span>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => handleBulkSetRole("full")}
                      style={{
                        padding: "7px 14px",
                        borderRadius: "8px",
                        background: isDark ? "rgba(16, 185, 129, 0.15)" : "#ecfdf5",
                        border: "1px solid #10b981",
                        color: "#10b981",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      ⚡ Full Access All
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBulkSetRole("view")}
                      style={{
                        padding: "7px 14px",
                        borderRadius: "8px",
                        background: isDark ? "rgba(2, 132, 199, 0.15)" : "#f0f9ff",
                        border: "1px solid #0284c7",
                        color: "#0284c7",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      👁️ View Only All
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBulkSetRole("clear")}
                      style={{
                        padding: "7px 14px",
                        borderRadius: "8px",
                        background: themeVars.bgCardSecondary,
                        border: `1px solid ${themeVars.border}`,
                        color: themeVars.textMuted,
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      🚫 Clear All Access
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SEARCH & ACCESS FILTER BAR */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {/* Search Box */}
              <div
                style={{
                  position: "relative",
                  flex: "1 1 260px",
                  maxWidth: "400px",
                }}
              >
                <FaSearch
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: themeVars.textMuted,
                    fontSize: "13px",
                  }}
                />
                <input
                  type="text"
                  placeholder="Search modules (e.g. rooms, staff, billing)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px 10px 38px",
                    borderRadius: "12px",
                    border: `1px solid ${themeVars.border}`,
                    background: themeVars.bgCard,
                    color: themeVars.textMain,
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: themeVars.textMuted,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>

              {/* Access Level Filter Tabs */}
              <div
                style={{
                  display: "inline-flex",
                  background: themeVars.bgCard,
                  padding: "4px",
                  borderRadius: "12px",
                  border: `1px solid ${themeVars.border}`,
                }}
              >
                {[
                  { id: "all", label: "All Modules" },
                  { id: "edit", label: "Edit / Full" },
                  { id: "view", label: "View Only" },
                  { id: "none", label: "No Access" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setAccessFilter(tab.id)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "8px",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: accessFilter === tab.id ? "700" : "600",
                      background: accessFilter === tab.id ? "#6366f1" : "transparent",
                      color: accessFilter === tab.id ? "#ffffff" : themeVars.textMuted,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* CATEGORIES & PERMISSIONS MODULE CARDS */}
            {filteredCategories.length === 0 ? (
              <div
                style={{
                  background: themeVars.bgCard,
                  borderRadius: "20px",
                  border: `1px solid ${themeVars.border}`,
                  padding: "48px 24px",
                  textAlign: "center",
                  color: themeVars.textMuted,
                }}
              >
                <FaInfoCircle style={{ fontSize: "32px", marginBottom: "12px", color: "#6366f1" }} />
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: themeVars.textMain, marginBottom: "4px" }}>
                  No modules match your filter
                </h3>
                <p style={{ fontSize: "13px", margin: 0 }}>
                  Try changing your search query or switching access filter tabs.
                </p>
              </div>
            ) : (
              filteredCategories.map((category) => {
                const isCollapsed = collapsedCategories[category.id];

                return (
                  <div
                    key={category.id}
                    style={{
                      background: themeVars.bgCard,
                      borderRadius: "20px",
                      border: `1px solid ${themeVars.border}`,
                      boxShadow: themeVars.shadow,
                      overflow: "hidden",
                    }}
                  >
                    {/* Category Header */}
                    <div
                      onClick={() => toggleCategoryCollapse(category.id)}
                      style={{
                        padding: "16px 20px",
                        background: themeVars.bgCardSecondary,
                        borderBottom: isCollapsed ? "none" : `1px solid ${themeVars.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <FaLayerGroup style={{ color: "#6366f1", fontSize: "14px" }} />
                        <div>
                          <span style={{ fontSize: "13px", fontWeight: "800", letterSpacing: "0.5px", color: themeVars.textHeading }}>
                            {category.label}
                          </span>
                          <span style={{ marginLeft: "10px", fontSize: "12px", color: themeVars.textMuted }}>
                            ({category.modules.length} {category.modules.length === 1 ? "module" : "modules"})
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: themeVars.textMuted }}>
                        <span style={{ fontSize: "12px" }}>{isCollapsed ? "Expand" : "Collapse"}</span>
                        {isCollapsed ? <FaChevronDown /> : <FaChevronUp />}
                      </div>
                    </div>

                    {/* Category Module Cards */}
                    {!isCollapsed && (
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        {category.modules.map((mod, idx) => {
                          const IconComponent = mod.icon;
                          const modPerm = (rolePermissions[selectedRole?.id] || {})[mod.key] || { can_view: false, can_edit: false };
                          
                          // Determine current active level
                          let currentLevel = "none";
                          if (isSuperAdmin) {
                            currentLevel = "edit";
                          } else if (modPerm.can_edit) {
                            currentLevel = "edit";
                          } else if (modPerm.can_view) {
                            currentLevel = "view";
                          }

                          return (
                            <div
                              key={mod.key}
                              style={{
                                padding: "18px 24px",
                                borderBottom: idx === category.modules.length - 1 ? "none" : `1px solid ${themeVars.borderLight}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: "16px",
                                background: currentLevel === "edit"
                                  ? isDark
                                    ? "rgba(16, 185, 129, 0.03)"
                                    : "rgba(16, 185, 129, 0.02)"
                                  : currentLevel === "view"
                                  ? isDark
                                    ? "rgba(2, 132, 199, 0.03)"
                                    : "rgba(2, 132, 199, 0.02)"
                                  : "transparent",
                                transition: "background 0.2s ease",
                              }}
                            >
                              {/* Left: Module Details */}
                              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flex: "1 1 300px" }}>
                                <div
                                  style={{
                                    width: "42px",
                                    height: "42px",
                                    borderRadius: "12px",
                                    background: currentLevel === "edit"
                                      ? "rgba(16, 185, 129, 0.15)"
                                      : currentLevel === "view"
                                      ? "rgba(2, 132, 199, 0.15)"
                                      : isDark
                                      ? "rgba(148, 163, 184, 0.1)"
                                      : "#f1f5f9",
                                    color: currentLevel === "edit"
                                      ? "#10b981"
                                      : currentLevel === "view"
                                      ? "#0284c7"
                                      : themeVars.textMuted,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "18px",
                                    flexShrink: 0,
                                  }}
                                >
                                  {IconComponent && <IconComponent />}
                                </div>

                                <div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                                    <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: themeVars.textMain }}>
                                      {mod.label}
                                    </h4>
                                    <span style={{ fontSize: "11px", color: themeVars.textMuted, fontFamily: "monospace" }}>
                                      {mod.path}
                                    </span>
                                  </div>

                                  <p style={{ margin: 0, fontSize: "12.5px", color: themeVars.textMuted, lineHeight: "1.4" }}>
                                    {MODULE_DESCRIPTIONS[mod.key] || "Module access controls and operational features."}
                                  </p>
                                </div>
                              </div>

                              {/* Right: Modern Segmented Access Controls */}
                              {isSuperAdmin ? (
                                <div
                                  style={{
                                    padding: "6px 14px",
                                    borderRadius: "10px",
                                    background: isDark ? "rgba(168, 85, 247, 0.15)" : "#f3e8ff",
                                    color: "#9333ea",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                  }}
                                >
                                  <FaCheckCircle /> Full System Access
                                </div>
                              ) : (
                                <div
                                  style={{
                                    display: "inline-flex",
                                    background: themeVars.bgCardSecondary,
                                    borderRadius: "12px",
                                    padding: "3px",
                                    border: `1px solid ${themeVars.border}`,
                                  }}
                                >
                                  {/* NO ACCESS BUTTON */}
                                  <button
                                    type="button"
                                    onClick={() => handleSetAccessLevel(selectedRole.id, mod.key, "none")}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      padding: "8px 14px",
                                      borderRadius: "9px",
                                      border: currentLevel === "none"
                                        ? isDark
                                          ? "1px solid rgba(239, 68, 68, 0.4)"
                                          : "1px solid #fca5a5"
                                        : "none",
                                      fontSize: "12px",
                                      fontWeight: "700",
                                      cursor: "pointer",
                                      background: currentLevel === "none"
                                        ? isDark
                                          ? "rgba(239, 68, 68, 0.2)"
                                          : "#fee2e2"
                                        : "transparent",
                                      color: currentLevel === "none"
                                        ? isDark
                                          ? "#f87171"
                                          : "#dc2626"
                                        : themeVars.textMuted,
                                      boxShadow: currentLevel === "none"
                                        ? "0 2px 8px rgba(239, 68, 68, 0.2)"
                                        : "none",
                                      transition: "all 0.15s ease",
                                    }}
                                  >
                                    <FaBan style={{ fontSize: "10px", color: currentLevel === "none" ? (isDark ? "#f87171" : "#dc2626") : "inherit" }} />
                                    No Access
                                  </button>

                                  {/* VIEW ONLY BUTTON */}
                                  <button
                                    type="button"
                                    onClick={() => handleSetAccessLevel(selectedRole.id, mod.key, "view")}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      padding: "8px 14px",
                                      borderRadius: "9px",
                                      border: "none",
                                      fontSize: "12px",
                                      fontWeight: "700",
                                      cursor: "pointer",
                                      background: currentLevel === "view"
                                        ? "#0284c7"
                                        : "transparent",
                                      color: currentLevel === "view"
                                        ? "#ffffff"
                                        : themeVars.textMuted,
                                      boxShadow: currentLevel === "view"
                                        ? "0 2px 8px rgba(2, 132, 199, 0.3)"
                                        : "none",
                                      transition: "all 0.15s ease",
                                    }}
                                  >
                                    <FaEye style={{ fontSize: "11px" }} />
                                    View
                                  </button>

                                  {/* FULL EDIT BUTTON */}
                                  <button
                                    type="button"
                                    onClick={() => handleSetAccessLevel(selectedRole.id, mod.key, "edit")}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      padding: "8px 14px",
                                      borderRadius: "9px",
                                      border: "none",
                                      fontSize: "12px",
                                      fontWeight: "700",
                                      cursor: "pointer",
                                      background: currentLevel === "edit"
                                        ? "#10b981"
                                        : "transparent",
                                      color: currentLevel === "edit"
                                        ? "#ffffff"
                                        : themeVars.textMuted,
                                      boxShadow: currentLevel === "edit"
                                        ? "0 2px 8px rgba(16, 185, 129, 0.3)"
                                        : "none",
                                      transition: "all 0.15s ease",
                                    }}
                                  >
                                    <FaCheck style={{ fontSize: "10px" }} />
                                    Full / Edit
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* BOTTOM SAVE PERMISSIONS ACTION CARD */}
            {!isSuperAdmin && (
              <div
                style={{
                  background: themeVars.bgCard,
                  borderRadius: "20px",
                  border: `1px solid ${themeVars.border}`,
                  boxShadow: themeVars.shadow,
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "16px",
                  marginTop: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: selectedRoleIsDirty ? "rgba(234, 179, 8, 0.15)" : "rgba(16, 185, 129, 0.15)",
                      color: selectedRoleIsDirty ? "#eab308" : "#10b981",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      flexShrink: 0,
                    }}
                  >
                    <FaSave />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: themeVars.textMain }}>
                      {selectedRole ? formatRoleName(selectedRole.name) : "Role"} Permissions
                    </h4>
                    <p style={{ margin: "2px 0 0 0", fontSize: "12.5px", color: themeVars.textMuted }}>
                      {selectedRoleIsDirty
                        ? "You have unsaved changes for this role. Click Save to apply."
                        : `All permissions for ${formatRoleName(selectedRole?.name)} are saved and active.`}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {selectedRoleIsDirty && (
                    <button
                      type="button"
                      onClick={handleDiscardChanges}
                      disabled={saving}
                      style={{
                        padding: "10px 18px",
                        borderRadius: "12px",
                        background: themeVars.bgCardSecondary,
                        border: `1px solid ${themeVars.border}`,
                        color: themeVars.textHeading,
                        fontSize: "13.5px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <FaUndo style={{ fontSize: "11px" }} /> Discard
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveMatrix}
                    disabled={saving}
                    style={{
                      padding: "11px 28px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      border: "none",
                      color: "#ffffff",
                      fontSize: "14px",
                      fontWeight: "700",
                      cursor: saving ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                      transition: "all 0.2s ease",
                      opacity: saving ? 0.7 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!saving) {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 6px 18px rgba(16, 185, 129, 0.45)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 14px rgba(16, 185, 129, 0.35)";
                    }}
                  >
                    <FaSave /> {saving ? "Saving Permissions..." : "Save Permissions"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>



      {/* ADD / EDIT ROLE MODAL */}
      {showAddRole && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: themeVars.modalOverlay,
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "460px",
              padding: "28px",
              borderRadius: "20px",
              background: themeVars.bgCard,
              border: `1px solid ${themeVars.border}`,
              boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: themeVars.textMain }}>
                {editingRoleId ? "Edit Role" : "Create New Role"}
              </h3>
              <button
                onClick={() => {
                  setShowAddRole(false);
                  setEditingRoleId(null);
                  setNewRoleName("");
                  setNewRoleDescription("");
                }}
                style={{ background: "none", border: "none", cursor: "pointer", color: themeVars.textMuted, fontSize: "16px", padding: "4px" }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "700", color: themeVars.textHeading }}>
                Role Name *
              </label>
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g. Concierge, Valet, Night Auditor"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: `1px solid ${themeVars.border}`,
                  borderRadius: "10px",
                  outline: "none",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  background: themeVars.bgCardSecondary,
                  color: themeVars.textMain,
                }}
                onKeyDown={(e) => e.key === "Enter" && handleAddOrEditRole()}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "700", color: themeVars.textHeading }}>
                Role Description
              </label>
              <textarea
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                placeholder="Briefly describe what responsibilities this role handles..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: `1px solid ${themeVars.border}`,
                  borderRadius: "10px",
                  outline: "none",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  resize: "vertical",
                  background: themeVars.bgCardSecondary,
                  color: themeVars.textMain,
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  setShowAddRole(false);
                  setEditingRoleId(null);
                  setNewRoleName("");
                  setNewRoleDescription("");
                }}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  background: themeVars.bgCardSecondary,
                  border: `1px solid ${themeVars.border}`,
                  color: themeVars.textHeading,
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddOrEditRole}
                style={{
                  padding: "10px 24px",
                  borderRadius: "10px",
                  background: "#6366f1",
                  border: "none",
                  color: "#ffffff",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)",
                }}
              >
                {editingRoleId ? "Update Role" : "Create Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
