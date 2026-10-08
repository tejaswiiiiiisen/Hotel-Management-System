import "dotenv/config";
import { query } from "../db.js";

export async function initOffersSchema() {
  console.log("🔄 Initializing Offers table & running schema migrations...");

  await query(`
    CREATE TABLE IF NOT EXISTS offers (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      coupon_code VARCHAR(100) NOT NULL UNIQUE,
      discount_type ENUM('percent', 'fixed') NOT NULL DEFAULT 'percent',
      discount_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      valid_from DATE DEFAULT NULL,
      valid_to DATE DEFAULT NULL,
      branch_id VARCHAR(50) DEFAULT NULL,
      room_type VARCHAR(100) DEFAULT NULL,
      room_id INT UNSIGNED DEFAULT NULL,
      min_nights INT NOT NULL DEFAULT 1,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const alterQueries = [
    "ALTER TABLE bookings ADD COLUMN offer_id INT UNSIGNED DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN offer_name VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN coupon_code VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00",
    "ALTER TABLE bookings ADD COLUMN subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00",
    "ALTER TABLE bookings ADD COLUMN tax DECIMAL(10,2) NOT NULL DEFAULT 0.00",
    "ALTER TABLE bookings ADD COLUMN final_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00",
    "ALTER TABLE customers ADD COLUMN offer_name VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE customers ADD COLUMN discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00",
    "ALTER TABLE customers ADD COLUMN subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00",
    "ALTER TABLE customers ADD COLUMN tax DECIMAL(10,2) NOT NULL DEFAULT 0.00"
  ];

  for (const q of alterQueries) {
    try {
      await query(q);
    } catch {}
  }

  // Back-fill subtotal and final_amount
  try {
    await query(`
      UPDATE bookings 
      SET subtotal = COALESCE(NULLIF(subtotal, 0.00), total_amount),
          final_amount = COALESCE(NULLIF(final_amount, 0.00), total_amount)
      WHERE final_amount = 0.00 OR subtotal = 0.00
    `);
  } catch {}

  console.log("✅ Offers schema migration completed successfully!");
}

if (process.argv[1]?.endsWith("init-offers-schema.ts") || process.argv[1]?.endsWith("init-offers-schema.js")) {
  initOffersSchema().then(() => {
    process.exit(0);
  });
}
