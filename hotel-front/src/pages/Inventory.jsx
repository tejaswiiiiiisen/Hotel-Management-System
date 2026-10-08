import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import Maintenance from "./Maintenance.jsx";
import "./Inventory.css";
import {
  getInventoryItems,
  fetchInventoryItems,
  addInventoryItem,
  updateInventoryItem,
  restockInventoryItem,
  deleteInventoryItem,
  getPurchaseOrders,
  fetchPurchaseOrders,
  addPurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
  subscribeInventory,
} from "../services/inventoryStore.js";
import { registeredSuppliers } from "../data/dummyData/index.js";
import {
  FaBoxes,
  FaPlus,
  FaSearch,
  FaCheckCircle,
  FaThLarge,
  FaList,
  FaWrench,
  FaTimes,
  FaFileInvoiceDollar,
  FaTrash,
  FaCheck,
  FaTruck,
  FaBan,
  FaEdit,
} from "react-icons/fa";

export default function Inventory() {
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get("tab");
  const initialTab = urlTab === "maintenance" ? "maintenance" : urlTab === "procurement" ? "procurement" : "inventory";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Realtime Data from Store / LocalStorage
  const [items, setItems] = useState(getInventoryItems);
  const [purchaseOrders, setPurchaseOrders] = useState(getPurchaseOrders);

  // Search & Filters for Inventory
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("grid");

  // Search & Filters for Procurement
  const [poSearch, setPoSearch] = useState("");
  const [poStatusFilter, setPoStatusFilter] = useState("All");
  const [poViewMode, setPoViewMode] = useState("list");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddPOModalOpen, setIsAddPOModalOpen] = useState(false);
  const [isAddMaintenanceModalOpen, setIsAddMaintenanceModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedPO, setSelectedPO] = useState(null);

  // Edit Item Modal state
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "Linen",
    inStock: "",
    reorderAt: "",
    unitPrice: "",
    icon: "📦",
    supplier: "Trident Linens Pvt Ltd",
    description: "",
  });

  function openEditModal(item) {
    setEditItem(item);
    setEditForm({
      name: item.name || "",
      category: item.category || "Linen",
      inStock: item.inStock !== undefined ? String(item.inStock) : "",
      reorderAt: item.reorderAt !== undefined ? String(item.reorderAt) : "",
      unitPrice: item.unitPrice ? String(item.unitPrice).replace(/\D/g, "") : "",
      icon: item.icon || "📦",
      supplier: item.supplier || "Trident Linens Pvt Ltd",
      description: item.description || "",
    });
  }

  async function handleUpdateStockItem(e) {
    e.preventDefault();
    if (!editItem || !editForm.name) return;
    await updateInventoryItem(editItem.id, editForm);
    setItems(getInventoryItems());
    setEditItem(null);
  }

  const [restockItem, setRestockItem] = useState(null);
  const [restockQty, setRestockQty] = useState(50);
  const [restockSupplier, setRestockSupplier] = useState("");
  const [restockSuccess, setRestockSuccess] = useState(false);

  // Drilldown modals ('valuation' | 'categories' for inventory; 'suppliers' | 'spend' for POs)
  const [summaryModal, setSummaryModal] = useState(null);
  const [poSummaryModal, setPoSummaryModal] = useState(null);

  // New Item Form State
  const [newItem, setNewItem] = useState({
    name: "",
    category: "Linen",
    inStock: "",
    reorderAt: "",
    unitPrice: "",
    icon: "📦",
    supplier: "Trident Linens Pvt Ltd",
    description: "",
  });

  // New PO Form State
  const [newPO, setNewPO] = useState({
    supplier: "Trident Linens Pvt Ltd",
    category: "Linen",
    linkedItemId: "",
    itemsSummary: "",
    quantityToAdd: "50",
    totalAmount: "5000",
    expectedDelivery: "3 Days",
  });

  // Sync with store & backend API with real-time polling
  useEffect(() => {
    async function loadBackendData() {
      const freshItems = await fetchInventoryItems();
      if (freshItems && Array.isArray(freshItems)) {
        setItems(freshItems);
      }
      const freshPOs = await fetchPurchaseOrders();
      if (freshPOs && Array.isArray(freshPOs)) {
        setPurchaseOrders(freshPOs);
      }
    }

    loadBackendData();

    // 5-second interval for real-time updates from backend
    const intervalId = setInterval(loadBackendData, 5000);

    const unsubscribe = subscribeInventory(() => {
      setItems(getInventoryItems());
      setPurchaseOrders(getPurchaseOrders());
    });

    return () => {
      clearInterval(intervalId);
      unsubscribe();
    };
  }, []);

  // Ensure stock item dropdown in Issue Purchase Order modal is 100% synced with backend database on modal open
  useEffect(() => {
    if (isAddPOModalOpen) {
      fetchInventoryItems().then((freshItems) => {
        if (freshItems && Array.isArray(freshItems)) {
          setItems(freshItems);
        }
      });
    }
  }, [isAddPOModalOpen]);

  // Realtime Backend Handlers for KPI Summary Cards
  async function handleViewCategoriesClick() {
    setSummaryModal("categories");
    const freshItems = await fetchInventoryItems();
    if (freshItems && Array.isArray(freshItems)) {
      setItems(freshItems);
    }
  }

  async function handleLowStockAlertsClick() {
    setStatusFilter(statusFilter === "Low Stock" ? "All" : "Low Stock");
    const freshItems = await fetchInventoryItems();
    if (freshItems && Array.isArray(freshItems)) {
      setItems(freshItems);
    }
  }

  async function handleFinancialAuditClick() {
    setSummaryModal("valuation");
    const freshItems = await fetchInventoryItems();
    if (freshItems && Array.isArray(freshItems)) {
      setItems(freshItems);
    }
  }

  // Realtime Backend Handlers for Procurement KPI Summary Cards
  async function handleVendorAuditClick() {
    setPoSummaryModal("suppliers");
    const freshPOs = await fetchPurchaseOrders();
    if (freshPOs && Array.isArray(freshPOs)) {
      setPurchaseOrders(freshPOs);
    }
  }

  async function handleFilterActivePOsClick() {
    setPoStatusFilter(poStatusFilter === "Ordered" ? "All" : "Ordered");
    const freshPOs = await fetchPurchaseOrders();
    if (freshPOs && Array.isArray(freshPOs)) {
      setPurchaseOrders(freshPOs);
    }
  }

  async function handlePOFinancialAuditClick() {
    setPoSummaryModal("spend");
    const freshPOs = await fetchPurchaseOrders();
    if (freshPOs && Array.isArray(freshPOs)) {
      setPurchaseOrders(freshPOs);
    }
  }

  // Open Issue Purchase Order modal and sync stock items from backend real-time
  async function openCreatePOModal() {
    setIsAddPOModalOpen(true);
    const freshItems = await fetchInventoryItems();
    if (freshItems && Array.isArray(freshItems)) {
      setItems(freshItems);
    }
  }

  // Update PO category/supplier automatically when linked item changes
  function handlePOLinkedItemChange(itemId) {
    const targetItem = items.find((i) => String(i.id) === String(itemId));
    if (targetItem) {
      setNewPO((prev) => ({
        ...prev,
        linkedItemId: targetItem.id,
        category: targetItem.category,
        supplier: targetItem.supplier || prev.supplier,
        itemsSummary: `${targetItem.name} (${prev.quantityToAdd || 50} Units)`,
      }));
    } else {
      setNewPO((prev) => ({ ...prev, linkedItemId: "" }));
    }
  }

  // Handle Inventory Restock
  async function openRestockModal(item) {
    setRestockItem(item);
    setRestockQty(item.reorderAt ? item.reorderAt * 2 : 50);
    setRestockSupplier(item.supplier || "Primary Vendor");
    setRestockSuccess(false);
  }

  async function handleConfirmRestock(e) {
    e.preventDefault();
    if (!restockItem) return;
    const qty = parseInt(restockQty, 10) || 50;
    await restockInventoryItem(restockItem.id, qty, restockSupplier);
    const freshItems = await fetchInventoryItems();
    setItems(freshItems || getInventoryItems());
    setRestockSuccess(true);
    setTimeout(() => {
      setRestockItem(null);
      setRestockSuccess(false);
    }, 1000);
  }

  // Delete Stock Item
  async function handleDeleteItem(id) {
    await deleteInventoryItem(id);
    const freshItems = await fetchInventoryItems();
    setItems(freshItems || getInventoryItems());
    if (selectedItem && selectedItem.id === id) {
      setSelectedItem(null);
    }
  }

  // Add Stock Item
  async function handleAddStockItem(e) {
    e.preventDefault();
    if (!newItem.name || !newItem.inStock || !newItem.unitPrice) return;
    await addInventoryItem(newItem);
    const freshItems = await fetchInventoryItems();
    setItems(freshItems || getInventoryItems());
    setIsAddModalOpen(false);
    setNewItem({
      name: "",
      category: "Linen",
      inStock: "",
      reorderAt: "",
      unitPrice: "",
      icon: "📦",
      supplier: "Trident Linens Pvt Ltd",
      description: "",
    });
  }

  // Create Purchase Order
  async function handleCreatePO(e) {
    e.preventDefault();
    if (!newPO.supplier || !newPO.itemsSummary || !newPO.totalAmount) return;
    await addPurchaseOrder(newPO);
    const freshPOs = await fetchPurchaseOrders();
    setPurchaseOrders(freshPOs || getPurchaseOrders());
    setIsAddPOModalOpen(false);
    setNewPO({
      supplier: "Trident Linens Pvt Ltd",
      category: "Linen",
      linkedItemId: "",
      itemsSummary: "",
      quantityToAdd: "50",
      totalAmount: "5000",
      expectedDelivery: "3 Days",
    });
  }

  // Receive Purchase Order (Automatically increments stock)
  async function handleReceivePO(poId) {
    await receivePurchaseOrder(poId);
    const freshPOs = await fetchPurchaseOrders();
    const freshItems = await fetchInventoryItems();
    setPurchaseOrders(freshPOs || getPurchaseOrders());
    setItems(freshItems || getInventoryItems());
    if (selectedPO && selectedPO.id === poId) {
      setSelectedPO((prev) => ({ ...prev, status: "Delivered", statusBg: "#dcfce7", statusColor: "#15803d" }));
    }
  }

  // Cancel Purchase Order
  async function handleCancelPO(poId) {
    await cancelPurchaseOrder(poId);
    const freshPOs = await fetchPurchaseOrders();
    setPurchaseOrders(freshPOs || getPurchaseOrders());
    if (selectedPO && selectedPO.id === poId) {
      setSelectedPO((prev) => ({ ...prev, status: "Cancelled", statusBg: "#fee2e2", statusColor: "#b91c1c" }));
    }
  }

  // Filtered Stock Items
  const filteredItems = items.filter((item) => {
    const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Low Stock" && item.inStock < item.reorderAt) ||
      (statusFilter === "OK" && item.inStock >= item.reorderAt);
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesStatus && matchesSearch;
  });

  // Filtered POs
  const filteredPOs = purchaseOrders.filter((po) => {
    const matchesStatus =
      poStatusFilter === "All"
        ? true
        : poStatusFilter === "Ordered"
          ? po.status === "Ordered" || po.status === "Pending Approval" || po.status === "Pending"
          : po.status.toLowerCase() === poStatusFilter.toLowerCase();
    const matchesSearch =
      po.id.toLowerCase().includes(poSearch.toLowerCase()) ||
      po.supplier.toLowerCase().includes(poSearch.toLowerCase()) ||
      po.itemsSummary.toLowerCase().includes(poSearch.toLowerCase()) ||
      po.category.toLowerCase().includes(poSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Summary Metrics
  const lowStockCount = items.filter((i) => i.inStock < i.reorderAt).length;
  const totalValuation = items.reduce((acc, item) => {
    const val = parseInt(String(item.totalValue || "").replace(/\D/g, ""), 10) ||
      ((Number(item.inStock) || 0) * (parseInt(String(item.unitPrice || "").replace(/\D/g, ""), 10) || 0));
    return acc + val;
  }, 0);

  const pendingPOCount = purchaseOrders.filter((po) => po.status === "Ordered" || po.status === "Pending Approval" || po.status === "Pending").length;
  const totalPOSpend = purchaseOrders.reduce((acc, po) => {
    const val = parseInt(String(po.totalAmount || "").replace(/\D/g, ""), 10) || 0;
    return acc + val;
  }, 0);

  // Category breakdown for summary modal
  const categoryStats = items.reduce((acc, curr) => {
    const val = parseInt(String(curr.totalValue || "").replace(/\D/g, ""), 10) ||
      ((Number(curr.inStock) || 0) * (parseInt(String(curr.unitPrice || "").replace(/\D/g, ""), 10) || 0));
    const catKey = (curr.category || "General").trim();
    if (!acc[catKey]) {
      acc[catKey] = { count: 0, val: 0 };
    }
    acc[catKey].count += 1;
    acc[catKey].val += val;
    return acc;
  }, {});

  // Supplier breakdown for Procurement summary modal
  const poSupplierStats = purchaseOrders.reduce((acc, curr) => {
    const val = parseInt(String(curr.totalAmount).replace(/\D/g, ""), 10) || 0;
    if (!acc[curr.supplier]) {
      acc[curr.supplier] = { count: 0, val: 0, pending: 0 };
    }
    acc[curr.supplier].count += 1;
    acc[curr.supplier].val += val;
    if (curr.status === "Ordered" || curr.status === "Pending Approval" || curr.status === "Pending") {
      acc[curr.supplier].pending += 1;
    }
    return acc;
  }, {});

  // Category spend breakdown for Procurement summary modal
  const poCategoryStats = purchaseOrders.reduce((acc, curr) => {
    const val = parseInt(String(curr.totalAmount).replace(/\D/g, ""), 10) || 0;
    const cat = curr.category || "General";
    if (!acc[cat]) {
      acc[cat] = { count: 0, val: 0 };
    }
    acc[cat].count += 1;
    acc[cat].val += val;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title={
          activeTab === "inventory"
            ? "Inventory & Consumables"
            : activeTab === "procurement"
              ? "Purchase Orders & Procurement"
              : "Maintenance & Assets"
        }
        subtitle={
          activeTab === "inventory"
            ? "Track hotel consumable items, stock balances, reorder thresholds, and valuations"
            : activeTab === "procurement"
              ? "Manage vendor purchase orders, procurement workflows, and automated stock receipts"
              : "Track non-housekeeping issues (AC, plumbing, electrical, furniture) with Grid & List views"
        }
        action={
          activeTab === "inventory" ? (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#ffffff",
                padding: "10px 20px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "700",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(102, 126, 234, 0.4)",
              }}
            >
              <FaPlus /> Add Stock Item
            </button>
          ) : activeTab === "procurement" ? (
            <button
              type="button"
              onClick={openCreatePOModal}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#ffffff",
                padding: "10px 20px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "700",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(102, 126, 234, 0.4)",
              }}
            >
              <FaPlus /> Create Purchase Order
            </button>
          ) : activeTab === "maintenance" ? (
            <button
              type="button"
              onClick={() => setIsAddMaintenanceModalOpen(true)}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#ffffff",
                padding: "10px 20px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "700",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(102, 126, 234, 0.4)",
                whiteSpace: "nowrap",
              }}
            >
              <FaPlus /> Log Ticket
            </button>
          ) : null
        }
      />

      {/* TOP TAB NAVIGATION BAR */}
      <div className="inv-tabs-navigation">
        <button
          type="button"
          className={`inv-tab-btn ${activeTab === "inventory" ? "active" : ""}`}
          onClick={() => setActiveTab("inventory")}
        >
          <FaBoxes /> Stock & Consumables
        </button>

        <button
          type="button"
          className={`inv-tab-btn ${activeTab === "procurement" ? "active" : ""}`}
          onClick={() => setActiveTab("procurement")}
        >
          <FaFileInvoiceDollar /> Purchase Orders & Procurement
        </button>

        <button
          type="button"
          className={`inv-tab-btn ${activeTab === "maintenance" ? "active" : ""}`}
          onClick={() => setActiveTab("maintenance")}
        >
          <FaWrench /> Maintenance & Assets
        </button>
      </div>

      {/* SUB-TAB 1: INVENTORY & CONSUMABLES */}
      {activeTab === "inventory" && (
        <section className="inv-panel">
          {/* SUMMARY KPI CARDS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div
              className="inv-stat-card total clickable"
              onClick={handleViewCategoriesClick}
              title="Click to view real-time Category Valuation Breakdown from Backend"
              style={{ cursor: "pointer" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: "600" }}>Total Inventory Items</span>
                <span style={{ fontSize: "11px", color: "#6366f1", fontWeight: "700" }}>View Categories</span>
              </div>
              <div style={{ fontSize: "24px", fontWeight: "800", marginTop: "4px" }}>
                {items.length} Items
              </div>
            </div>

            <div
              className="inv-stat-card low clickable"
              onClick={handleLowStockAlertsClick}
              title="Click to fetch real-time Low Stock items from Backend"
              style={{ cursor: "pointer" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: "600" }}>Low Stock Alerts</span>
                <span style={{ fontSize: "11px", fontWeight: "700" }}>
                  {statusFilter === "Low Stock" ? "Show All Items" : "Filter Low Stock"}
                </span>
              </div>
              <div style={{ fontSize: "24px", fontWeight: "800", marginTop: "4px" }}>
                {lowStockCount} Reorder Needed
              </div>
            </div>

            <div
              className="inv-stat-card val clickable"
              onClick={handleFinancialAuditClick}
              title="Click to view real-time Financial Audit Breakdown from Backend"
              style={{ cursor: "pointer" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: "600" }}>Estimated Stock Value</span>
                <span style={{ fontSize: "11px", fontWeight: "700" }}>Financial Audit</span>
              </div>
              <div style={{ fontSize: "24px", fontWeight: "800", marginTop: "4px" }}>
                ₹{totalValuation.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {/* SEARCH & FILTERS */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "24px",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div className="inv-search-box">
              <FaSearch style={{ color: "#94a3b8" }} />
              <input
                type="text"
                className="inv-search-input"
                placeholder="Search inventory or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="inv-dropdown"
              >
                <option value="All">All Categories</option>
                <option value="Linen">Linen Category</option>
                <option value="Toiletries">Toiletries Category</option>
                <option value="Minibar">Minibar Category</option>
                <option value="Cleaning Supplies">Cleaning Supplies Category</option>
                <option value="Maintenance">Maintenance Category</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="inv-dropdown"
              >
                <option value="All">All Stock Statuses</option>
                <option value="Low Stock">⚠️ Low Stock Only</option>
                <option value="OK">✓ Healthy Stock (OK)</option>
              </select>

              <div className="view-mode-toggle">
                <button
                  type="button"
                  className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                  onClick={() => setViewMode("grid")}
                  title="Grid View"
                >
                  <FaThLarge />
                </button>
                <button
                  type="button"
                  className={`view-btn ${viewMode === "list" ? "active" : ""}`}
                  onClick={() => setViewMode("list")}
                  title="List View"
                >
                  <FaList />
                </button>
              </div>
            </div>
          </div>

          {/* LIST VS GRID VIEW */}
          {viewMode === "list" ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                <thead>
                  <tr style={{ fontSize: "12px", textAlign: "left", whiteSpace: "nowrap" }}>
                    <th style={{ padding: "12px 16px" }}>Stock Item</th>
                    <th style={{ padding: "12px 16px" }}>Category</th>
                    <th style={{ padding: "12px 16px" }}>In Stock</th>
                    <th style={{ padding: "12px 16px" }}>Reorder Level</th>
                    <th style={{ padding: "12px 16px" }}>Unit Price</th>
                    <th style={{ padding: "12px 16px" }}>Status</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="inv-table-row"
                      onClick={() => setSelectedItem(item)}
                      style={{ cursor: "pointer" }}
                    >
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "20px" }}>{item.icon}</span>
                          <div>
                            <div className="inv-item-name" style={{ fontWeight: "700", fontSize: "14px" }}>{item.name}</div>
                            {item.supplier && <span style={{ fontSize: "11px", opacity: 0.7 }}>{item.supplier}</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <span className="inv-cat-badge" style={{ padding: "4px 12px", borderRadius: "999px", fontSize: "11px", fontWeight: "700" }}>
                          {item.category}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <strong style={{ fontSize: "14.5px", fontWeight: "800", color: item.inStock < item.reorderAt ? "#dc2626" : "inherit" }}>
                          {item.inStock} Units
                        </strong>
                      </td>
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: "12.5px", opacity: 0.8 }}>{item.reorderAt} Units</span>
                      </td>
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: "13px", fontWeight: "600" }}>{item.unitPrice}</span>
                      </td>
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <span style={{ padding: "4px 12px", borderRadius: "999px", fontSize: "11px", fontWeight: "700", background: item.statusBg, color: item.statusColor }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => openRestockModal(item)}
                            style={{
                              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              color: "#ffffff",
                              padding: "6px 14px",
                              borderRadius: "8px",
                              fontSize: "12px",
                              fontWeight: "600",
                              border: "none",
                              cursor: "pointer",
                              boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)",
                            }}
                          >
                            Restock 📦
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            title="Edit Stock Item"
                            style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "#f1f5f9",
                              color: "#64748b",
                              border: "1px solid #e2e8f0",
                              cursor: "pointer",
                              fontSize: "13px",
                            }}
                          >
                            <FaEdit />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            title="Delete Stock Item"
                            style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "#fee2e2",
                              color: "#ef4444",
                              border: "1px solid #fecaca",
                              cursor: "pointer",
                              fontSize: "13px",
                            }}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="inv-grid-card clickable"
                  onClick={() => setSelectedItem(item)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "16px",
                    cursor: "pointer",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "22px" }}>{item.icon}</span>
                        <h3 className="inv-item-name" style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>{item.name}</h3>
                      </div>
                      <span style={{ padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: "700", background: item.statusBg, color: item.statusColor }}>
                        {item.status}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                      <span className="inv-cat-badge" style={{ padding: "2px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: "700" }}>
                        {item.category}
                      </span>
                      {item.supplier && <span style={{ fontSize: "11px", opacity: 0.7 }}>• {item.supplier}</span>}
                    </div>

                    <div className="inv-info-box" style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", opacity: 0.8 }}>Current Stock</span>
                        <strong style={{ fontSize: "18px", fontWeight: "800", color: item.inStock < item.reorderAt ? "#dc2626" : "inherit" }}>
                          {item.inStock} Units
                        </strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", opacity: 0.8 }}>
                        <span>Reorder Level: <strong>{item.reorderAt} Units</strong></span>
                        <span>Price: <strong>{item.unitPrice}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "6px" }} onClick={(e) => e.stopPropagation()}>
                    <span style={{ fontSize: "11px", opacity: 0.7 }}>Valuation: <strong>{item.totalValue}</strong></span>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => openRestockModal(item)}
                        style={{
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          color: "#ffffff",
                          padding: "8px 14px",
                          borderRadius: "10px",
                          fontSize: "12px",
                          fontWeight: "700",
                          border: "none",
                          cursor: "pointer",
                          boxShadow: "0 4px 14px rgba(102, 126, 234, 0.4)",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <FaPlus /> Restock
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        title="Edit Item"
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#f1f5f9",
                          color: "#64748b",
                          border: "1px solid #e2e8f0",
                          cursor: "pointer",
                          fontSize: "13px",
                        }}
                      >
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        title="Delete Item"
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#fee2e2",
                          color: "#ef4444",
                          border: "1px solid #fecaca",
                          cursor: "pointer",
                          fontSize: "13px",
                        }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* SUB-TAB 2: PURCHASE ORDERS & PROCUREMENT */}
      {activeTab === "procurement" && (
        <section className="inv-panel">
          {/* INTERACTIVE PROCUREMENT SUMMARY KPI CARDS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <div
              className="inv-stat-card total clickable"
              onClick={handleVendorAuditClick}
              title="Click to fetch real-time Vendor Procurement Audit from Backend"
              style={{ cursor: "pointer" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: "600" }}>Total Purchase Orders</span>
                <span style={{ fontSize: "11px", color: "#6366f1", fontWeight: "700" }}>Vendor Audit</span>
              </div>
              <div style={{ fontSize: "24px", fontWeight: "800", marginTop: "4px" }}>
                {purchaseOrders.length} Orders
              </div>
            </div>

            <div
              className="inv-stat-card pos clickable"
              onClick={handleFilterActivePOsClick}
              title="Click to fetch real-time Active / In-Transit Purchase Orders from Backend"
              style={{ cursor: "pointer" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: "600" }}>Active / Pending Delivery</span>
                <span style={{ fontSize: "11px", fontWeight: "700" }}>
                  {poStatusFilter === "Ordered" ? "Show All Orders" : "Filter Active POs"}
                </span>
              </div>
              <div style={{ fontSize: "24px", fontWeight: "800", marginTop: "4px" }}>
                {pendingPOCount} Active POs
              </div>
            </div>

            <div
              className="inv-stat-card val clickable"
              onClick={handlePOFinancialAuditClick}
              title="Click to fetch real-time Financial Spend Breakdown from Backend"
              style={{ cursor: "pointer" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: "600" }}>Total Procurement Spend</span>
                <span style={{ fontSize: "11px", fontWeight: "700" }}>Financial Audit</span>
              </div>
              <div style={{ fontSize: "24px", fontWeight: "800", marginTop: "4px" }}>
                ₹{totalPOSpend.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {/* SEARCH & STATUS FILTER */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", gap: "16px", flexWrap: "wrap" }}>
            <div className="inv-search-box">
              <FaSearch style={{ color: "#94a3b8" }} />
              <input
                type="text"
                className="inv-search-input"
                placeholder="Search PO #, vendor or item..."
                value={poSearch}
                onChange={(e) => setPoSearch(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <select
                value={poStatusFilter}
                onChange={(e) => setPoStatusFilter(e.target.value)}
                className="inv-dropdown"
              >
                <option value="All">All PO Statuses</option>
                <option value="Ordered">🚚 Ordered / In Transit</option>
                <option value="Pending">⏳ Pending</option>
                <option value="Delivered">✓ Delivered</option>
                <option value="Cancelled">✖ Cancelled</option>
              </select>

              <div className="view-mode-toggle">
                <button type="button" className={`view-btn ${poViewMode === "list" ? "active" : ""}`} onClick={() => setPoViewMode("list")} title="List View">
                  <FaList />
                </button>
                <button type="button" className={`view-btn ${poViewMode === "grid" ? "active" : ""}`} onClick={() => setPoViewMode("grid")} title="Grid View">
                  <FaThLarge />
                </button>
              </div>
            </div>
          </div>

          {/* PO TABLE LIST */}
          {poViewMode === "list" ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                <thead>
                  <tr style={{ fontSize: "12px", textAlign: "left", whiteSpace: "nowrap" }}>
                    <th style={{ padding: "12px 16px" }}>PO #</th>
                    <th style={{ padding: "12px 16px" }}>Supplier / Vendor</th>
                    <th style={{ padding: "12px 16px" }}>Items Ordered</th>
                    <th style={{ padding: "12px 16px" }}>Total Cost</th>
                    <th style={{ padding: "12px 16px" }}>Expected Delivery</th>
                    <th style={{ padding: "12px 16px" }}>Status</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPOs.map((po) => (
                    <tr
                      key={po.id}
                      className="inv-table-row"
                      onClick={() => setSelectedPO(po)}
                      style={{ cursor: "pointer" }}
                    >
                      <td style={{ padding: "14px 16px", fontWeight: "800", color: "#6366f1", whiteSpace: "nowrap" }}>{po.id}</td>
                      <td style={{ padding: "14px 16px", fontWeight: "700", whiteSpace: "nowrap" }}>{po.supplier}</td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", maxWidth: "260px" }}>
                        <div
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            wordBreak: "break-word",
                            lineHeight: "1.45",
                            maxHeight: "2.9em",
                          }}
                          title={po.itemsSummary}
                        >
                          {po.itemsSummary}
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: "800", color: "#10b981", whiteSpace: "nowrap" }}>{po.totalAmount}</td>
                      <td style={{ padding: "14px 16px", fontSize: "12.5px", opacity: 0.8, whiteSpace: "nowrap" }}>{po.expectedDelivery}</td>
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", background: po.statusBg, color: po.statusColor }}>
                          {po.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                          {po.status !== "Delivered" && po.status !== "Cancelled" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleReceivePO(po.id)}
                                style={{
                                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                  color: "#ffffff",
                                  padding: "6px 12px",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                  border: "none",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <FaCheck /> Mark Delivered
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancelPO(po.id)}
                                style={{ background: "transparent", color: "#dc2626", padding: "4px 8px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {po.status === "Delivered" && (
                            <span style={{ fontSize: "12px", color: "#10b981", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <FaCheckCircle /> Stock Received
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
              {filteredPOs.map((po) => (
                <div
                  key={po.id}
                  className="inv-grid-card clickable"
                  onClick={() => setSelectedPO(po)}
                  style={{ cursor: "pointer" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "800", color: "#6366f1" }}>{po.id}</span>
                    <span style={{ padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", background: po.statusBg, color: po.statusColor }}>
                      {po.status}
                    </span>
                  </div>

                  <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: "700" }}>{po.supplier}</h3>
                  <p style={{ margin: "0 0 12px", fontSize: "13px", opacity: 0.8 }}>{po.itemsSummary}</p>

                  <div className="inv-info-box" style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                    <span>Cost: <strong style={{ color: "#10b981" }}>{po.totalAmount}</strong></span>
                    <span>Eta: <strong>{po.expectedDelivery}</strong></span>
                  </div>

                  {po.status !== "Delivered" && po.status !== "Cancelled" && (
                    <div style={{ paddingTop: "14px", marginTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "flex-end", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleReceivePO(po.id)}
                        style={{
                          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          color: "#ffffff",
                          padding: "8px 14px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "700",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        ✓ Mark Delivered & Add Stock
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* SUB-TAB 3: MAINTENANCE & ASSETS */}
      {activeTab === "maintenance" && (
        <Maintenance
          hideHeader={true}
          openAddModal={isAddMaintenanceModalOpen}
          onCloseAddModal={() => setIsAddMaintenanceModalOpen(false)}
        />
      )}

      {/* PURCHASE ORDER DETAILS MODAL */}
      {selectedPO && (
        <div className="modal-backdrop" onClick={() => setSelectedPO(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "20px" }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "700" }}>{selectedPO.id}</span>
                <h3 style={{ margin: "2px 0 0", fontSize: "17px", fontWeight: "700" }}>{selectedPO.supplier}</h3>
              </div>
              <button type="button" onClick={() => setSelectedPO(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#cbd5e1", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer" }}><FaTimes /></button>
            </div>

            <div className="modal-body-scrollable" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", maxHeight: "65vh", overflowY: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="modal-info-block">
                  <span style={{ fontSize: "11.5px", opacity: 0.7 }}>Order Status</span>
                  <div style={{ marginTop: "4px" }}>
                    <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", background: selectedPO.statusBg, color: selectedPO.statusColor }}>
                      {selectedPO.status}
                    </span>
                  </div>
                </div>

                <div className="modal-info-block">
                  <span style={{ fontSize: "11.5px", opacity: 0.7 }}>Total Amount</span>
                  <div style={{ fontSize: "18px", fontWeight: "800", color: "#10b981", marginTop: "2px" }}>
                    {selectedPO.totalAmount}
                  </div>
                </div>
              </div>

              <div className="modal-info-block" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ opacity: 0.7 }}>Items Description:</span>
                  <strong>{selectedPO.itemsSummary}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ opacity: 0.7 }}>Category:</span>
                  <strong>{selectedPO.category || "General"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ opacity: 0.7 }}>Order Issued Date:</span>
                  <strong>{selectedPO.orderDate || "14 Aug 2026"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ opacity: 0.7 }}>Expected Delivery:</span>
                  <strong>{selectedPO.expectedDelivery}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ opacity: 0.7 }}>Issued By:</span>
                  <strong>{selectedPO.createdBy || "Super Admin"}</strong>
                </div>
              </div>

              <div style={{ paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "10px" }}>
                {selectedPO.status !== "Delivered" && selectedPO.status !== "Cancelled" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleReceivePO(selectedPO.id)}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "10px",
                        border: "none",
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        color: "#ffffff",
                        fontSize: "13px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      ✓ Mark Received & Add Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancelPO(selectedPO.id)}
                      style={{
                        padding: "10px 16px",
                        borderRadius: "10px",
                        border: "1px solid #fee2e2",
                        background: "#fef2f2",
                        color: "#dc2626",
                        fontSize: "13px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      Cancel PO
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedPO(null)}
                    className="modal-select"
                    style={{ width: "100%", padding: "10px" }}
                  >
                    Close Window
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESTOCK MODAL */}
      {restockItem && (
        <div className="modal-backdrop" onClick={() => setRestockItem(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "20px" }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>Restock Stock Item</h3>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>{restockItem.name}</span>
              </div>
              <button type="button" onClick={() => setRestockItem(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#cbd5e1", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer" }}><FaTimes /></button>
            </div>

            <form onSubmit={handleConfirmRestock} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="modal-info-block" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "12px", opacity: 0.7 }}>Current Stock</span>
                  <div style={{ fontSize: "18px", fontWeight: "800" }}>{restockItem.inStock} Units</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "12px", opacity: 0.7 }}>Reorder Level</span>
                  <div style={{ fontSize: "15px", fontWeight: "700", color: "#6366f1" }}>{restockItem.reorderAt} Units</div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Quantity to Add (Units)</label>
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  {[20, 50, 100, 200].map((preset) => (
                    <button key={preset} type="button" onClick={() => setRestockQty(preset)} className="modal-select" style={{ width: "auto", padding: "6px 12px", cursor: "pointer", fontWeight: "700", border: restockQty === preset ? "2px solid #6366f1" : undefined }}>+{preset}</button>
                  ))}
                </div>
                <input type="number" required value={restockQty} onChange={(e) => setRestockQty(e.target.value)} className="modal-input" style={{ fontWeight: "700" }} />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Supplier / Vendor Name</label>
                <input type="text" value={restockSupplier} onChange={(e) => setRestockSupplier(e.target.value)} placeholder="e.g. ITC Hygiene, Trident Linens" className="modal-input" />
              </div>

              {restockSuccess && (
                <div style={{ background: "#dcfce7", color: "#15803d", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: "700" }}>
                  ✓ Stock updated & logged in system audit trail!
                </div>
              )}

              <div style={{ paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setRestockItem(null)} className="modal-select" style={{ width: "auto", padding: "10px 20px" }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 22px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#ffffff", fontSize: "13.5px", fontWeight: "700", cursor: "pointer" }}>Confirm Restock 📥</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STOCK ITEM MODAL */}
      {editItem && (
        <div className="modal-backdrop" onClick={() => setEditItem(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "20px" }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>Edit Stock Item Details</h3>
              <button type="button" onClick={() => setEditItem(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#cbd5e1", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer" }}><FaTimes /></button>
            </div>

            <form onSubmit={handleUpdateStockItem} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Item Name</label>
                <input type="text" required placeholder="e.g. Luxury Hand Towels" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="modal-input" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Category</label>
                  <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="modal-select">
                    <option value="Linen">Linen</option>
                    <option value="Toiletries">Toiletries</option>
                    <option value="Minibar">Minibar</option>
                    <option value="Cleaning Supplies">Cleaning Supplies</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Icon Emoji</label>
                  <input type="text" placeholder="🛋️, 🧴, ☕, 📦" value={editForm.icon} onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })} className="modal-input" />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Registered Supplier / Vendor</label>
                <select value={editForm.supplier} onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })} className="modal-select">
                  {registeredSuppliers.map((s) => (
                    <option key={s.id} value={s.name}>{s.name} ({s.category})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>In Stock</label>
                  <input type="number" required value={editForm.inStock} onChange={(e) => setEditForm({ ...editForm, inStock: e.target.value })} className="modal-input" />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Reorder Level</label>
                  <input type="number" required value={editForm.reorderAt} onChange={(e) => setEditForm({ ...editForm, reorderAt: e.target.value })} className="modal-input" />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Unit Price (₹)</label>
                  <input type="number" required value={editForm.unitPrice} onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value })} className="modal-input" />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Description</label>
                <textarea rows={2} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="modal-input" placeholder="Item description..." />
              </div>

              <div style={{ paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setEditItem(null)} className="modal-select" style={{ width: "auto", padding: "10px 20px" }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 22px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", color: "#ffffff", fontSize: "13.5px", fontWeight: "700", cursor: "pointer" }}>Save Changes 💾</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW STOCK ITEM MODAL */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "20px" }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>Add New Stock Item</h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#cbd5e1", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer" }}><FaTimes /></button>
            </div>

            <form onSubmit={handleAddStockItem} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Item Name</label>
                <input type="text" required placeholder="e.g. Luxury Hand Towels" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className="modal-input" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Category</label>
                  <select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} className="modal-select">
                    <option value="Linen">Linen</option>
                    <option value="Toiletries">Toiletries</option>
                    <option value="Minibar">Minibar</option>
                    <option value="Cleaning Supplies">Cleaning Supplies</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Icon Emoji</label>
                  <input type="text" placeholder="🛋️, 🧴, ☕, 📦" value={newItem.icon} onChange={(e) => setNewItem({ ...newItem, icon: e.target.value })} className="modal-input" />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Registered Supplier / Vendor</label>
                <select value={newItem.supplier} onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })} className="modal-select">
                  {registeredSuppliers.map((s) => (
                    <option key={s.id} value={s.name}>{s.name} ({s.category})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>In Stock</label>
                  <input type="number" required placeholder="100" value={newItem.inStock} onChange={(e) => setNewItem({ ...newItem, inStock: e.target.value })} className="modal-input" />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Reorder At</label>
                  <input type="number" required placeholder="30" value={newItem.reorderAt} onChange={(e) => setNewItem({ ...newItem, reorderAt: e.target.value })} className="modal-input" />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Unit Price (₹)</label>
                  <input type="number" required placeholder="450" value={newItem.unitPrice} onChange={(e) => setNewItem({ ...newItem, unitPrice: e.target.value })} className="modal-input" />
                </div>
              </div>

              <div style={{ paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="modal-select" style={{ width: "auto", padding: "10px 20px" }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 22px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#ffffff", fontSize: "13.5px", fontWeight: "700", cursor: "pointer" }}>Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PURCHASE ORDER MODAL */}
      {isAddPOModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddPOModalOpen(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "20px" }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>Issue Purchase Order</h3>
              <button type="button" onClick={() => setIsAddPOModalOpen(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#cbd5e1", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer" }}><FaTimes /></button>
            </div>

            <form onSubmit={handleCreatePO} className="modal-body-scrollable" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Select Stock Item to Reorder (Optional)</label>
                <select value={newPO.linkedItemId} onChange={(e) => handlePOLinkedItemChange(e.target.value)} className="modal-select">
                  <option value="">-- Custom Purchase Order --</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.icon} {item.name} (Current: {item.inStock} | Reorder: {item.reorderAt})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Vendor / Supplier</label>
                <select value={newPO.supplier} onChange={(e) => setNewPO({ ...newPO, supplier: e.target.value })} className="modal-select">
                  {registeredSuppliers.map((s) => (
                    <option key={s.id} value={s.name}>{s.name} ({s.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Items Description / Summary</label>
                <input type="text" required placeholder="e.g. Bath Towels Luxury Cotton (100 Units)" value={newPO.itemsSummary} onChange={(e) => setNewPO({ ...newPO, itemsSummary: e.target.value })} className="modal-input" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Quantity to Add on Receipt</label>
                  <input type="number" required value={newPO.quantityToAdd} onChange={(e) => setNewPO({ ...newPO, quantityToAdd: e.target.value })} className="modal-input" />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Total Cost (₹)</label>
                  <input type="number" required placeholder="12500" value={newPO.totalAmount} onChange={(e) => setNewPO({ ...newPO, totalAmount: e.target.value })} className="modal-input" />
                </div>
              </div>

              <div style={{ paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setIsAddPOModalOpen(false)} className="modal-select" style={{ width: "auto", padding: "10px 20px" }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 22px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#ffffff", fontSize: "13.5px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 14px rgba(102, 126, 234, 0.4)" }}>Issue Purchase Order 📑</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUMMARY DRILLDOWN MODAL FOR INVENTORY */}
      {summaryModal && (
        <div className="modal-backdrop" onClick={() => setSummaryModal(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "20px" }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>{summaryModal === "valuation" ? "📊 Financial Inventory Valuation" : "📂 Category Breakdown Overview"}</h3>
              <button type="button" onClick={() => setSummaryModal(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#cbd5e1", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer" }}><FaTimes /></button>
            </div>

            <div className="modal-body-scrollable" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px", maxHeight: "65vh", overflowY: "auto" }}>
              {Object.entries(categoryStats).map(([cat, data]) => (
                <div key={cat} className="modal-info-block" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: "14px", display: "block" }}>{cat}</strong>
                    <span style={{ fontSize: "12px", opacity: 0.7 }}>{data.count} Items Registered</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "15px", fontWeight: "800", color: "#10b981", display: "block" }}>₹{data.val.toLocaleString("en-IN")}</span>
                    <span style={{ fontSize: "11px", opacity: 0.7 }}>{totalValuation > 0 ? ((data.val / totalValuation) * 100).toFixed(1) : 0}% of valuation</span>
                  </div>
                </div>
              ))}
              <div style={{ paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setSummaryModal(null)} className="modal-select" style={{ width: "auto", padding: "10px 20px" }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUMMARY DRILLDOWN MODAL FOR PURCHASE ORDERS */}
      {poSummaryModal && (
        <div className="modal-backdrop" onClick={() => setPoSummaryModal(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "20px" }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>
                {poSummaryModal === "suppliers" ? "📑 Vendor & Supplier Procurement Audit" : "📊 Financial Procurement Spend Breakdown"}
              </h3>
              <button type="button" onClick={() => setPoSummaryModal(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#cbd5e1", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer" }}><FaTimes /></button>
            </div>

            <div className="modal-body-scrollable" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px", maxHeight: "65vh", overflowY: "auto" }}>
              {poSummaryModal === "suppliers" ? (
                Object.entries(poSupplierStats).map(([supplier, data]) => (
                  <div key={supplier} className="modal-info-block" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ fontSize: "14px", display: "block" }}>{supplier}</strong>
                      <span style={{ fontSize: "12px", opacity: 0.7 }}>
                        {data.count} Orders Issued {data.pending > 0 ? `• ${data.pending} Active` : ""}
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "15px", fontWeight: "800", color: "#6366f1", display: "block" }}>₹{data.val.toLocaleString("en-IN")}</span>
                      <span style={{ fontSize: "11px", opacity: 0.7 }}>
                        {totalPOSpend > 0 ? ((data.val / totalPOSpend) * 100).toFixed(1) : 0}% of procurement spend
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                Object.entries(poCategoryStats).map(([cat, data]) => (
                  <div key={cat} className="modal-info-block" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ fontSize: "14px", display: "block" }}>{cat} Category</strong>
                      <span style={{ fontSize: "12px", opacity: 0.7 }}>{data.count} Purchase Orders</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "15px", fontWeight: "800", color: "#10b981", display: "block" }}>₹{data.val.toLocaleString("en-IN")}</span>
                      <span style={{ fontSize: "11px", opacity: 0.7 }}>
                        {totalPOSpend > 0 ? ((data.val / totalPOSpend) * 100).toFixed(1) : 0}% of spend
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div style={{ paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setPoSummaryModal(null)} className="modal-select" style={{ width: "auto", padding: "10px 20px" }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
