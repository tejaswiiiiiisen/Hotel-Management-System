import "dotenv/config";
import { query } from "../db.js";

export async function migrateRoomsSchema() {
  try {
    console.log("🔄 Updating rooms table schema with room_uid, org_id & multi-tenant indexes...");

    // Create rooms table if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
        name            VARCHAR(255) NOT NULL,
        slug            VARCHAR(255) NOT NULL UNIQUE,
        type            VARCHAR(100) NOT NULL DEFAULT 'Standard',
        price_per_night DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        capacity        INT NOT NULL DEFAULT 2,
        size_sqm        INT DEFAULT 25,
        beds            VARCHAR(100) DEFAULT '1 Double Bed',
        description     TEXT,
        short_description VARCHAR(255) DEFAULT NULL,
        images          LONGTEXT,
        amenities       LONGTEXT,
        policies        LONGTEXT,
        room_number     VARCHAR(50) DEFAULT NULL,
        room_uid        VARCHAR(100) DEFAULT NULL,
        org_id          VARCHAR(50) DEFAULT NULL,
        org_name        VARCHAR(255) DEFAULT 'Matcha Tea',
        floor           VARCHAR(100) DEFAULT NULL,
        room_view       VARCHAR(255) DEFAULT NULL,
        badge           VARCHAR(100) DEFAULT NULL,
        is_popular      BOOLEAN NOT NULL DEFAULT FALSE,
        rating          DECIMAL(3,2) NOT NULL DEFAULT 4.80,
        reviews_count   INT NOT NULL DEFAULT 12,
        available       BOOLEAN NOT NULL DEFAULT TRUE,
        status          VARCHAR(50) NOT NULL DEFAULT 'Available',
        is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
        created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const alterQueries = [
      "ALTER TABLE rooms MODIFY COLUMN type VARCHAR(100) NOT NULL",
      "ALTER TABLE rooms MODIFY COLUMN room_number VARCHAR(100) DEFAULT NULL",
      "ALTER TABLE rooms MODIFY COLUMN floor VARCHAR(100) DEFAULT NULL",
      "ALTER TABLE rooms MODIFY COLUMN images LONGTEXT DEFAULT NULL",
      "ALTER TABLE rooms MODIFY COLUMN amenities LONGTEXT DEFAULT NULL",
      "ALTER TABLE rooms MODIFY COLUMN policies LONGTEXT DEFAULT NULL",
      "ALTER TABLE rooms ADD COLUMN short_description VARCHAR(255) DEFAULT NULL",
      "ALTER TABLE rooms ADD COLUMN room_number VARCHAR(50) DEFAULT NULL",
      "ALTER TABLE rooms ADD COLUMN room_uid VARCHAR(100) DEFAULT NULL",
      "ALTER TABLE rooms ADD COLUMN org_id VARCHAR(50) DEFAULT NULL",
      "ALTER TABLE rooms ADD COLUMN floor VARCHAR(100) DEFAULT NULL",
      "ALTER TABLE rooms ADD COLUMN room_view VARCHAR(255) DEFAULT NULL",
      "ALTER TABLE rooms ADD COLUMN badge VARCHAR(100) DEFAULT NULL",
      "ALTER TABLE rooms ADD COLUMN is_popular BOOLEAN NOT NULL DEFAULT FALSE",
      "ALTER TABLE rooms ADD COLUMN rating DECIMAL(3,2) NOT NULL DEFAULT 4.80",
      "ALTER TABLE rooms ADD COLUMN reviews_count INT NOT NULL DEFAULT 12",
      "ALTER TABLE rooms ADD COLUMN available BOOLEAN NOT NULL DEFAULT TRUE",
      "ALTER TABLE rooms ADD COLUMN org_name VARCHAR(255) DEFAULT 'Matcha Tea'",
      "ALTER TABLE rooms ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Available'",
      "ALTER TABLE rooms ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE",
    ];

    for (const q of alterQueries) {
      try {
        await query(q);
      } catch (err: any) {
        // Ignore column already exists error
      }
    }

    // Ensure `bookings` table has required columns for website & dashboard guest sync
    const bookingAlterQueries = [
      "ALTER TABLE bookings MODIFY COLUMN user_id INT DEFAULT NULL",
      "ALTER TABLE bookings MODIFY COLUMN user_id INT UNSIGNED DEFAULT NULL",
      "ALTER TABLE bookings ADD COLUMN org_id VARCHAR(50) DEFAULT NULL",
      "ALTER TABLE bookings ADD COLUMN guest_name VARCHAR(255) DEFAULT NULL",
      "ALTER TABLE bookings ADD COLUMN guest_phone VARCHAR(100) DEFAULT NULL",
      "ALTER TABLE bookings ADD COLUMN guest_email VARCHAR(255) DEFAULT NULL",
      "ALTER TABLE bookings ADD COLUMN source VARCHAR(50) DEFAULT 'website'",
      "ALTER TABLE bookings ADD COLUMN booked_by VARCHAR(255) DEFAULT NULL",
    ];

    for (const q of bookingAlterQueries) {
      try {
        await query(q);
      } catch (err: any) {
        // Ignore column already exists error
      }
    }

    // Ensure `booking_guests` table exists
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS booking_guests (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          booking_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          relation VARCHAR(100) DEFAULT 'Co-Guest',
          id_type VARCHAR(100) DEFAULT 'Aadhaar Card',
          id_number VARCHAR(100) DEFAULT 'XXXX-XXXX-0000',
          id_status VARCHAR(100) DEFAULT 'Verified & Approved',
          id_doc_name VARCHAR(255) DEFAULT 'ID_Proof.pdf',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    } catch (e) {
      // Ignore table exists error
    }

    // Populate room_number, floor, room_view, badge, is_popular for existing rooms
    await query(`
      UPDATE rooms SET 
        room_number = COALESCE(room_number, '108'),
        floor = COALESCE(floor, '1st Floor'),
        room_view = COALESCE(room_view, 'Garden View'),
        badge = COALESCE(badge, 'Popular'),
        is_popular = TRUE
      WHERE name LIKE '%108%' OR name LIKE '%Garden%'
    `);

    try {
      await query("ALTER TABLE rooms ADD UNIQUE INDEX uq_rooms_room_uid (room_uid)");
    } catch {}
    try {
      await query("ALTER TABLE rooms ADD INDEX idx_rooms_org_id (org_id)");
    } catch {}

    // Backfill org_id for existing rooms
    await query("UPDATE rooms SET org_id = 'MA330', org_name = 'Matcha Tea' WHERE org_id IS NULL AND (org_name IS NULL OR org_name = 'Matcha Tea')");
    await query("UPDATE rooms SET org_id = 'CH560' WHERE org_name = 'Cheery Clothing' AND org_id IS NULL");

    // Backfill room_uid for existing rooms
    const allRooms = await query<any>("SELECT id, room_number, org_id, room_uid FROM rooms");
    for (const r of allRooms) {
      if (!r.room_uid) {
        const orgCode = r.org_id || "MA330";
        const rNum = r.room_number || String(r.id);
        const uid = `${orgCode}-R${rNum}`;
        try {
          await query("UPDATE rooms SET room_uid = ? WHERE id = ?", [uid, r.id]);
        } catch {
          // If collision, append id
          await query("UPDATE rooms SET room_uid = ? WHERE id = ?", [`${uid}-${r.id}`, r.id]);
        }
      }
    }

    // Seed sample rooms for Ajmer (AJ01) and Jaipur (JP01) if not existing
    const branchRooms = [
      {
        room_uid: "AJ01-R101",
        org_id: "AJ01",
        org_name: "Ajmer Branch",
        name: "Ajmer Deluxe King",
        slug: "ajmer-deluxe-king-101",
        type: "Deluxe",
        room_number: "101",
        floor: "1st Floor",
        room_view: "Mountain View",
        price_per_night: 3500,
        capacity: 2,
        size_sqm: 32,
        beds: "1 King Bed",
        status: "Available",
        is_popular: true,
      },
      {
        room_uid: "AJ01-R102",
        org_id: "AJ01",
        org_name: "Ajmer Branch",
        name: "Ajmer Executive Suite",
        slug: "ajmer-executive-suite-102",
        type: "Suite",
        room_number: "102",
        floor: "1st Floor",
        room_view: "Ana Sagar Lake View",
        price_per_night: 5500,
        capacity: 3,
        size_sqm: 48,
        beds: "1 King Bed + Lounge",
        status: "Available",
        is_popular: true,
      },
      {
        room_uid: "JP01-R201",
        org_id: "JP01",
        org_name: "Jaipur Branch",
        name: "Jaipur Royal Heritage Suite",
        slug: "jaipur-royal-heritage-201",
        type: "Presidential Suite",
        room_number: "201",
        floor: "2nd Floor",
        room_view: "Palace View",
        price_per_night: 8500,
        capacity: 4,
        size_sqm: 65,
        beds: "2 Royal King Beds",
        status: "Available",
        is_popular: true,
      },
      {
        room_uid: "JP01-R202",
        org_id: "JP01",
        org_name: "Jaipur Branch",
        name: "Jaipur Luxury Double",
        slug: "jaipur-luxury-double-202",
        type: "Super Deluxe",
        room_number: "202",
        floor: "2nd Floor",
        room_view: "Fort View",
        price_per_night: 4200,
        capacity: 2,
        size_sqm: 36,
        beds: "1 King Bed",
        status: "Available",
        is_popular: false,
      },
    ];

    for (const r of branchRooms) {
      const existing = await query("SELECT id FROM rooms WHERE room_uid = ? OR (org_id = ? AND room_number = ?) LIMIT 1", [r.room_uid, r.org_id, r.room_number]);
      if (existing.length === 0) {
        await query(
          `INSERT INTO rooms 
           (room_uid, org_id, org_name, name, slug, type, room_number, floor, room_view, price_per_night, capacity, size_sqm, beds, status, is_popular, images, amenities) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            r.room_uid,
            r.org_id,
            r.org_name,
            r.name,
            r.slug,
            r.type,
            r.room_number,
            r.floor,
            r.room_view,
            r.price_per_night,
            r.capacity,
            r.size_sqm,
            r.beds,
            r.status,
            r.is_popular,
            JSON.stringify(["https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80"]),
            JSON.stringify(["Free Wi-Fi", "Air Conditioning", "TV", "Room Service", "Private Bathroom"]),
          ]
        );
      }
    }

    console.log("✅ Rooms table schema & branch rooms migration completed successfully!");
  } catch (error: any) {
    console.warn("⚠️ Warning during migrateRoomsSchema:", error.message);
  }
}

if (process.argv[1]?.includes("migrate-rooms-schema")) {
  migrateRoomsSchema().then(() => process.exit(0));
}
