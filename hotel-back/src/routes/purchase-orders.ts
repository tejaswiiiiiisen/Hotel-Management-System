import { Router } from "express";
import { query } from "../db.js";
import { InventoryItemRow } from "./inventory.js";

const router = Router();

export interface PurchaseOrderRow {
  id: string;
  supplier: string;
  category: string;
  items_summary: string;
  total_amount: number;
  order_date: string;
  expected_delivery: string;
  status: string;
  created_by: string | null;
  linked_item_id: number | null;
  quantity_to_add: number;
  created_at?: string;
  updated_at?: string;
}

function formatPurchaseOrder(r: PurchaseOrderRow) {
  const amountNum = Number(r.total_amount || 0);
  const status = r.status || "Ordered";

  let statusBg = "#e0e7ff";
  let statusColor = "#4338ca";

  if (status === "Delivered") {
    statusBg = "#dcfce7";
    statusColor = "#15803d";
  } else if (status === "Cancelled") {
    statusBg = "#fee2e2";
    statusColor = "#b91c1c";
  } else if (status === "Pending Approval" || status === "Pending") {
    statusBg = "#fef3c7";
    statusColor = "#d97706";
  }

  return {
    id: r.id,
    supplier: r.supplier,
    category: r.category || "General",
    itemsSummary: r.items_summary,
    totalAmount: `₹${amountNum.toLocaleString("en-IN")}`,
    totalAmountNum: amountNum,
    orderDate: r.order_date,
    expectedDelivery: r.expected_delivery,
    status,
    statusBg,
    statusColor,
    createdBy: r.created_by || "Admin User",
    linkedItemId: r.linked_item_id,
    quantityToAdd: Number(r.quantity_to_add || 50),
  };
}

// GET /api/purchase-orders - Fetch all purchase orders
router.get("/", async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const orgIdParam = (req.query.orgId as string) || (req.query.org_id as string) || (req.headers["x-org-id"] as string);

    const whereClauses: string[] = [];
    const params: unknown[] = [];

    if (orgIdParam) {
      whereClauses.push("org_id = ?");
      params.push(orgIdParam);
    }

    if (search && search.trim() !== "") {
      whereClauses.push("(id LIKE ? OR supplier LIKE ? OR items_summary LIKE ? OR category LIKE ?)");
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";
    const rows = await query<PurchaseOrderRow>(
      `SELECT * FROM purchase_orders ${whereSql} ORDER BY created_at DESC`,
      params
    );

    let pos = rows.map(formatPurchaseOrder);

    if (status && status !== "All") {
      pos = pos.filter((po) => po.status.toLowerCase() === status.toLowerCase());
    }

    return res.json({
      success: true,
      count: pos.length,
      purchaseOrders: pos,
    });
  } catch (err: any) {
    console.error("Error fetching purchase orders:", err);
    return res.status(500).json({ error: "Failed to fetch purchase orders." });
  }
});

// POST /api/purchase-orders - Create a new Purchase Order
router.post("/", async (req, res) => {
  try {
    const {
      supplier,
      category,
      itemsSummary,
      totalAmount: rawTotalAmount,
      expectedDelivery,
      createdBy,
      linkedItemId,
      quantityToAdd: rawQty,
    } = req.body ?? {};

    if (!supplier || !itemsSummary) {
      return res.status(400).json({ error: "Supplier and items summary are required." });
    }

    const orgIdParam = req.body.orgId || req.body.org_id || req.query.orgId || (req.headers["x-org-id"] as string) || null;
    const poId = `PO-2026-${Math.floor(100 + Math.random() * 900)}`;
    const amountNum = parseFloat(String(rawTotalAmount || 0).replace(/[^0-9.]/g, "")) || 5000;
    const qtyToAdd = parseInt(String(rawQty || 50), 10) || 50;
    const orderCategory = category || "General";
    const delivery = expectedDelivery || "3 Days";
    const creator = createdBy || "Admin User";
    const linkedId = linkedItemId ? Number(linkedItemId) : null;
    const orderDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    await query(
      `INSERT INTO purchase_orders (id, supplier, category, items_summary, total_amount, order_date, expected_delivery, status, created_by, linked_item_id, quantity_to_add, org_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        poId,
        supplier,
        orderCategory,
        itemsSummary,
        amountNum,
        orderDate,
        delivery,
        "Ordered",
        creator,
        linkedId,
        qtyToAdd,
        orgIdParam,
      ]
    );

    const insertedRows = await query<PurchaseOrderRow>(
      `SELECT * FROM purchase_orders WHERE id = ? LIMIT 1`,
      [poId]
    );

    const newPO = formatPurchaseOrder(insertedRows[0]);
    return res.status(201).json({
      message: "Purchase order created successfully.",
      purchaseOrder: newPO,
    });
  } catch (err: any) {
    console.error("Error creating purchase order:", err);
    return res.status(500).json({ error: "Failed to create purchase order." });
  }
});

// PUT /api/purchase-orders/:id/deliver - Mark PO as Delivered & Increment Stock
router.put("/:id/deliver", async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query<PurchaseOrderRow>(
      `SELECT * FROM purchase_orders WHERE id = ? LIMIT 1`,
      [id]
    );

    if (!existing.length) {
      return res.status(404).json({ error: "Purchase order not found." });
    }

    const targetPO = existing[0];

    // Update PO Status in Database
    await query(
      `UPDATE purchase_orders SET status = 'Delivered' WHERE id = ?`,
      [id]
    );

    // Increment inventory stock automatically if linked_item_id exists
    if (targetPO.linked_item_id) {
      const qtyToAdd = Number(targetPO.quantity_to_add || 50);
      const itemRows = await query<InventoryItemRow>(
        `SELECT * FROM inventory_items WHERE id = ? LIMIT 1`,
        [targetPO.linked_item_id]
      );

      if (itemRows.length > 0) {
        const item = itemRows[0];
        const newStock = Number(item.in_stock || 0) + qtyToAdd;
        const reorderAt = Number(item.reorder_at || 0);
        const newStatus = newStock < reorderAt ? "Low Stock" : "OK";
        const todayStr = new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

        await query(
          `UPDATE inventory_items SET in_stock = ?, status = ?, last_restocked = ?, supplier = ? WHERE id = ?`,
          [newStock, newStatus, todayStr, targetPO.supplier || item.supplier, item.id]
        );
      }
    }

    const updatedRows = await query<PurchaseOrderRow>(
      `SELECT * FROM purchase_orders WHERE id = ? LIMIT 1`,
      [id]
    );

    return res.json({
      message: `Purchase order ${id} delivered and stock updated!`,
      purchaseOrder: formatPurchaseOrder(updatedRows[0]),
    });
  } catch (err: any) {
    console.error("Error delivering purchase order:", err);
    return res.status(500).json({ error: "Failed to deliver purchase order." });
  }
});

// PUT /api/purchase-orders/:id/cancel - Cancel PO
router.put("/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query<PurchaseOrderRow>(
      `SELECT * FROM purchase_orders WHERE id = ? LIMIT 1`,
      [id]
    );

    if (!existing.length) {
      return res.status(404).json({ error: "Purchase order not found." });
    }

    await query(
      `UPDATE purchase_orders SET status = 'Cancelled' WHERE id = ?`,
      [id]
    );

    const updatedRows = await query<PurchaseOrderRow>(
      `SELECT * FROM purchase_orders WHERE id = ? LIMIT 1`,
      [id]
    );

    return res.json({
      message: `Purchase order ${id} cancelled.`,
      purchaseOrder: formatPurchaseOrder(updatedRows[0]),
    });
  } catch (err: any) {
    console.error("Error cancelling purchase order:", err);
    return res.status(500).json({ error: "Failed to cancel purchase order." });
  }
});

export default router;
