import { addNotification } from "./notificationStore.js";
import { getCurrentOrgId, getCurrentOrg, getAuthHeaders } from "../auth.js";

const API_BASE_URL = "http://localhost:4000/api/inventory";
const PO_API_URL = "http://localhost:4000/api/purchase-orders";
const MAINTENANCE_API_URL = "http://localhost:4000/api/maintenance";

// Helper to broadcast changes
function dispatchStoreChange(eventName, detail = {}) {
  try {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  } catch (e) {
    console.error("Error dispatching custom event", e);
  }
}

// ----------------------------------------------------
// 1. INVENTORY STOCK ITEMS
// ----------------------------------------------------

export function getInventoryItems() {
  return [];
}

export async function fetchInventoryItems() {
  const currentOrgId = getCurrentOrgId();
  const currentOrg = getCurrentOrg();
  const queryParam = currentOrgId ? `orgId=${encodeURIComponent(currentOrgId)}` : (currentOrg ? `org=${encodeURIComponent(currentOrg)}` : "");
  const url = queryParam ? `${API_BASE_URL}?${queryParam}` : API_BASE_URL;
  
  const res = await fetch(url, { headers: getAuthHeaders() });
  const data = await res.json();
  if (res.ok && data && Array.isArray(data.items)) {
    return data.items;
  }
  throw new Error(data.error || "Failed to fetch inventory items");
}

export async function addInventoryItem(itemData) {
  const inStockNum = parseInt(itemData.inStock, 10) || 0;
  const reorderNum = parseInt(itemData.reorderAt, 10) || 0;
  const priceNum = parseInt(String(itemData.unitPrice).replace(/\D/g, ""), 10) || 0;

  const res = await fetch(API_BASE_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      name: itemData.name,
      category: itemData.category || "Linen",
      inStock: inStockNum,
      reorderAt: reorderNum,
      unitPrice: priceNum,
      icon: itemData.icon || "📦",
      supplier: itemData.supplier || "Direct Procurement",
      description: itemData.description || "",
      sku: itemData.sku,
      orgId: getCurrentOrgId() || undefined,
      org: getCurrentOrg() || "Matcha Tea",
    }),
  });

  const data = await res.json();
  if (res.ok && data.item) {
    dispatchStoreChange("inventory_items_changed", { action: "ITEM_ADDED", item: data.item });
    return data.item;
  }
  throw new Error(data.error || "Failed to add inventory item");
}

export async function restockInventoryItem(id, qtyToAdd, supplierName = "") {
  const qty = parseInt(qtyToAdd, 10) || 0;

  const res = await fetch(`${API_BASE_URL}/${id}/restock`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ qtyToAdd: qty, supplier: supplierName }),
  });

  const data = await res.json();
  if (res.ok && data.item) {
    dispatchStoreChange("inventory_items_changed", { action: "ITEM_RESTOCKED", item: data.item });
    return data.item;
  }
  throw new Error(data.error || "Failed to restock inventory item");
}

export async function updateInventoryItem(id, itemData) {
  const inStockNum = parseInt(itemData.inStock, 10) || 0;
  const reorderNum = parseInt(itemData.reorderAt, 10) || 0;
  const priceNum = parseInt(String(itemData.unitPrice).replace(/\D/g, ""), 10) || 0;

  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      name: itemData.name,
      category: itemData.category,
      inStock: inStockNum,
      reorderAt: reorderNum,
      unitPrice: priceNum,
      supplier: itemData.supplier,
      icon: itemData.icon,
      description: itemData.description,
    }),
  });

  const data = await res.json();
  if (res.ok && data.item) {
    dispatchStoreChange("inventory_items_changed", { action: "ITEM_UPDATED", item: data.item });
    return data.item;
  }
  throw new Error(data.error || "Failed to update inventory item");
}

export async function deleteInventoryItem(id) {
  const res = await fetch(`${API_BASE_URL}/${id}`, { method: "DELETE", headers: getAuthHeaders() });
  if (res.ok) {
    dispatchStoreChange("inventory_items_changed", { action: "ITEM_DELETED", id });
    return true;
  }
  throw new Error("Failed to delete inventory item");
}

// ----------------------------------------------------
// 2. PURCHASE ORDERS (PROCUREMENT)
// ----------------------------------------------------

export function getPurchaseOrders() {
  return [];
}

export async function fetchPurchaseOrders() {
  const currentOrgId = getCurrentOrgId();
  const currentOrg = getCurrentOrg();
  const queryParam = currentOrgId ? `orgId=${encodeURIComponent(currentOrgId)}` : (currentOrg ? `org=${encodeURIComponent(currentOrg)}` : "");
  const url = queryParam ? `${PO_API_URL}?${queryParam}` : PO_API_URL;
  
  const res = await fetch(url, { headers: getAuthHeaders() });
  const data = await res.json();
  if (res.ok && data && Array.isArray(data.purchaseOrders)) {
    return data.purchaseOrders;
  }
  throw new Error(data.error || "Failed to fetch purchase orders");
}

export async function addPurchaseOrder(poData) {
  const res = await fetch(PO_API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      supplier: poData.supplier,
      category: poData.category || "General",
      itemsSummary: poData.itemsSummary,
      totalAmount: poData.totalAmount,
      expectedDelivery: poData.expectedDelivery || "3 Days",
      createdBy: poData.createdBy || "Admin User",
      linkedItemId: poData.linkedItemId || null,
      quantityToAdd: parseInt(poData.quantityToAdd, 10) || 50,
      orgId: getCurrentOrgId() || undefined,
      org: getCurrentOrg() || "Matcha Tea",
    }),
  });

  const data = await res.json();
  if (res.ok && data.purchaseOrder) {
    dispatchStoreChange("purchase_orders_changed", { action: "PO_CREATED", po: data.purchaseOrder });

    addNotification({
      user: "Procurement Desk",
      action: "issued purchase order",
      target: `${data.purchaseOrder.id} (${data.purchaseOrder.supplier})`,
      message: `📑 Purchase order ${data.purchaseOrder.id} issued for ${data.purchaseOrder.itemsSummary}.`,
      category: "Alerts",
      type: "system",
    });

    return data.purchaseOrder;
  }
  throw new Error(data.error || "Failed to create purchase order");
}

export async function receivePurchaseOrder(poId) {
  const res = await fetch(`${PO_API_URL}/${poId}/deliver`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (res.ok && data.purchaseOrder) {
    dispatchStoreChange("purchase_orders_changed", { action: "PO_DELIVERED", po: data.purchaseOrder });

    addNotification({
      user: "Inventory Receiver",
      action: "marked PO as delivered",
      target: data.purchaseOrder.id,
      message: `✅ Shipment received for ${data.purchaseOrder.id}. Stock automatically incremented!`,
      category: "Alerts",
      type: "system",
    });

    return data.purchaseOrder;
  }
  throw new Error(data.error || "Failed to receive purchase order");
}

export async function cancelPurchaseOrder(poId) {
  const res = await fetch(`${PO_API_URL}/${poId}/cancel`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });

  if (res.ok) {
    dispatchStoreChange("purchase_orders_changed", { action: "PO_CANCELLED", poId });
    return true;
  }
  throw new Error("Failed to cancel purchase order");
}

// ----------------------------------------------------
// 3. MAINTENANCE TICKETS
// ----------------------------------------------------

export function getMaintenanceTickets() {
  return [];
}

export async function fetchMaintenanceTickets() {
  const currentOrgId = getCurrentOrgId();
  const currentOrg = getCurrentOrg();
  const queryParam = currentOrgId ? `orgId=${encodeURIComponent(currentOrgId)}` : (currentOrg ? `org=${encodeURIComponent(currentOrg)}` : "");
  const url = queryParam ? `${MAINTENANCE_API_URL}?${queryParam}` : MAINTENANCE_API_URL;
  
  const res = await fetch(url, { headers: getAuthHeaders() });
  const data = await res.json();
  if (res.ok && data && Array.isArray(data.tickets)) {
    return data.tickets;
  }
  throw new Error(data.error || "Failed to fetch maintenance tickets");
}

export async function addMaintenanceTicket(ticketData) {
  const res = await fetch(MAINTENANCE_API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      roomId: ticketData.roomId || null,
      roomNumber: ticketData.roomNumber || null,
      floor: ticketData.floor || null,
      asset: ticketData.asset,
      assetType: ticketData.assetType || (ticketData.asset.startsWith("Room") ? "Room" : "Custom"),
      category: ticketData.category || "General",
      issue: ticketData.issue,
      assignedTo: ticketData.assignedTo || "Eng. Ravi Sharma",
      priority: ticketData.priority || "Medium",
      reportedBy: ticketData.reportedBy || "Admin Desk",
      orgId: getCurrentOrgId() || undefined,
      org: getCurrentOrg() || "Matcha Tea",
    }),
  });

  const data = await res.json();
  if (res.ok && data.ticket) {
    dispatchStoreChange("maintenance_tickets_changed", { action: "TICKET_ADDED", ticket: data.ticket });

    addNotification({
      user: "Maintenance System",
      action: "logged maintenance ticket",
      target: `${data.ticket.id} (${data.ticket.asset})`,
      message: `🔧 Ticket ${data.ticket.id} logged for ${data.ticket.asset}.`,
      category: "Alerts",
      type: "system",
    });

    return data.ticket;
  }
  throw new Error(data.error || "Failed to create maintenance ticket");
}

export async function updateMaintenanceTicketStatus(ticketId, newStatus) {
  const res = await fetch(`${MAINTENANCE_API_URL}/${encodeURIComponent(ticketId)}/status`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status: newStatus }),
  });

  const data = await res.json();
  if (res.ok && data.ticket) {
    dispatchStoreChange("maintenance_tickets_changed", { action: "TICKET_STATUS_UPDATED", ticketId, newStatus });
    return data.ticket;
  }
  throw new Error(data.error || "Failed to update maintenance ticket status");
}

export async function updateMaintenanceTicket(ticketId, ticketData) {
  const res = await fetch(`${MAINTENANCE_API_URL}/${encodeURIComponent(ticketId)}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      roomId: ticketData.roomId || null,
      roomNumber: ticketData.roomNumber || null,
      floor: ticketData.floor || null,
      asset: ticketData.asset,
      assetType: ticketData.assetType || (ticketData.asset?.startsWith("Room") ? "Room" : "Custom"),
      category: ticketData.category,
      issue: ticketData.issue,
      assignedTo: ticketData.assignedTo,
      priority: ticketData.priority,
      status: ticketData.status,
    }),
  });

  const data = await res.json();
  if (res.ok && data.ticket) {
    dispatchStoreChange("maintenance_tickets_changed", { action: "TICKET_UPDATED", ticket: data.ticket });
    return data.ticket;
  }
  throw new Error(data.error || "Failed to update maintenance ticket");
}

export async function deleteMaintenanceTicket(ticketId) {
  const res = await fetch(`${MAINTENANCE_API_URL}/${encodeURIComponent(ticketId)}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (res.ok) {
    dispatchStoreChange("maintenance_tickets_changed", { action: "TICKET_DELETED", ticketId });
    return true;
  }
  throw new Error("Failed to delete maintenance ticket");
}

// ----------------------------------------------------
// 4. INVENTORY TASKS & SUBSCRIPTIONS
// ----------------------------------------------------

export function getInventoryTasks() {
  return [];
}

export function addInventoryTask(taskData) {
  // Inventory tasks have no backend API table in this version.
  // We ignore it to prevent fake local data creation.
  return null;
}

export function subscribeInventory(callback) {
  const handleEvent = async () => {
    // Only dispatch an event to trigger a refetch in the components.
    // The components should ideally fetch the fresh data.
    callback({
      items: [],
      pos: [],
      tickets: [],
      tasks: []
    });
  };

  window.addEventListener("inventory_items_changed", handleEvent);
  window.addEventListener("purchase_orders_changed", handleEvent);
  window.addEventListener("maintenance_tickets_changed", handleEvent);

  return () => {
    window.removeEventListener("inventory_items_changed", handleEvent);
    window.removeEventListener("purchase_orders_changed", handleEvent);
    window.removeEventListener("maintenance_tickets_changed", handleEvent);
  };
}

export function subscribeInventoryTasks(callback) {
  return () => {};
}
