import { logAction } from "../audit.js";
import { getCurrentOrgId, getCurrentOrg } from "../auth.js";

const API_BASE = "http://localhost:4000/api/customers";

// Stub for legacy synchronous calls (returns empty to prevent crashes before components mount API)
export function getCustomers() {
  return [];
}

export async function fetchCustomersFromAPI(overrideOrgId) {
  try {
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      return { authError: true, message: "Missing token" };
    }
    
    const orgId = overrideOrgId || getCurrentOrgId();
    const url = orgId ? `${API_BASE}?org_id=${encodeURIComponent(orgId)}` : API_BASE;
    const res = await fetch(url, {
      headers: { 
        "x-org-id": orgId || "",
        "Authorization": `Bearer ${token}` 
      }
    });

    if (res.status === 401 || res.status === 403) {
       const data = await res.json().catch(() => ({}));
       return { authError: true, message: data.error || data.message || "Unauthorized" };
    }

    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.customers)) {
      return data.customers;
    }
    console.warn("Failed to fetch customers:", data.error);
    return [];
  } catch (err) {
    console.warn("fetchCustomersFromAPI network/auth error:", err.message);
    return [];
  }
}

export async function addCustomerToAPI(newGuest) {
  const currentOrgId = getCurrentOrgId();
  const currentOrgName = getCurrentOrg();
  const payload = {
    orgId: newGuest.orgId || currentOrgId,
    orgName: newGuest.orgName || currentOrgName,
    ...newGuest,
  };
  
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-org-id": currentOrgId || "",
      "Authorization": `Bearer ${sessionStorage.getItem("authToken") || ""}` 
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (res.ok && data.success && data.customer) {
    logAction(`Registered new guest ${data.customer.name} (${data.customer.id}) via API`, "Customer");
    return await fetchCustomersFromAPI();
  }
  throw new Error(data.error || "Failed to add customer via API");
}

export async function updateCustomerAPI(customerId, updatedData) {
  const currentOrgId = getCurrentOrgId();
  const res = await fetch(`${API_BASE}/${customerId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-org-id": currentOrgId || "",
      "Authorization": `Bearer ${sessionStorage.getItem("authToken") || ""}`,
    },
    body: JSON.stringify(updatedData),
  });
  const data = await res.json();
  if (res.ok && data.success && data.customer) {
    logAction(`Updated details for customer ${data.customer.name} (${customerId}) via API`, "Customer");
    const updatedList = await fetchCustomersFromAPI();
    return { success: true, customers: updatedList, customer: data.customer };
  }
  throw new Error(data.error || "Failed to update customer via API");
}

export async function updatePaymentStatusAPI(customerId, status = "Paid") {
  const currentOrgId = getCurrentOrgId();
  const res = await fetch(`${API_BASE}/${customerId}/payment`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      "x-org-id": currentOrgId || "",
      "Authorization": `Bearer ${sessionStorage.getItem("authToken") || ""}` 
    },
    body: JSON.stringify({ paymentStatus: status }),
  });
  const data = await res.json();
  if (res.ok && data.success && data.customer) {
    logAction(`Payment status marked as ${status} for customer ${customerId} via API`, "Billing");
    return await fetchCustomersFromAPI();
  }
  throw new Error(data.error || "Failed to update payment status via API");
}

export async function uploadDocumentAPI(customerId, docType, file) {
  const currentOrgId = getCurrentOrgId();
  const formData = new FormData();
  formData.append("docType", docType || "Aadhaar Card");
  if (file) {
    formData.append("document", file);
  }

  const res = await fetch(`${API_BASE}/${customerId}/document`, {
    method: "POST",
    headers: { 
      "x-org-id": currentOrgId || "",
      "Authorization": `Bearer ${sessionStorage.getItem("authToken") || ""}` 
    },
    body: formData,
  });
  const data = await res.json();
  if (res.ok && data.success && data.customer) {
    logAction(`Uploaded ${docType} for customer ${customerId} via API`, "Customer");
    return await fetchCustomersFromAPI();
  }
  throw new Error(data.error || "Failed to upload document via API");
}

export async function deleteCustomerFromAPI(customerId) {
  const currentOrgId = getCurrentOrgId();
  const res = await fetch(`${API_BASE}/${customerId}`, {
    method: "DELETE",
    headers: { 
      "x-org-id": currentOrgId || "",
      "Authorization": `Bearer ${sessionStorage.getItem("authToken") || ""}` 
    },
  });
  const data = await res.json();
  if (res.ok && data.success) {
    logAction(`Deleted customer ${customerId} via API`, "Customer");
    return await fetchCustomersFromAPI();
  }
  throw new Error(data.error || "Failed to delete customer via API");
}

export async function updateCustomerStatusAPI(customerId, status) {
  const currentOrgId = getCurrentOrgId();
  const res = await fetch(`${API_BASE}/${customerId}/status`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      "x-org-id": currentOrgId || "",
      "Authorization": `Bearer ${sessionStorage.getItem("authToken") || ""}` 
    },
    credentials: "include",
    body: JSON.stringify({ status })
  });
  const data = await res.json();
  if (res.ok && data.success) {
    logAction(`Customer ${customerId} status updated to ${status} via API`, "Customer");
    return await fetchCustomersFromAPI();
  }
  throw new Error(data.error || "Failed to update customer status");
}

export async function updateCustomerPaymentAPI(customerId, paymentStatus, amount = 0) {
  const currentOrgId = getCurrentOrgId();
  const res = await fetch(`${API_BASE}/${customerId}/payment`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      "x-org-id": currentOrgId || "",
      "Authorization": `Bearer ${sessionStorage.getItem("authToken") || ""}` 
    },
    credentials: "include",
    body: JSON.stringify({ paymentStatus, amount })
  });
  const data = await res.json();
  if (res.ok && data.success) {
    logAction(`Customer ${customerId} payment updated to ${paymentStatus} via API`, "Payment");
    return await fetchCustomersFromAPI();
  }
  throw new Error(data.error || "Failed to update customer payment");
}

// ----------------------------------------------------
// LEGACY STUBS (To prevent synchronous UI crashes during transition)
// These should ideally be removed from components and replaced with async API calls.
// ----------------------------------------------------

export function saveCustomers() { console.warn("saveCustomers is deprecated. Use API methods."); }
export function addCustomer() { throw new Error("Local addCustomer is deprecated. Use addCustomerToAPI."); }
export function updateCustomerInStore() { throw new Error("Local updateCustomerInStore is deprecated. Use updateCustomerAPI."); }
export function deleteCustomer() { throw new Error("Local deleteCustomer is deprecated. Use deleteCustomerFromAPI."); }
export function updateCustomerDocumentInStore() { throw new Error("Local updateCustomerDocumentInStore is deprecated. Use uploadDocumentAPI."); }
export function updateCustomerPaymentInStore() { throw new Error("Local updateCustomerPaymentInStore is deprecated. Use updatePaymentStatusAPI."); }
export function syncCustomerFromBooking() { console.warn("syncCustomerFromBooking is deprecated. Customer should be created via backend booking flow."); }
