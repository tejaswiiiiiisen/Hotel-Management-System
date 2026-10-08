import "dotenv/config";
import { query } from "../db.js";

export const SEEDED_INVENTORY_ITEMS = [
  // CHEERY CLOTHING (CH560)
  {
    org_id: "CH560",
    org_name: "Cheery Clothing",
    sku: "MNB-WNE-001",
    name: "Minibar Organic Sparkling Wine 750ml",
    category: "Minibar",
    inStock: 30,
    reorderAt: 10,
    unitPrice: 1500,
    icon: "🍾",
    supplier: "Vintage Cellars Pvt Ltd",
    lastRestocked: "18 Aug 2026",
    description: "Premium organic sparkling wine bottles for luxury suite minibars.",
  },
  {
    org_id: "CH560",
    org_name: "Cheery Clothing",
    sku: "CLN-SPR-002",
    name: "Aromatherapy Fabric Refresh Spray 500ml",
    category: "Cleaning",
    inStock: 45,
    reorderAt: 12,
    unitPrice: 420,
    icon: "🧴",
    supplier: "PureScent Labs",
    lastRestocked: "15 Aug 2026",
    description: "Lavender & Eucalyptus fabric freshener spray for guest linen.",
  },
  {
    org_id: "CH560",
    org_name: "Cheery Clothing",
    sku: "LIN-TOW-003",
    name: "Luxury Cotton Bath Towels",
    category: "Linen",
    inStock: 120,
    reorderAt: 80,
    unitPrice: 450,
    icon: "🛋️",
    supplier: "Trident Linens Pvt Ltd",
    lastRestocked: "12 Aug 2026",
    description: "100% Egyptian cotton white bath towels (600 GSM).",
  },
  {
    org_id: "CH560",
    org_name: "Cheery Clothing",
    sku: "TOI-ROL-004",
    name: "Soft Toilet Rolls (2-Ply)",
    category: "Toiletries",
    inStock: 60,
    reorderAt: 120,
    unitPrice: 30,
    icon: "🧻",
    supplier: "KIMBERLY-CLARK India",
    lastRestocked: "02 Aug 2026",
    description: "Ultra-soft 2-ply tissue rolls for rest rooms.",
  },
  {
    org_id: "CH560",
    org_name: "Cheery Clothing",
    sku: "LIN-SHT-005",
    name: "Silk Fitted Bed Sheets (King)",
    category: "Linen",
    inStock: 85,
    reorderAt: 40,
    unitPrice: 850,
    icon: "🛏️",
    supplier: "Trident Linens Pvt Ltd",
    lastRestocked: "14 Aug 2026",
    description: "300 TC silk cotton percale king size fitted bed sheets.",
  },

  // ASHIRWAD (AS435)
  {
    org_id: "AS435",
    org_name: "Ashirwad",
    sku: "ASH-ROSE-001",
    name: "Royal Rose Water Diffuser 250ml",
    category: "Amenities",
    inStock: 40,
    reorderAt: 15,
    unitPrice: 650,
    icon: "🌹",
    supplier: "Forest Essentials India",
    lastRestocked: "16 Aug 2026",
    description: "Authentic Kannauj Rose water reed diffuser for lobby & VIP rooms.",
  },
  {
    org_id: "AS435",
    org_name: "Ashirwad",
    sku: "ASH-TEA-002",
    name: "Organic Green Tea Bags (Pack of 100)",
    category: "Minibar",
    inStock: 300,
    reorderAt: 100,
    unitPrice: 12,
    icon: "🍵",
    supplier: "Darjeeling Tea Estate",
    lastRestocked: "10 Aug 2026",
    description: "Single-origin Darjeeling organic green tea infusion sachets.",
  },
  {
    org_id: "AS435",
    org_name: "Ashirwad",
    sku: "ASH-ROB-003",
    name: "Luxury Embroidered Bath Robes White",
    category: "Linen",
    inStock: 35,
    reorderAt: 20,
    unitPrice: 1200,
    icon: "🥋",
    supplier: "Raymond Home & Textiles",
    lastRestocked: "08 Aug 2026",
    description: "Plush velour unisex bathrobes with embroidered hotel emblem.",
  },
  {
    org_id: "AS435",
    org_name: "Ashirwad",
    sku: "ASH-CLN-004",
    name: "Hospital Grade Disinfectant Liquid 5L",
    category: "Cleaning",
    inStock: 25,
    reorderAt: 10,
    unitPrice: 580,
    icon: "🧼",
    supplier: "Diversey Hygiene India",
    lastRestocked: "14 Aug 2026",
    description: "Multi-surface floor disinfectant liquid cannister.",
  },

  // MATCHA TEA (MA330)
  {
    org_id: "MA330",
    org_name: "Matcha Tea",
    sku: "MTC-PDR-001",
    name: "Ceremonial Organic Matcha Powder 250g",
    category: "Minibar",
    inStock: 80,
    reorderAt: 25,
    unitPrice: 850,
    icon: "🍵",
    supplier: "Kyoto Tea Exporters",
    lastRestocked: "17 Aug 2026",
    description: "First-harvest ceremonial grade Japanese matcha green tea powder.",
  },
  {
    org_id: "MA330",
    org_name: "Matcha Tea",
    sku: "MTC-WHS-002",
    name: "Traditional Bamboo Tea Whisk Set (Chasen)",
    category: "Amenities",
    inStock: 40,
    reorderAt: 15,
    unitPrice: 450,
    icon: "🎋",
    supplier: "Zen Crafts Studio",
    lastRestocked: "12 Aug 2026",
    description: "Handcrafted 100-prong bamboo whisks for tea lounge.",
  },
  {
    org_id: "MA330",
    org_name: "Matcha Tea",
    sku: "MTC-TOW-003",
    name: "Organic Bamboo Fiber Hand Towels",
    category: "Linen",
    inStock: 100,
    reorderAt: 50,
    unitPrice: 180,
    icon: "🧻",
    supplier: "EcoLinen Organics",
    lastRestocked: "14 Aug 2026",
    description: "Ultra-absorbent antibacterial natural bamboo hand towels.",
  },
];

export async function initInventorySchema() {
  try {
    console.log("🔄 Initializing Inventory Items table & seeding default items...");

    // Create table if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
        org_id         VARCHAR(50) NOT NULL DEFAULT 'CH560',
        org_name       VARCHAR(255) DEFAULT 'Cheery Clothing',
        sku            VARCHAR(100) NOT NULL,
        name           VARCHAR(255) NOT NULL,
        category       VARCHAR(100) NOT NULL,
        in_stock       INT NOT NULL DEFAULT 0,
        reorder_at     INT NOT NULL DEFAULT 0,
        unit_price     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        status         VARCHAR(50) NOT NULL DEFAULT 'OK',
        icon           VARCHAR(50) DEFAULT '📦',
        supplier       VARCHAR(255) DEFAULT NULL,
        last_restocked VARCHAR(100) DEFAULT NULL,
        description    TEXT DEFAULT NULL,
        created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_org_sku (org_id, sku)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Check if org_id column exists
    try {
      const colCheck = await query<any>("SHOW COLUMNS FROM inventory_items LIKE 'org_id'");
      if (colCheck.length === 0) {
        await query("ALTER TABLE inventory_items ADD COLUMN org_id VARCHAR(50) NOT NULL DEFAULT 'CH560'");
        await query("ALTER TABLE inventory_items ADD COLUMN org_name VARCHAR(255) DEFAULT 'Cheery Clothing'");
        console.log("✅ Added org_id & org_name columns to inventory_items table.");
      }
    } catch (e) {
      console.warn("Could not alter inventory_items table for org_id:", e);
    }

    // Seed/Re-seed items into database for each organization
    for (const item of SEEDED_INVENTORY_ITEMS) {
      const isLow = item.inStock < item.reorderAt;
      const status = isLow ? "Low Stock" : "OK";
      await query(
        `INSERT INTO inventory_items 
        (org_id, org_name, sku, name, category, in_stock, reorder_at, unit_price, status, icon, supplier, last_restocked, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          category = VALUES(category),
          in_stock = VALUES(in_stock),
          reorder_at = VALUES(reorder_at),
          unit_price = VALUES(unit_price),
          status = VALUES(status),
          icon = VALUES(icon),
          supplier = VALUES(supplier),
          last_restocked = VALUES(last_restocked),
          description = VALUES(description)`,
        [
          item.org_id,
          item.org_name,
          item.sku,
          item.name,
          item.category,
          item.inStock,
          item.reorderAt,
          item.unitPrice,
          status,
          item.icon,
          item.supplier,
          item.lastRestocked,
          item.description,
        ]
      );
    }

    console.log("✅ Seeded inventory stock items into MySQL database successfully.");
  } catch (error: any) {
    console.warn("⚠️ Warning during initInventorySchema:", error.message);
  }
}

if (process.argv[1] && process.argv[1].includes("init-inventory-schema")) {
  initInventorySchema().then(() => process.exit(0));
}
