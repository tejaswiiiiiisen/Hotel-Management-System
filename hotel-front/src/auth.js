import { USERS } from "./rbac.js";
import { findEmployeeByEmailOrStaffId } from "./employees.js";

const BACKEND_URL = "http://localhost:4000";

function clearLegacyLocalStorage() {
  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("authToken");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userName");
  localStorage.removeItem("userRole");
  localStorage.removeItem("currentOrg");
}

export async function login(email, password) {
  const key = email.trim().toLowerCase();
  const isAdminLogin = key === "adminhotel@hotel.com" || key === "admin@gmail.com";

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: key, loginInput: key, password, role: isAdminLogin ? "super_admin" : USERS[key]?.role }),
    });

    const data = await res.json();
    const emp = findEmployeeByEmailOrStaffId(key);

    if (res.ok && data.success) {
      const resolvedRole = isAdminLogin ? "super_admin" : (data.user?.role || emp?.role || "user");
      sessionStorage.setItem("isAuthenticated", "true");
      sessionStorage.setItem("authToken", data.token || "");
      sessionStorage.setItem("userEmail", data.user?.email || key);
      sessionStorage.setItem("userName", isAdminLogin ? "Super Admin" : (data.user?.name || "User"));
      sessionStorage.setItem("userRole", resolvedRole);

      if (data.user?.permissions) {
        sessionStorage.setItem("userPermissions", JSON.stringify(data.user.permissions));
        localStorage.setItem("userPermissions", JSON.stringify(data.user.permissions));
        window.dispatchEvent(new CustomEvent("user_permissions_updated", { detail: data.user.permissions }));
      } else {
        sessionStorage.removeItem("userPermissions");
        localStorage.removeItem("userPermissions");
      }

      if (resolvedRole === "super_admin") {
        // Super admin should see ALL organizations upon login, not be locked to a single branch
        sessionStorage.removeItem("currentOrgId");
        sessionStorage.removeItem("currentOrg");
        sessionStorage.removeItem("currentOrgStatus");
        localStorage.removeItem("currentOrgId");
        localStorage.removeItem("currentOrg");
        localStorage.removeItem("currentOrgStatus");
      } else {
        const targetOrgId = data.user?.orgId || data.user?.organizationCode || emp?.orgId || (emp?.org === "Jaipur Branch" ? "JP01" : emp?.org === "Ajmer Branch" ? "AJ01" : emp?.org === "Cheery Clothing" ? "CH560" : emp?.org === "Matcha Tea" ? "MA330" : "AS435");
        const targetOrgName = data.user?.org || data.user?.orgName || emp?.org || (targetOrgId === "JP01" ? "Jaipur Branch" : targetOrgId === "AJ01" ? "Ajmer Branch" : targetOrgId === "CH560" ? "Cheery Clothing" : targetOrgId === "MA330" ? "Matcha Tea" : "Ashirwad");

        sessionStorage.setItem("currentOrgId", targetOrgId);
        sessionStorage.setItem("currentOrg", targetOrgName);
      }

      clearLegacyLocalStorage();
      return { success: true };
    }

    // Check if employee exists in locally added staff (localStorage or canonical)
    const branchPasswords = ["matcha123", "ashirwad123", "cheery123", "jaipur123", "ajmer123", "password123", "admin123", "sunita123"];
    const empValidPass = emp && (!emp.password || emp.password === password || branchPasswords.includes(password.toLowerCase()));
    if (emp && empValidPass) {
      sessionStorage.setItem("isAuthenticated", "true");
      sessionStorage.setItem("userEmail", emp.email || key);
      sessionStorage.setItem("userName", emp.name);
      sessionStorage.setItem("userRole", emp.role || "housekeeping");

      const orgName = emp.org || (emp.orgId === "JP01" ? "Jaipur Branch" : emp.orgId === "AJ01" ? "Ajmer Branch" : emp.orgId === "AS435" ? "Ashirwad" : emp.orgId === "CH560" ? "Cheery Clothing" : "Matcha Tea");
      const orgId = emp.orgId || (orgName === "Jaipur Branch" ? "JP01" : orgName === "Ajmer Branch" ? "AJ01" : orgName === "Ashirwad" ? "AS435" : orgName === "Cheery Clothing" ? "CH560" : "MA330");

      sessionStorage.setItem("currentOrg", orgName);
      sessionStorage.setItem("currentOrgId", orgId);

      // Fetch dynamic permissions for this role from backend
      try {
        const rolesRes = await fetch(`${BACKEND_URL}/api/rbac/roles`);
        const permsRes = await fetch(`${BACKEND_URL}/api/rbac/role-permissions`);
        if (rolesRes.ok && permsRes.ok) {
          const rolesList = await rolesRes.json();
          const permsMatrix = await permsRes.json();
          const cleanRole = (emp.role || "housekeeping").toLowerCase().replace(/\s+/g, "_");
          const targetRole = rolesList.find((r) => r.name.toLowerCase() === cleanRole || r.name.toLowerCase().replace(/_/g, " ") === cleanRole.replace(/_/g, " "));
          if (targetRole && permsMatrix[targetRole.id]) {
            sessionStorage.setItem("userPermissions", JSON.stringify(permsMatrix[targetRole.id]));
            localStorage.setItem("userPermissions", JSON.stringify(permsMatrix[targetRole.id]));
            window.dispatchEvent(new CustomEvent("user_permissions_updated", { detail: permsMatrix[targetRole.id] }));
          }
        }
      } catch (e) {}

      clearLegacyLocalStorage();
      return { success: true };
    }

    return { success: false, message: data?.message || "Invalid email or password." };
  } catch (err) {
    console.warn("Backend API unreachable, using local authentication fallback:", err);

    // Fallback for Super Admin
    if (isAdminLogin) {
      if (password === "admin123" || (USERS[key] && USERS[key].password === password)) {
        sessionStorage.setItem("isAuthenticated", "true");
        sessionStorage.setItem("userEmail", key);
        sessionStorage.setItem("userName", "Super Admin");
        sessionStorage.setItem("userRole", "super_admin");
        sessionStorage.removeItem("currentOrg");
        sessionStorage.removeItem("currentOrgId");
        sessionStorage.removeItem("currentOrgStatus");
        localStorage.removeItem("currentOrg");
        localStorage.removeItem("currentOrgId");
        localStorage.removeItem("currentOrgStatus");
        clearLegacyLocalStorage();
        return { success: true };
      }
    }

    // Local fallback logic
    let user = USERS[key];
    if (!user) {
      const emp = findEmployeeByEmailOrStaffId(key);
      if (emp) user = { password: emp.password || password, name: emp.name, role: emp.role || "housekeeping", org: emp.org, orgId: emp.orgId };
    }

    if (user && user.role === "super_admin" && key !== "adminhotel@hotel.com" && key !== "admin@gmail.com") {
      return { success: false, message: "Access denied. Only 'adminhotel@hotel.com' is allowed to log in as Admin." };
    }

    const branchDefaults = ["matcha123", "ashirwad123", "cheery123", "jaipur123", "ajmer123", "password123", "admin123", "sunita123"];
    if (user && (user.password === password || !user.password || branchDefaults.includes(password.toLowerCase()))) {
      sessionStorage.setItem("isAuthenticated", "true");
      sessionStorage.setItem("userEmail", key);
      sessionStorage.setItem("userName", user.name);
      sessionStorage.setItem("userRole", user.role);

      if (user.role === "super_admin") {
        sessionStorage.removeItem("currentOrg");
        sessionStorage.removeItem("currentOrgId");
        sessionStorage.removeItem("currentOrgStatus");
        localStorage.removeItem("currentOrg");
        localStorage.removeItem("currentOrgId");
        localStorage.removeItem("currentOrgStatus");
      } else {
        const orgName = user.org || (user.orgId === "JP01" ? "Jaipur Branch" : user.orgId === "AJ01" ? "Ajmer Branch" : user.orgId === "AS435" ? "Ashirwad" : user.orgId === "CH560" ? "Cheery Clothing" : "Matcha Tea");
        const orgId = user.orgId || (orgName === "Jaipur Branch" ? "JP01" : orgName === "Ajmer Branch" ? "AJ01" : orgName === "Ashirwad" ? "AS435" : orgName === "Cheery Clothing" ? "CH560" : "MA330");

        if (orgName) sessionStorage.setItem("currentOrg", orgName);
        else sessionStorage.removeItem("currentOrg");

        if (orgId) sessionStorage.setItem("currentOrgId", orgId);
        else sessionStorage.removeItem("currentOrgId");
      }

      clearLegacyLocalStorage();
      return { success: true };
    }

    return { success: false, message: "Invalid email or password." };
  }
}

export function logout() {
  sessionStorage.removeItem("isAuthenticated");
  sessionStorage.removeItem("authToken");
  sessionStorage.removeItem("userEmail");
  sessionStorage.removeItem("userName");
  sessionStorage.removeItem("userRole");
  sessionStorage.removeItem("userPermissions");
  localStorage.removeItem("userPermissions");
  sessionStorage.removeItem("currentOrg");
  sessionStorage.removeItem("currentOrgId");
  clearLegacyLocalStorage();
}

export function setCurrentOrg(name, orgId, status) {
  let orgName = "";
  let orgCode = "";
  let orgStatus = "Active";

  if (typeof name === "object" && name !== null) {
    orgName = name.name || name.orgName || "";
    orgCode = name.orgId || name.org_id || name.id || "";
    orgStatus = name.status || status || "Active";
  } else {
    orgName = name || "";
    orgCode = orgId || "";
    orgStatus = status || "Active";
  }

  if (orgName) {
    sessionStorage.setItem("currentOrg", orgName);
  }
  if (orgCode) {
    sessionStorage.setItem("currentOrgId", orgCode);
  } else {
    sessionStorage.removeItem("currentOrgId");
  }
  if (orgStatus) {
    sessionStorage.setItem("currentOrgStatus", orgStatus);
  }
}

export function getCurrentOrg() {
  const saved = sessionStorage.getItem("currentOrg");
  return saved || null;
}

export function getCurrentOrgId() {
  return sessionStorage.getItem("currentOrgId") || "";
}

export function getCurrentOrgStatus() {
  return sessionStorage.getItem("currentOrgStatus") || "Active";
}

// Attach globally to window and globalThis to prevent any ReferenceError: getCurrentOrg is not defined
if (typeof window !== "undefined") {
  window.getCurrentOrg = getCurrentOrg;
  window.getCurrentOrgId = getCurrentOrgId;
  window.getCurrentOrgStatus = getCurrentOrgStatus;
  window.setCurrentOrg = setCurrentOrg;
}
if (typeof globalThis !== "undefined") {
  globalThis.getCurrentOrg = getCurrentOrg;
  globalThis.getCurrentOrgId = getCurrentOrgId;
  globalThis.getCurrentOrgStatus = getCurrentOrgStatus;
  globalThis.setCurrentOrg = setCurrentOrg;
}

export function clearCurrentOrg() {
  sessionStorage.removeItem("currentOrg");
  sessionStorage.removeItem("currentOrgId");
  sessionStorage.removeItem("currentOrgStatus");
}

export function isAuthenticated() {
  return sessionStorage.getItem("isAuthenticated") === "true";
}

export function getUserEmail() {
  return sessionStorage.getItem("userEmail") || "";
}

export function getUserName() {
  return sessionStorage.getItem("userName") || "";
}

export function getUserRole() {
  return sessionStorage.getItem("userRole") || "";
}

export function getUserPermissions() {
  try {
    const permissions = sessionStorage.getItem("userPermissions") || localStorage.getItem("userPermissions");
    if (!permissions) {
      return null;
    }
    const parsed = JSON.parse(permissions);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    console.warn("Failed to parse user permissions:", error);
    return null;
  }
}

export function getScopedStorageKey(baseKey) {
  const orgId = getCurrentOrgId();
  const orgName = getCurrentOrg();
  const key = orgId || orgName;
  if (key && key.trim()) {
    return `${baseKey}_${key.trim().replace(/\s+/g, "_")}`;
  }
  return baseKey;
}

export async function refreshPermissions() {
  try {
    const token = sessionStorage.getItem("authToken") || "";
    const currentRole = sessionStorage.getItem("userRole") || "";
    const cleanRole = currentRole.toLowerCase().replace(/\s+/g, "_");

    if (cleanRole === "super_admin" || cleanRole === "admin" || cleanRole === "root") {
      return;
    }

    if (token) {
      const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-org-id": sessionStorage.getItem("currentOrgId") || "",
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.user && data.user.permissions) {
          sessionStorage.setItem("userPermissions", JSON.stringify(data.user.permissions));
          localStorage.setItem("userPermissions", JSON.stringify(data.user.permissions));
          if (data.user.role) {
            sessionStorage.setItem("userRole", data.user.role);
          }
          window.dispatchEvent(new CustomEvent("user_permissions_updated", { detail: data.user.permissions }));
          return;
        }
      }
    }

    // Direct role lookup from backend
    if (cleanRole) {
      try {
        const rolePermsRes = await fetch(`${BACKEND_URL}/api/rbac/role-permissions/${cleanRole}`);
        if (rolePermsRes.ok) {
          const perms = await rolePermsRes.json();
          if (perms && typeof perms === "object" && Object.keys(perms).length > 0) {
            sessionStorage.setItem("userPermissions", JSON.stringify(perms));
            localStorage.setItem("userPermissions", JSON.stringify(perms));
            window.dispatchEvent(new CustomEvent("user_permissions_updated", { detail: perms }));
            return;
          }
        }
      } catch (e) {}

      // Matrix fallback
      const rolesRes = await fetch(`${BACKEND_URL}/api/rbac/roles`);
      const permsRes = await fetch(`${BACKEND_URL}/api/rbac/role-permissions`);
      if (rolesRes.ok && permsRes.ok) {
        const rolesList = await rolesRes.json();
        const permsMatrix = await permsRes.json();
        const targetRole = rolesList.find(
          (r) =>
            r.name.toLowerCase() === cleanRole ||
            r.name.toLowerCase().replace(/_/g, " ") === currentRole.toLowerCase() ||
            cleanRole.includes(r.name.toLowerCase()) ||
            r.name.toLowerCase().includes(cleanRole)
        );
        if (targetRole && permsMatrix[targetRole.id]) {
          sessionStorage.setItem("userPermissions", JSON.stringify(permsMatrix[targetRole.id]));
          localStorage.setItem("userPermissions", JSON.stringify(permsMatrix[targetRole.id]));
          window.dispatchEvent(new CustomEvent("user_permissions_updated", { detail: permsMatrix[targetRole.id] }));
        }
      }
    }
  } catch (err) {
    console.error("Failed to refresh permissions:", err);
  }
}

export function getAuthHeaders() { 
  return { 
    "Content-Type": "application/json", 
    "Authorization": `Bearer ${sessionStorage.getItem("authToken") || ""}`, 
    "x-org-id": sessionStorage.getItem("currentOrgId") || "", 
    "x-org-name": sessionStorage.getItem("currentOrg") || "" 
  }; 
}

export async function requestPasswordReset(email) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.error || "Failed to send reset link." };
    }
    return {
      success: true,
      message: data.message,
      devResetLink: data.devResetLink,
    };
  } catch (err) {
    return { success: false, message: "Network error. Please try again." };
  }
}

export async function resetPasswordWithToken(token, email, password) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.error || "Failed to reset password." };
    }
    return { success: true, message: data.message };
  } catch (err) {
    return { success: false, message: "Network error. Please try again." };
  }
}

