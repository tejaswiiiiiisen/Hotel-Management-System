import "dotenv/config";
import { query } from "../db.js";

export async function initBookingsSchema() {
  console.log("🔄 Initializing Bookings table & running schema migrations...");

  // Create bookings table if not exists
  await query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
      booking_code    VARCHAR(50) NOT NULL UNIQUE,
      user_id         INT UNSIGNED DEFAULT NULL,
      room_id         INT UNSIGNED NOT NULL,
      room_name       VARCHAR(255) DEFAULT NULL,
      room_number     VARCHAR(50) DEFAULT NULL,
      floor           VARCHAR(50) DEFAULT NULL,
      room_view       VARCHAR(100) DEFAULT NULL,
      location        VARCHAR(255) DEFAULT NULL,
      type            VARCHAR(100) DEFAULT 'Standard',
      status          VARCHAR(50) NOT NULL DEFAULT 'confirmed',
      check_in_date   VARCHAR(50) DEFAULT NULL,
      check_in_time   VARCHAR(50) DEFAULT '14:00',
      check_out_date  VARCHAR(50) DEFAULT NULL,
      check_out_time  VARCHAR(50) DEFAULT '11:00',
      check_in        DATE DEFAULT NULL,
      check_out       DATE DEFAULT NULL,
      nights          INT NOT NULL DEFAULT 1,
      days            INT NOT NULL DEFAULT 1,
      guests          INT NOT NULL DEFAULT 1,
      total_amount    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      amount_paid     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      nightly_rate    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      payment_method  VARCHAR(50) DEFAULT 'pay_at_hotel',
      payment_status  VARCHAR(50) DEFAULT 'Pending',
      image           LONGTEXT DEFAULT NULL,
      amenities       LONGTEXT DEFAULT NULL,
      org_id          VARCHAR(50) DEFAULT 'AS435',
      guest_name      VARCHAR(255) DEFAULT NULL,
      gender          VARCHAR(50) DEFAULT NULL,
      guest_phone     VARCHAR(50) DEFAULT NULL,
      guest_email     VARCHAR(255) DEFAULT NULL,
      id_proof_type   VARCHAR(100) DEFAULT NULL,
      id_proof_number VARCHAR(100) DEFAULT NULL,
      address         TEXT DEFAULT NULL,
      city            VARCHAR(100) DEFAULT NULL,
      state           VARCHAR(100) DEFAULT NULL,
      country         VARCHAR(100) DEFAULT NULL,
      pincode         VARCHAR(20) DEFAULT NULL,
      source          VARCHAR(50) NOT NULL DEFAULT 'website',
      booked_by       VARCHAR(255) DEFAULT NULL,
      offer_id        INT UNSIGNED DEFAULT NULL,
      offer_name      VARCHAR(255) DEFAULT NULL,
      coupon_code     VARCHAR(100) DEFAULT NULL,
      discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      subtotal        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      tax             DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      final_amount    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const alterQueries = [
    "ALTER TABLE bookings ADD COLUMN room_uid VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN room_name VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN room_number VARCHAR(50) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN floor VARCHAR(50) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN room_view VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN location VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN type VARCHAR(100) DEFAULT 'Standard'",
    "ALTER TABLE bookings ADD COLUMN check_in_date VARCHAR(50) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN check_in_time VARCHAR(50) DEFAULT '14:00'",
    "ALTER TABLE bookings ADD COLUMN check_out_date VARCHAR(50) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN check_out_time VARCHAR(50) DEFAULT '11:00'",
    "ALTER TABLE bookings ADD COLUMN nights INT NOT NULL DEFAULT 1",
    "ALTER TABLE bookings ADD COLUMN days INT NOT NULL DEFAULT 1",
    "ALTER TABLE bookings ADD COLUMN amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00",
    "ALTER TABLE bookings ADD COLUMN nightly_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00",
    "ALTER TABLE bookings ADD COLUMN payment_method VARCHAR(50) DEFAULT 'pay_at_hotel'",
    "ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(50) DEFAULT 'Pending'",
    "ALTER TABLE bookings ADD COLUMN image LONGTEXT DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN amenities LONGTEXT DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN org_id VARCHAR(50) DEFAULT 'AS435'",
    "ALTER TABLE bookings ADD COLUMN guest_name VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN gender VARCHAR(50) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN guest_phone VARCHAR(50) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN guest_email VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN id_proof_type VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN id_proof_number VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN address TEXT DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN city VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN state VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN country VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN pincode VARCHAR(20) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN source VARCHAR(50) NOT NULL DEFAULT 'website'",
    "ALTER TABLE bookings ADD COLUMN booked_by VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN offer_id INT UNSIGNED DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN offer_name VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN coupon_code VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00",
    "ALTER TABLE bookings ADD COLUMN subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00",
    "ALTER TABLE bookings ADD COLUMN tax DECIMAL(10,2) NOT NULL DEFAULT 0.00",
    "ALTER TABLE bookings ADD COLUMN final_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00",
    "ALTER TABLE bookings MODIFY COLUMN user_id INT UNSIGNED DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN cancellation_reason TEXT DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN cancellation_fee DECIMAL(10,2) DEFAULT 0.00",
    "ALTER TABLE bookings ADD COLUMN refund_amount DECIMAL(10,2) DEFAULT 0.00",
    "ALTER TABLE bookings ADD COLUMN refund_status VARCHAR(50) DEFAULT NULL",
  ];

  for (const q of alterQueries) {
    try {
      await query(q);
    } catch {}
  }

  // Back-fill check_in_date and check_out_date if missing
  try {
    await query(`
      UPDATE bookings 
      SET check_in_date = COALESCE(check_in_date, DATE_FORMAT(check_in, '%Y-%m-%d')),
          check_out_date = COALESCE(check_out_date, DATE_FORMAT(check_out, '%Y-%m-%d')),
          amount_paid = COALESCE(amount_paid, total_amount),
          nightly_rate = COALESCE(nightly_rate, total_amount)
    `);
  } catch {}

  console.log("✅ Bookings schema migration completed successfully!");
}
