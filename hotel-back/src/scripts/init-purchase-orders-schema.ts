import "dotenv/config";
import { query } from "../db.js";

const DEFAULT_PURCHASE_ORDERS = [
  {
    id: "PO-2026-089",
    supplier: "Trident Linens Pvt Ltd",
    category: "Linen",
    items_summary: "Bath Towels Luxury Cotton (100 Units)",
    total_amount: 45000,
    order_date: "10 Aug 2026",
    expected_delivery: "18 Aug 2026",
    status: "Ordered",
    created_by: "Procurement Desk",
    linked_item_id: 1,
    quantity_to_add: 100,
  },
  {
    id: "PO-2026-085",
    supplier: "ITC Hygiene Supplies",
    category: "Toiletries",
    items_summary: "Herbal Shampoo 30ml (300 Bottles)",
    total_amount: 7500,
    order_date: "08 Aug 2026",
    expected_delivery: "15 Aug 2026",
    status: "Delivered",
    created_by: "Inventory Manager",
    linked_item_id: 2,
    quantity_to_add: 300,
  },
  {
    id: "PO-2026-081",
    supplier: "KIMBERLY-CLARK India",
    category: "Toiletries",
    items_summary: "Soft Toilet Rolls 2-Ply (200 Units)",
    total_amount: 6000,
    order_date: "05 Aug 2026",
    expected_delivery: "14 Aug 2026",
    status: "Delivered",
    created_by: "Procurement Desk",
    linked_item_id: 4,
    quantity_to_add: 200,
  },
  {
    id: "PO-2026-078",
    supplier: "Philips Lighting Solution",
    category: "Maintenance",
    items_summary: "LED Bulb 12W Warm White (50 Units)",
    total_amount: 7000,
    order_date: "11 Aug 2026",
    expected_delivery: "17 Aug 2026",
    status: "Pending",
    created_by: "Maintenance Lead",
    linked_item_id: 8,
    quantity_to_add: 50,
  },
  {
    id: "PO-2026-072",
    supplier: "Diversey Hygiene Systems",
    category: "Cleaning Supplies",
    items_summary: "Glass Cleaner Spray (50 Bottles)",
    total_amount: 5500,
    order_date: "01 Aug 2026",
    expected_delivery: "09 Aug 2026",
    status: "Cancelled",
    created_by: "Procurement Desk",
    linked_item_id: 6,
    quantity_to_add: 50,
  },
];

export async function initPurchaseOrdersSchema() {
  try {
    console.log("🔄 Initializing Purchase Orders table & seeding default orders...");

    await query(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id                VARCHAR(100) NOT NULL,
        org_id            VARCHAR(50) NOT NULL DEFAULT 'AS435',
        supplier          VARCHAR(255) NOT NULL,
        category          VARCHAR(100) NOT NULL DEFAULT 'General',
        items_summary     VARCHAR(255) NOT NULL,
        total_amount      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        order_date        VARCHAR(100) NOT NULL,
        expected_delivery VARCHAR(100) NOT NULL,
        status            VARCHAR(50) NOT NULL DEFAULT 'Ordered',
        created_by        VARCHAR(100) DEFAULT 'Admin User',
        linked_item_id    INT UNSIGNED DEFAULT NULL,
        quantity_to_add   INT NOT NULL DEFAULT 50,
        created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    try {
      await query("ALTER TABLE purchase_orders ADD COLUMN org_id VARCHAR(50) NOT NULL DEFAULT 'AS435'");
    } catch {}

    // Migrate any existing 'Pending Approval' records to 'Pending'
    await query("UPDATE purchase_orders SET status = 'Pending' WHERE status = 'Pending Approval'");

    const existing = await query<any>("SELECT COUNT(*) AS count FROM purchase_orders");
    const count = Number(existing[0]?.count || 0);

    if (count === 0) {
      for (const po of DEFAULT_PURCHASE_ORDERS) {
        await query(
          `INSERT INTO purchase_orders (id, supplier, category, items_summary, total_amount, order_date, expected_delivery, status, created_by, linked_item_id, quantity_to_add)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            po.id,
            po.supplier,
            po.category,
            po.items_summary,
            po.total_amount,
            po.order_date,
            po.expected_delivery,
            po.status,
            po.created_by,
            po.linked_item_id,
            po.quantity_to_add,
          ]
        );
      }
      console.log("✅ Seeded initial purchase orders into database.");
    }
  } catch (error: any) {
    console.warn("⚠️ Warning during initPurchaseOrdersSchema:", error.message);
  }
}
