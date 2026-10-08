import { getCurrentOrgId } from "../auth.js";

const API_BASE = "http://localhost:4000/api/offers";

export const INITIAL_OFFERS = [];

export function getOffers() {
  return [];
}

export async function fetchOffersFromAPI() {
  const orgId = getCurrentOrgId();
  const url = orgId ? `${API_BASE}?orgId=${encodeURIComponent(orgId)}` : API_BASE;
  const token = sessionStorage.getItem("authToken") || localStorage.getItem("authToken") || "";
  
  const res = await fetch(url, {
    headers: { Authorization: token ? `Bearer ${token}` : "" }
  });
  if (res.ok) {
    const data = await res.json();
    return Array.isArray(data) ? data : (data.offers || []);
  }
  
  const errData = await res.json().catch(() => ({}));
  throw new Error(errData.error || "Failed to fetch offers from API");
}

export async function addOfferToAPI(offerData) {
  const orgId = getCurrentOrgId();
  const token = sessionStorage.getItem("authToken") || localStorage.getItem("authToken") || "";
  
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : ""
    },
    body: JSON.stringify({ ...offerData, orgId })
  });
  
  if (res.ok) {
    const data = await res.json();
    return data.offer || data;
  }
  
  const errData = await res.json().catch(() => ({}));
  throw new Error(errData.error || "Failed to add offer to API");
}

export async function updateOfferInAPI(id, updatedData) {
  const token = sessionStorage.getItem("authToken") || localStorage.getItem("authToken") || "";
  
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : ""
    },
    body: JSON.stringify(updatedData)
  });
  
  if (res.ok) {
    const data = await res.json();
    return data.offer || data;
  }
  
  const errData = await res.json().catch(() => ({}));
  throw new Error(errData.error || "Failed to update offer in API");
}

export async function deleteOfferFromAPI(id) {
  const token = sessionStorage.getItem("authToken") || localStorage.getItem("authToken") || "";
  
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": token ? `Bearer ${token}` : ""
    }
  });
  
  if (res.ok) {
    return true;
  }
  
  const errData = await res.json().catch(() => ({}));
  throw new Error(errData.error || "Failed to delete offer from API");
}

// Stubs for deprecated local store logic
export function saveOffers() { console.warn("saveOffers is deprecated."); }
export function addOffer() { throw new Error("Local addOffer is deprecated. Use addOfferToAPI."); }
export function updateOffer() { throw new Error("Local updateOffer is deprecated. Use updateOfferInAPI."); }
export function deleteOffer() { throw new Error("Local deleteOffer is deprecated. Use deleteOfferFromAPI."); }

// Pub/Sub stub
export function subscribeOffers() { return () => {}; }
