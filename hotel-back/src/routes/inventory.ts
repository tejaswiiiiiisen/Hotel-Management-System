import { Router } from "express";
import { query } from "../db.js";

const router = Router();

export interface InventoryItemRow {
  id: number;
  sku: string;
  name: string;
  category: string;
  in_stock: number;
  reorder_at: number;
  unit_price: number;
  status: string;
  icon: string | null;
  supplier: string | null;
  last_restocked: string | null;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

function formatInventoryItem(r: InventoryItemRow) {
  const inStock = Number(r.in_stock || 0);
  const reorderAt = Number(r.reorder_at || 0);
  const unitPriceNum = Number(r.unit_price || 0);
  const isLow = inStock < reorderAt;
  const status = isLow ? "Low Stock" : "OK";
  const totalValNum = inStock * unitPriceNum;

  return {
    id: r.id,
    sku: r.sku,
    name: r.name,
    category: r.category || "General",
    inStock,
    reorderAt,
    unitPrice: `₹${unitPriceNum}`,
    unitPriceNum,
    totalValue: `₹${totalValNum.toLocaleString("en-IN")}`,
    totalValNum,
    status,
    statusColor: isLow ? "#dc2626" : "#16a34a",
    statusBg: isLow ? "#fee2e2" : "#dcfce7",
    icon: r.icon || "📦",
    supplier: r.supplier || "Direct Procurement",
    lastRestocked: r.last_restocked || "N/A",
    description: r.description || "",
  };
}

// GET /api/inventory - Fetch all stock items
router.get("/", async (req, res) => {
  try {
    const category = req.query.category as string | undefined;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const orgIdParam = (req.query.orgId as string) || (req.query.org_id as string) || (req.headers["x-org-id"] as string);

    const whereClauses: string[] = [];
    const params: unknown[] = [];

    if (orgIdParam) {
      whereClauses.push("org_id = ?");
      params.push(orgIdParam);
    }

    if (category && category !== "All") {
      whereClauses.push("category = ?");
      params.push(category);
    }
    if (search && search.trim() !== "") {
      whereClauses.push("(name LIKE ? OR sku LIKE ? OR supplier LIKE ?)");
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";
    const rows = await query<InventoryItemRow>(
      `SELECT * FROM inventory_items ${whereSql} ORDER BY id DESC`,
      params
    );

    let items = rows.map(formatInventoryItem);

    if (status && status !== "All") {
      items = items.filter((item) => item.status.toLowerCase() === status.toLowerCase());
    }

    return res.json({
      success: true,
      count: items.length,
      items,
    });
  } catch (err: any) {
    console.error("Error fetching inventory items:", err);
    return res.status(500).json({ error: "Failed to fetch inventory stock." });
  }
});

// POST /api/inventory - Create a new inventory stock item
router.post("/", async (req, res) => {
  try {
    const {
      name,
      category,
      inStock: rawInStock,
      reorderAt: rawReorderAt,
      unitPrice: rawUnitPrice,
      icon,
      supplier,
      description,
      sku: rawSku,
    } = req.body ?? {};

    if (!name || rawInStock === undefined || rawUnitPrice === undefined) {
      return res.status(400).json({ error: "Name, inStock, and unitPrice are required fields." });
    }

    const orgIdParam = req.body.orgId || req.body.org_id || req.query.orgId || (req.headers["x-org-id"] as string) || null;
    const inStock = parseInt(String(rawInStock), 10) || 0;
    const reorderAt = parseInt(String(rawReorderAt || 0), 10) || 0;
    const priceNum = parseFloat(String(rawUnitPrice).replace(/[^0-9.]/g, "")) || 0;
    const itemCategory = category || "Linen";
    const itemSupplier = supplier || "Direct Procurement";
    const itemIcon = icon || "📦";

    const isLow = inStock < reorderAt;
    const status = isLow ? "Low Stock" : "OK";
    const sku = rawSku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
    const lastRestocked = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const result: any = await query(
      `INSERT INTO inventory_items (sku, name, category, in_stock, reorder_at, unit_price, status, icon, supplier, last_restocked, description, org_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sku,
        name,
        itemCategory,
        inStock,
        reorderAt,
        priceNum,
        status,
        itemIcon,
        itemSupplier,
        lastRestocked,
        description || "",
        orgIdParam,
      ]
    );

    const insertedRows = await query<InventoryItemRow>(
      `SELECT * FROM inventory_items WHERE id = ? LIMIT 1`,
      [result.insertId]
    );

    const newItem = formatInventoryItem(insertedRows[0]);
    return res.status(201).json({
      message: "Inventory item created successfully.",
      item: newItem,
    });
  } catch (err: any) {
    console.error("Error creating inventory item:", err);
    return res.status(500).json({ error: "Failed to create inventory item." });
  }
});

// PUT /api/inventory/:id/restock - Quick restock an item (+qty)
router.put("/:id/restock", async (req, res) => {
  try {
    const { id } = req.params;
    const { qtyToAdd, supplier } = req.body ?? {};

    const qty = parseInt(String(qtyToAdd || 50), 10) || 0;

    const existing = await query<InventoryItemRow>(
      `SELECT * FROM inventory_items WHERE id = ? LIMIT 1`,
      [id]
    );

    if (!existing.length) {
      return res.status(404).json({ error: "Inventory item not found." });
    }

    const currentItem = existing[0];
    const newStock = Number(currentItem.in_stock || 0) + qty;
    const reorderAt = Number(currentItem.reorder_at || 0);
    const isLow = newStock < reorderAt;
    const status = isLow ? "Low Stock" : "OK";
    const lastRestocked = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const updatedSupplier = supplier || currentItem.supplier;

    await query(
      `UPDATE inventory_items 
       SET in_stock = ?, status = ?, last_restocked = ?, supplier = ?
       WHERE id = ?`,
      [newStock, status, lastRestocked, updatedSupplier, id]
    );

    const updatedRows = await query<InventoryItemRow>(
      `SELECT * FROM inventory_items WHERE id = ? LIMIT 1`,
      [id]
    );

    const updatedItem = formatInventoryItem(updatedRows[0]);
    return res.json({
      message: `Successfully restocked ${qty} units.`,
      item: updatedItem,
    });
  } catch (err: any) {
    console.error("Error restocking inventory item:", err);
    return res.status(500).json({ error: "Failed to restock item." });
  }
});

// PUT /api/inventory/:id - Update an inventory item
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, inStock, reorderAt, unitPrice, supplier, icon, description } = req.body ?? {};

    const existing = await query<InventoryItemRow>(
      `SELECT * FROM inventory_items WHERE id = ? LIMIT 1`,
      [id]
    );

    if (!existing.length) {
      return res.status(404).json({ error: "Inventory item not found." });
    }

    const current = existing[0];
    const newInStock = inStock !== undefined ? parseInt(String(inStock), 10) : current.in_stock;
    const newReorderAt = reorderAt !== undefined ? parseInt(String(reorderAt), 10) : current.reorder_at;
    const newUnitPrice = unitPrice !== undefined ? parseFloat(String(unitPrice).replace(/[^0-9.]/g, "")) : current.unit_price;
    const isLow = newInStock < newReorderAt;
    const status = isLow ? "Low Stock" : "OK";

    await query(
      `UPDATE inventory_items
       SET name = ?, category = ?, in_stock = ?, reorder_at = ?, unit_price = ?, status = ?, supplier = ?, icon = ?, description = ?
       WHERE id = ?`,
      [
        name ?? current.name,
        category ?? current.category,
        newInStock,
        newReorderAt,
        newUnitPrice,
        status,
        supplier ?? current.supplier,
        icon ?? current.icon,
        description ?? current.description,
        id,
      ]
    );

    const updatedRows = await query<InventoryItemRow>(
      `SELECT * FROM inventory_items WHERE id = ? LIMIT 1`,
      [id]
    );

    return res.json({
      message: "Inventory item updated successfully.",
      item: formatInventoryItem(updatedRows[0]),
    });
  } catch (err: any) {
    console.error("Error updating inventory item:", err);
    return res.status(500).json({ error: "Failed to update item." });
  }
});

// DELETE /api/inventory/:id - Remove an inventory item
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result: any = await query(`DELETE FROM inventory_items WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Inventory item not found." });
    }

    return res.json({ message: "Inventory item deleted successfully.", id: Number(id) });
  } catch (err: any) {
    console.error("Error deleting inventory item:", err);
    return res.status(500).json({ error: "Failed to delete inventory item." });
  }
});

export default router;
