import { getAuthHeaders } from "../auth.js";

const BASE_URL = "http://localhost:4000/api/audit-logs";

export async function fetchAuditLogs(filters = {}) {
  try {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) query.append(key, value);
    }

    const res = await fetch(`${BASE_URL}?${query.toString()}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Error fetching audit logs: ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.error("fetchAuditLogs error:", err);
    return { success: false, data: [], total: 0 };
  }
}
