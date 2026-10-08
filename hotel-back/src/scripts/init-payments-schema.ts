import "dotenv/config";
import { query } from "../db.js";

export async function initPaymentsSchema() {
  try {
    console.log("🔄 Initializing Payments table in MySQL database...");

    await query(`
      CREATE TABLE IF NOT EXISTS payments (
        id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
        transaction_id   VARCHAR(100) NOT NULL,
        booking_code     VARCHAR(50) NOT NULL,
        user_id          INT UNSIGNED DEFAULT NULL,
        guest_name       VARCHAR(255) NOT NULL,
        guest_email      VARCHAR(255) NOT NULL,
        amount           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        currency         VARCHAR(10) NOT NULL DEFAULT 'INR',
        payment_method   VARCHAR(100) NOT NULL DEFAULT 'UPI Instant Payment',
        status           VARCHAR(50) NOT NULL DEFAULT 'Success',
        invoice_id       VARCHAR(100) NOT NULL,
        org_id           VARCHAR(50) NOT NULL DEFAULT 'CH560',
        created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_tx_id (transaction_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log("✅ Ensured `payments` table exists in MySQL database.");
  } catch (error: any) {
    console.warn("⚠️ Warning during initPaymentsSchema:", error.message);
  }
}
