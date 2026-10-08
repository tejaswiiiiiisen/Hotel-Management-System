// Centralized Profile Store & Real-Time Event Bus with Granular RBAC Permissions
import { getUserName, getUserEmail, getUserRole, getCurrentOrg, getScopedStorageKey } from "../auth.js";

const PROFILE_STORAGE_KEY = "hotel_admin_profile_v3";
function getProfileKey(role) {
  return getScopedStorageKey(`${PROFILE_STORAGE_KEY}_${role}`);
}

export const ROLE_PERMISSIONS = {
  super_admin: [
    "Full Administrative Privileges & System Oversight",
    "Room & Reservation Management (Full CRUD)",
    "Staff & Employee Directory Control",
    "Housekeeping Task Approval & Re-scheduling",
    "Billing, Payroll & Financial Reports Access",
    "System Security, Settings & Audit Logs",
    "AI Integrations & Multi-Organization Setup",
  ],
  manager: [
    "Hotel Operations & Manager Dashboard Oversight",
    "Room Inventory & Rate Control (Full CRUD)",
    "Housekeeping Task Assignment & Staff Supervision",
    "Guest CRM, Loyalty & OTA Channel Control",
    "Hotel Reports & Occupancy Analytics",
    "Staff Creation (Accountants & Operations)",
  ],
  front_desk: [
    "Reception & Guest Check-In / Check-Out Control",
    "Room Status Updates & Guest Registration",
    "Billing Generation & Payment Processing",
    "View & Approve Housekeeping Cleaning Proofs",
    "Maintenance Issue Reporting",
    "Staff Creation (Housekeeping Personnel)",
  ],
  housekeeping: [
    "View Assigned Room Cleaning Schedule & Tasks",
    "Update Room Cleaning Progress & Status (Cleaned)",
    "Upload Room Cleaning Photo Proofs for Approval",
    "View Assigned Floor & Room Details",
    "Receive Real-Time Cleaning & Re-schedule Alerts",
  ],
  accountant: [
    "Financial & Payroll Dashboard Oversight",
    "Employee Payroll Processing & Salary Management",
    "Billing Invoices & Financial Reports Access",
    "Inventory Procurement & Expense Logging",
  ],
  guest: [
    "Personal Booking & Profile Dashboard Access",
    "View Loyalty Points & Special Hotel Offers",
    "Online Room Payment & Download Invoices",
    "Submit Room Service & Special Requests",
  ],
};

export const ROLE_DETAILS = {
  super_admin: {
    status: "Active System Administrator",
    department: "Executive Management & Operations",
    bio: "Chief Executive Hotel Administrator responsible for multi-property hospitality management, room operations, inventory control, and staff oversight.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  },
  manager: {
    status: "Active Hotel Manager",
    department: "General Hotel Operations",
    bio: "Hotel Manager overseeing daily front desk operations, housekeeping workflows, staff coordination, and revenue optimization.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
  },
  front_desk: {
    status: "Active Front Desk Agent",
    department: "Guest Reception & Concierge",
    bio: "Front Desk Specialist managing guest check-in/out, room bookings, guest billing, and real-time room status updates.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
  },
  housekeeping: {
    status: "Active Housekeeping Staff",
    department: "Housekeeping & Room Hygiene",
    bio: "Housekeeping Staff responsible for room sanitization, linen management, uploading cleaning photo proofs, and maintaining room hygiene standards.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
  },
  accountant: {
    status: "Active Financial Accountant",
    department: "Finance & Payroll Department",
    bio: "Financial Accountant managing hotel invoicing, staff payroll processing, expense tracking, and financial statements.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
  },
  guest: {
    status: "Registered Guest",
    department: "Hospitality Guest",
    bio: "Valued guest registered with the hotel for seamless bookings, billing, and room service.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80",
  },
};

export function getProfile() {
  const activeRole = getUserRole() || "super_admin";
  const roleDefaults = ROLE_DETAILS[activeRole] || ROLE_DETAILS.super_admin;
  const currentName = getUserName() || (activeRole === "housekeeping" ? "Sunita Devi" : "Super Admin");
  const currentEmail = getUserEmail() || `${activeRole}@hotel.com`;

  const defaultProfileData = {
    name: currentName,
    email: currentEmail,
    role: activeRole,
    phone: "+91 98765 43210",
    avatar: roleDefaults.avatar,
    department: roleDefaults.department,
    hotelName: activeRole === "super_admin" ? "All Organizations (Global Admin)" : (getCurrentOrg() || "Ashirwad"),
    bio: roleDefaults.bio,
    address: "Suite 402, Grand Heritage Plaza, New Delhi, India",
    emergencyContact: "+91 99887 76655 (Supervisor)",
    joinedDate: "January 15, 2024",
    status: roleDefaults.status,
  };

  try {
    const saved = localStorage.getItem(getProfileKey(activeRole));
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaultProfileData,
        ...parsed,
        name: parsed.name || currentName,
        email: parsed.email || currentEmail,
        role: activeRole,
        hotelName: activeRole === "super_admin" ? "All Organizations (Global Admin)" : (parsed.hotelName || getCurrentOrg() || "Ashirwad"),
        status: roleDefaults.status,
        permissions: ROLE_PERMISSIONS[activeRole] || ROLE_PERMISSIONS.super_admin,
      };
    }
  } catch (err) {
    console.error("Error loading profile data:", err);
  }

  return {
    ...defaultProfileData,
    permissions: ROLE_PERMISSIONS[activeRole] || ROLE_PERMISSIONS.super_admin,
  };
}

export function saveProfile(updatedProfile) {
  const activeRole = getUserRole() || "super_admin";
  try {
    const current = getProfile();
    const newProfile = { ...current, ...updatedProfile };
    localStorage.setItem(getProfileKey(activeRole), JSON.stringify(newProfile));

    // Also sync sessionStorage for auth helpers
    if (newProfile.name) sessionStorage.setItem("userName", newProfile.name);
    if (newProfile.email) sessionStorage.setItem("userEmail", newProfile.email);

    // Dispatch real-time event
    window.dispatchEvent(
      new CustomEvent("profile_changed", {
        detail: { profile: newProfile, message: "Profile updated successfully!" },
      })
    );
    return newProfile;
  } catch (err) {
    console.error("Error saving profile data:", err);
    return null;
  }
}

export function deleteProfile() {
  const activeRole = getUserRole() || "super_admin";
  try {
    localStorage.removeItem(getProfileKey(activeRole));
    sessionStorage.removeItem("userName");
    sessionStorage.removeItem("userEmail");
    window.dispatchEvent(
      new CustomEvent("profile_changed", {
        detail: { profile: null, message: "Profile deleted." },
      })
    );
  } catch (err) {
    console.error("Error deleting profile data:", err);
  }
}

export function subscribeProfile(callback) {
  const handler = (event) => {
    callback(getProfile(), event.detail);
  };

  const storageHandler = (e) => {
    const activeRole = getUserRole() || "super_admin";
    if (e.key === getProfileKey(activeRole)) {
      callback(getProfile(), { message: "Profile updated from another window" });
    }
  };

  window.addEventListener("profile_changed", handler);
  window.addEventListener("storage", storageHandler);

  return () => {
    window.removeEventListener("profile_changed", handler);
    window.removeEventListener("storage", storageHandler);
  };
}
