import { getCurrentOrgId } from "../auth.js";
const API_BASE = "http://localhost:4000/api/payroll";

function getHeaders() {
  const token = sessionStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchPayrollFromAPI() {
  try {
    const orgId = getCurrentOrgId();
    const res = await fetch(`${API_BASE}?orgId=${orgId}`, { headers: getHeaders() });
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.records)) {
      return data.records;
    }
  } catch (err) {
    console.warn("Backend API /api/payroll unreachable:", err);
  }
  return null;
}

export async function markPayrollAsPaidAPI(payrollId, status, paymentDate) {
  try {
    const orgId = getCurrentOrgId();
    const res = await fetch(`${API_BASE}/${payrollId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ status, paymentDate, orgId })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return data.success;
    }
  } catch (err) {
    console.warn("Backend API error on pay payroll:", err);
  }
  return null;
}
