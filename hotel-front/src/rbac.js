import {
  FaUserFriends,
  FaThLarge,
  FaBed,
  FaUsers,
  FaReceipt,
  FaPumpSoap,
  FaWrench,
  FaUserTie,
  FaMoneyBillWave,
  FaChartLine,
  FaStar,
  FaGlobe,
  FaBoxes,
  FaCog,
  FaRobot,
  FaBuilding,
  FaClipboardCheck,
  FaCalendarAlt,
  FaTags,
  FaWallet,
  FaUtensils,
} from "react-icons/fa";

// Role-Based Access Control — granular access matrix.
// Configures navigation items, role permissions, and access helpers.
// Each entry is the SPECIFIC action label that role has for that module.
// A module absent for a role = "No" access (blank in the matrix).

export const ROLES = {
  super_admin: { label: "Super Admin", color: "#805ad5" },
  manager: { label: "Hotel Manager", color: "#3182ce" },
  front_desk: { label: "Front Desk", color: "#38a169" },
  housekeeping: { label: "Housekeeping", color: "#dd6b20" },
  accountant: { label: "Accountant", color: "#d69e2e" },
  chef: { label: "Chef / Kitchen", color: "#e53e3e" },
  guest: { label: "Guest", color: "#667eea" },
};

// Per-role dashboard name (Dashboard row of the matrix).
export const DASHBOARD_NAMES = {
  super_admin: "Full Dashboard",
  manager: "Hotel Dashboard",
  front_desk: "Reception Dashboard",
  housekeeping: "Housekeeping Dashboard",
  accountant: "Finance Dashboard",
  chef: "Kitchen Dashboard",
  kitchen: "Kitchen Dashboard",
  guest: "Booking Dashboard",
};

import React from "react";

export const PayrollBookIcon = (props) =>
  React.createElement(
    "svg",
    {
      width: "18",
      height: "18",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      ...props,
    },
    React.createElement("path", {
      d: "M6 3h10a4 4 0 0 1 4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
    }),
    React.createElement("line", {
      x1: "4",
      y1: "17",
      x2: "20",
      y2: "17",
    })
  );

// Staff management IS the employee module: it creates the person AND their login.
export const MODULES = [
  { key: "dashboard", label: "Dashboard", icon: FaThLarge, path: "/dashboard" },
  { key: "orders", label: "Orders", icon: FaUtensils, path: "/orders" },
  { key: "balance", label: "Balance", icon: FaWallet, path: "/balance" },
  { key: "kitchen", label: "Kitchen", icon: FaUtensils, path: "/kitchen" },
  { key: "rooms", label: "Rooms", icon: FaBed, path: "/rooms" },
  { key: "customers", label: "Customers & Billing", icon: FaUsers, path: "/customers" },
  { key: "housekeeping", label: "Employees", icon: FaUserFriends, path: "/housekeeping" },
  { key: "maintenance", label: "Maintenance & Assets", icon: FaWrench, path: "/maintenance" },
  { key: "employees", label: "Staff", icon: FaUserTie, path: "/employees" },
  { key: "payroll", label: "Visitor", icon: FaUsers, path: "/payroll" },
  { key: "reports", label: "Reports & Analytics", icon: FaChartLine, path: "/reports" },
  { key: "crm", label: "CRM & Loyalty", icon: FaStar, path: "/crm" },
  { key: "ota", label: "OTA Channel Manager", icon: FaGlobe, path: "/ota" },
  { key: "offers", label: "Offers & Coupons", icon: FaTags, path: "/offers" },
  { key: "inventory", label: "Inventory & Procurement", icon: FaBoxes, path: "/inventory" },
  // Admin-only: connect and manage the AI services the hotel uses.
  { key: "ai", label: "AI Integrations", icon: FaRobot, path: "/ai-integrations" },
  // Admin-only: manage the organizations / properties in the system.
  { key: "organizations", label: "Organizations", icon: FaBuilding, path: "/organizations" },
  { key: "roles", label: "Roles & Permissions", icon: FaUserTie, path: "/roles" },
  { key: "hotel_ai", label: "AI Modules", icon: FaRobot, path: "/hotel-ai" },
];

// role -> { moduleKey: "specific access label" }.  Absent = No access.
export const ACCESS = {
  super_admin: {
    dashboard: "Full Dashboard",
    calendar: "Full Schedule",
    rooms: "Full CRUD",
    customers: "Full",
    billing: "Full",
    housekeeping: "Full",
    maintenance: "Full",
    payroll: "Full",
    reports: "All Reports",
    crm: "Full",
    ota: "Full",
    offers: "Full",
    inventory: "Full",
    settings: "Full",
    employees: "Full CRUD",
    organizations: "Manage Organizations",
    roles: "Manage Roles & Permissions",
    hotel_ai: "Manage AI Modules",
    // Only the Super Admin can connect AI services — no other role gets this.
    ai: "Manage AI Integrations",
  },
  manager: {
    dashboard: "Hotel Dashboard",
    calendar: "Full Schedule",
    rooms: "Full CRUD",
    customers: "Full",
    billing: "Full",
    housekeeping: "Assign & Monitor",
    maintenance: "Manage",
    reports: "Hotel Reports",
    crm: "Manage",
    ota: "Manage",
    offers: "Manage",
    inventory: "Manage Stock",
    employees: "Create Accountant",
    settings: "Change Own Password",
  },
  front_desk: {
    dashboard: "Reception Dashboard",
    calendar: "View Schedule",
    rooms: "View + Room Status Update",
    customers: "Add / Edit / View Guest",
    billing: "Generate Bill / Receive Payment",
    housekeeping: "View & Approve Cleaning",
    maintenance: "Report Issue",
    reports: "Booking Reports",
    crm: "Add Loyalty Points",
    inventory: "View Stock",
    employees: "Create Housekeeping",
    settings: "Change Own Password",
  },
  housekeeping: {
    dashboard: "Housekeeping Dashboard",
    housekeeping: "Housekeeping Dashboard",
    calendar: "View Tasks",
    balance: "Housekeeping Balance",
    profile: "Housekeeper Profile",
    settings: "Change Own Password",
  },
  accountant: {
    dashboard: "Finance Dashboard",
    billing: "Invoice & Reports",
    payroll: "Manage Payroll",
    employees: "View Employees",
    reports: "Financial Reports",
    settings: "Change Own Password",
  },
  chef: {
    dashboard: "Kitchen Dashboard",
    orders: "Kitchen Orders",
    balance: "Kitchen Balance",
    kitchen: "Kitchen Operations",
    housekeeping: "View Tasks",
    settings: "Change Own Password",
  },
  kitchen: {
    dashboard: "Kitchen Dashboard",
    orders: "Kitchen Orders",
    balance: "Kitchen Balance",
    kitchen: "Kitchen Operations",
    housekeeping: "View Tasks",
    settings: "Change Own Password",
  },
  guest: {
    // Guest portal is separate & minimal — only their own booking/billing/profile/loyalty.
    // Available rooms are shown inside the booking flow, not as a standalone module.
    dashboard: "Booking Dashboard",
    customers: "View Own Profile",
    billing: "Pay Bill / Download Invoice",
    crm: "View Points / Offers",
  },
};

// Demo login accounts — one per role.
export const USERS = {
  "adminhotel@hotel.com": { password: "admin123", name: "Super Admin", role: "super_admin" },
  "admin@gmail.com": { password: "admin123", name: "Super Admin", role: "super_admin" },
  "manager@hotel.com": { password: "manager123", name: "Rajesh Manager", role: "manager" },
  "frontdesk@hotel.com": { password: "front123", name: "Anil (Front Desk)", role: "front_desk" },
  "housekeeping@hotel.com": { password: "house123", name: "Sunita Devi", role: "housekeeping" },
  "sunita@hotel.com": { password: "house123", name: "Sunita Devi", role: "housekeeping" },
  "ramesh@hotel.com": { password: "house123", name: "Ramesh Kumar", role: "housekeeping" },
  "anita@hotel.com": { password: "house123", name: "Anita Sharma", role: "housekeeping" },
  "kavita@hotel.com": { password: "house123", name: "Kavita Rao", role: "housekeeping" },
  "accountant@hotel.com": { password: "account123", name: "Priya (Accounts)", role: "accountant" },
  "guest@hotel.com": { password: "guest123", name: "Aarav Sharma", role: "guest" },
  "rohan.d@ashirwad.com": { password: "ashirwad123", name: "Rohan Deshmukh", role: "manager", orgId: "AS435", org: "Ashirwad" },
  "neha.k@ashirwad.com": { password: "ashirwad123", name: "Neha Kulkarni", role: "front_desk", orgId: "AS435", org: "Ashirwad" },
  "sanjay.r@ashirwad.com": { password: "ashirwad123", name: "Sanjay Rao", role: "accountant", orgId: "AS435", org: "Ashirwad" },
  "kavita.s@ashirwad.com": { password: "ashirwad123", name: "Kavita Shinde", role: "housekeeping", orgId: "AS435", org: "Ashirwad" },
  "vikas.j@ashirwad.com": { password: "ashirwad123", name: "Vikas Joshi", role: "chef", orgId: "AS435", org: "Ashirwad" },
};

import { getUserPermissions } from "./auth.js";

// Returns the access label string, or null if the role has no access.
export function accessLabel(role, moduleKey) {
  if (!role) return null;
  const cleanRole = String(role).trim().toLowerCase().replace(/\s+/g, "_");

  // Super admin always has unrestricted full access to everything
  if (cleanRole === "super_admin" || cleanRole === "admin" || cleanRole === "root") {
    return "Full Access";
  }

  // Manager has full access to all standard operational modules
  if (cleanRole === "manager") {
    if (moduleKey === "ai" || moduleKey === "organizations" || moduleKey === "roles" || moduleKey === "hotel_ai") {
      return null;
    }
    return "Manage";
  }

  // Accountant gets access to employees and payroll (Visitor) modules
  if (cleanRole === "accountant") {
    if (moduleKey === "customers" || moduleKey === "rooms" || moduleKey === "inventory") {
      return null;
    }
    if (moduleKey === "employees" || moduleKey === "payroll") {
      return "View / Manage";
    }
  }

  // Housekeeping staff access to housekeeping task view, balance, profile
  if (cleanRole === "housekeeping" && (moduleKey === "housekeeping" || moduleKey === "balance" || moduleKey === "dashboard" || moduleKey === "calendar" || moduleKey === "profile")) {
    return "View Tasks";
  }

  // Kitchen/Chef staff access to kitchen, orders, balance, dashboard
  if ((cleanRole === "chef" || cleanRole === "kitchen") && (moduleKey === "kitchen" || moduleKey === "orders" || moduleKey === "balance" || moduleKey === "dashboard" || moduleKey === "housekeeping")) {
    return "Kitchen Operations";
  }

  // Every signed-in staff member must be able to open Settings to change
  // their own password. The Settings screen enforces the self-only rule.
  if (moduleKey === "settings" && role && role !== "guest") {
    return "Change Own Password";
  }

  const dynamicPerms = getUserPermissions();
  if (dynamicPerms && typeof dynamicPerms === "object" && Object.keys(dynamicPerms).length > 0) {
    const perm = dynamicPerms[moduleKey];
    if (perm) {
      if (perm.can_edit) return "Manage";
      if (perm.can_view) return "View";
      return null;
    }
    // Handle special mappings like calendar or billing if needed
    if (moduleKey === "calendar") {
      if (dynamicPerms["rooms"]?.can_view || dynamicPerms["dashboard"]?.can_view || dynamicPerms["housekeeping"]?.can_view) {
        return "View";
      }
    }
    if (moduleKey === "billing") {
      if (dynamicPerms["customers"]?.can_edit) return "Manage";
      if (dynamicPerms["customers"]?.can_view) return "View";
    }
  }

  // Fallback to static ACCESS matrix
  if (ACCESS[cleanRole] && ACCESS[cleanRole][moduleKey]) {
    return ACCESS[cleanRole][moduleKey];
  }

  return null;
}

// Back-compat alias used by route guards (truthy = has access).
export const accessLevel = accessLabel;

// Helper to check view authorization
export function canView(moduleKey, role) {
  const r = role || (sessionStorage.getItem("userRole") || "");
  const clean = String(r).trim().toLowerCase().replace(/\s+/g, "_");
  if (clean === "super_admin" || clean === "admin" || clean === "root") return true;
  return Boolean(accessLabel(r, moduleKey));
}

// Helper to check edit/management authorization
export function canEdit(moduleKey, role) {
  const r = role || (sessionStorage.getItem("userRole") || "");
  const clean = String(r).trim().toLowerCase().replace(/\s+/g, "_");
  if (clean === "super_admin" || clean === "admin" || clean === "root") return true;

  const dynamicPerms = getUserPermissions();
  if (dynamicPerms && dynamicPerms[moduleKey]) {
    return Boolean(dynamicPerms[moduleKey].can_edit);
  }
  const label = accessLabel(r, moduleKey);
  return label === "Manage" || label === "Full Access" || label === "Full CRUD";
}

export function accessibleModules(role) {
  const r = role || (sessionStorage.getItem("userRole") || "");
  const clean = String(r).trim().toLowerCase().replace(/\s+/g, "_");
  if (clean === "super_admin" || clean === "admin" || clean === "root") {
    return MODULES.filter((m) => m.key !== "balance" && m.key !== "orders" && m.key !== "kitchen" && m.key !== "payroll" && m.key !== "inventory");
  }

  // Chef & Kitchen Role Sidebar Navigation: Dashboard, Orders, Balance
  if (clean === "chef" || clean === "kitchen") {
    return [
      { key: "dashboard", label: "Dashboard", icon: FaThLarge, path: "/dashboard" },
      { key: "orders", label: "Orders", icon: FaUtensils, path: "/orders" },
      { key: "balance", label: "Balance", icon: FaWallet, path: "/balance" },
    ];
  }

  return MODULES.filter((m) => {
    // User request: remove rooms and employees from sidedashboard only in housekeeping
    if (clean === "housekeeping" && (m.key === "rooms" || m.key === "housekeeping" || m.key === "employees" || m.key === "orders" || m.key === "kitchen")) return false;
    // User request: remove Inventory, Customers & Billing, and Orders/Kitchen from accountant sidedashboard
    if (clean === "accountant" && (m.key === "inventory" || m.key === "customers" || m.key === "orders" || m.key === "kitchen")) return false;
    // Balance is primarily for housekeeping sidedashboard
    if (clean !== "housekeeping" && m.key === "balance") return false;
    if (m.key === "orders" || m.key === "kitchen") return false;
    return Boolean(accessLabel(r, m.key));
  }).map((m) => {
    if (clean === "accountant") {
      if (m.key === "employees") {
        return { ...m, label: "Employees", icon: FaUserFriends };
      }
      if (m.key === "payroll") {
        return { ...m, label: "Visitor", icon: FaUsers };
      }
    }
    if (m.key === "housekeeping") {
      return { ...m, label: "Employees", icon: FaUserFriends };
    }
    return m;
  });
}

export function dashboardName(role) {
  const clean = String(role || "").trim().toLowerCase().replace(/\s+/g, "_");
  return DASHBOARD_NAMES[clean] || "Dashboard";
}
