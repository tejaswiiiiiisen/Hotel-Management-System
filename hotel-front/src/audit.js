import { getUserName, getUserRole, getScopedStorageKey } from "./auth.js";

const BASE_KEY = "auditLog_v2";

function getStorageKey() {
  return getScopedStorageKey(BASE_KEY);
}

const SEED = [
  {
    id: "a-seed-1",
    date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    time: "09:30:00",
    user: "Anil (Front Desk)",
    role: "front_desk",
    userColor: "#16a34a",
    action: "Logged in",
    target: "to Admin Dashboard",
    type: "login",
  },
  {
    id: "a-seed-2",
    date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    time: "10:15:22",
    user: "Rajesh Manager",
    role: "manager",
    userColor: "#0284c7",
    action: "Cancelled booking",
    target: "#B-1039",
    type: "query",
  },
];

function load() {
  try {
    const key = getStorageKey();
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore corrupt data */
  }
  const key = getStorageKey();
  localStorage.setItem(key, JSON.stringify(SEED));
  return [...SEED];
}

export function getAuditLog() {
  return load();
}

export function logAction(action, target = "", type = "info") {
  const role = getUserRole() || "";
  let userColor = "#64748b";
  if (role === "super_admin") userColor = "#0284c7";
  else if (role === "manager") userColor = "#ca8a04";
  else if (role === "front_desk") userColor = "#16a34a";

  const entry = {
    id: `a-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    time: new Date().toTimeString().slice(0, 8),
    user: getUserName() || "Unknown",
    role,
    userColor,
    action,
    target,
    type, // 'login', 'settings', 'permission', 'query', 'info'
  };

  const next = [entry, ...load()];
  const key = getStorageKey();
  localStorage.setItem(key, JSON.stringify(next));
  return entry;
}

