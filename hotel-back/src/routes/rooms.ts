import { Router } from "express";
import { parseBookingDate, checkAndProcessAutoCheckouts } from "./bookings.js";
import fs from "fs";
import path from "path";
import { query, ROOM_COLUMNS } from "../db.js";
import { uploadImageToSupabase } from "../lib/supabase.js";
import { requireAuth, requirePermission } from "../lib/auth.js";
import { cacheManager } from "../lib/redis.js";

const router = Router();

async function processBase64Images(images: unknown): Promise<string[]> {
  if (!images) return [];
  const list = Array.isArray(images) ? images : [images];
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const results = await Promise.all(
    list.map(async (img, idx) => {
      if (typeof img === "string" && img.startsWith("data:image/")) {
        // 1. Try Supabase Storage upload
        const supabaseUrl = await uploadImageToSupabase(img, "rooms");
        if (supabaseUrl) {
          console.log(`✅ Uploaded room image to Supabase Storage: ${supabaseUrl}`);
          return supabaseUrl;
        }

        // 2. Fallback to local disk storage
        try {
          const matches = img.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
          if (matches) {
            const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
            const base64Data = matches[2];
            const filename = `room_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}.${ext}`;
            const filePath = path.join(uploadDir, filename);
            fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
            return `http://localhost:4000/uploads/${filename}`;
          }
        } catch (err) {
          console.warn("Failed to process base64 image locally:", err);
        }
      }
      return String(img);
    })
  );

  return results;
}

interface RoomRow {
  id: number;
  type: string;
  [key: string]: unknown;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ensureRoomFields<T extends Record<string, any>>(r: T): T {
  if (!r) return r;
  let num = r.roomNumber || r.number;
  if (!num && r.name) {
    const match = String(r.name).match(/\d+/);
    if (match) num = match[0];
  }
  if (!num) num = String(r.id);

  let floor = r.floor;
  if (!floor && num) {
    const firstChar = String(num).trim().charAt(0);
    const suffixes: Record<string, string> = {
      "1": "1st Floor",
      "2": "2nd Floor",
      "3": "3rd Floor",
      "4": "4th Floor",
      "5": "5th Floor",
      "6": "6th Floor",
      "7": "7th Floor",
      "8": "8th Floor",
      "9": "9th Floor",
      "10": "10th Floor",
    };
    floor = suffixes[firstChar] || `${firstChar}th Floor`;
  }

  const roomView = r.roomView || r.room_view || "Garden View";
  const rawIsPopular = r.isPopular !== undefined ? r.isPopular : r.is_popular;
  const isPopular = Boolean(rawIsPopular || r.badge === "Popular");
  const badge =
    r.badge !== undefined && r.badge !== null
      ? r.badge
      : isPopular
        ? "Popular"
        : null;
  const capacity = Number(r.capacity || r.guests || 2);
  const price = Number(r.price || r.pricePerNight || r.price_per_night || 2500);
  const shortDescription =
    r.shortDescription ||
    r.short_description ||
    `Executive ${r.type || "room"} on ${floor || "1st Floor"}.`;
  const description =
    r.description ||
    "Enjoy a luxurious stay with premium furnishings and scenic views.";

  let amenities = r.amenities;
  if (typeof amenities === "string") {
    try {
      amenities = JSON.parse(amenities);
    } catch {
      amenities = [];
    }
  }

  let images = r.images;
  if (typeof images === "string") {
    try {
      images = JSON.parse(images);
    } catch {
      images = [];
    }
  }

  let policies = r.policies;
  if (typeof policies === "string") {
    try {
      policies = JSON.parse(policies);
    } catch {
      policies = [];
    }
  }

  const image = Array.isArray(images) && images.length ? images[0] : (r.image || "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80");

  const status = r.status || (r.available === false ? "Occupied" : "Available");
  const available = r.available !== undefined ? Boolean(r.available) : status.toLowerCase() !== "occupied";
  const roomType = r.type || r.roomType || r.room_type || "Standard";

  return {
    ...r,
    roomNumber: String(num),
    number: String(num),
    room_number: String(num),
    type: roomType,
    roomType: roomType,
    room_type: roomType,
    floor: floor || "1st Floor",
    price: price,
    pricePerNight: price,
    price_per_night: price,
    status: status,
    available: available,
    guests: capacity,
    capacity: capacity,
    maxGuests: capacity,
    max_guests: capacity,
    image,
    roomView,
    badge,
    isPopular,
    shortDescription,
    description,
    amenities: Array.isArray(amenities) ? amenities : [],
    images: Array.isArray(images) && images.length ? images : [image],
    policies: Array.isArray(policies) ? policies : [],
  };
}

// Auto backfill room_number, floor, room_view, type schema alterations
(async () => {
  try {
    try {
      await query("ALTER TABLE rooms MODIFY COLUMN type VARCHAR(100) NOT NULL");
      await query("ALTER TABLE rooms MODIFY COLUMN room_number VARCHAR(100) DEFAULT NULL");
      await query("ALTER TABLE rooms MODIFY COLUMN floor VARCHAR(100) DEFAULT NULL");
      await query("ALTER TABLE rooms ADD COLUMN short_description VARCHAR(255) DEFAULT NULL");
      await query("ALTER TABLE rooms DROP INDEX uq_rooms_room_number");
    } catch { }
    const nullRooms = await query<any>("SELECT id, name FROM rooms WHERE room_number IS NULL OR floor IS NULL");
    for (const r of nullRooms) {
      let num = null;
      if (r.name) {
        const match = String(r.name).match(/\d+/);
        if (match) num = match[0];
      }
      if (!num) num = String(r.id);

      const firstChar = String(num).trim().charAt(0);
      const suffixes: Record<string, string> = {
        "1": "1st Floor",
        "2": "2nd Floor",
        "3": "3rd Floor",
        "4": "4th Floor",
        "5": "5th Floor",
        "6": "6th Floor",
        "7": "7th Floor",
        "8": "8th Floor",
      };
      const floor = suffixes[firstChar] || `${firstChar}th Floor`;

      await query(
        "UPDATE rooms SET room_number = ?, floor = COALESCE(floor, ?) WHERE id = ?",
        [num, floor, r.id]
      );
    }
    await query(
      "UPDATE rooms SET room_view = 'Garden View' WHERE room_view IS NULL"
    );
    await query(
      "UPDATE rooms SET short_description = CONCAT('Executive ', type, ' room on ', COALESCE(floor, '1st Floor'), '.') WHERE short_description IS NULL"
    );
    await query(
      "UPDATE rooms SET description = 'Enjoy a luxurious stay with premium furnishings and scenic views.' WHERE description IS NULL"
    );
    await query(
      "UPDATE rooms SET badge = 'Popular' WHERE is_popular = TRUE AND badge IS NULL"
    );
  } catch (e) {
    console.warn("Room backfill check failed:", e);
  }
})();

// GET /api/rooms
router.get("/", async (req, res) => {
  try {
    const orgIdParam = (req.query.orgId as string) || (req.query.org_id as string) || (req.headers["x-org-id"] as string);
    const orgNameParam = (req.query.org as string) || (req.headers["x-org-name"] as string);
    const cacheKey = `rooms:list:${JSON.stringify(req.query)}:${orgIdParam || orgNameParam || 'all'}`;

    // 1. Check Redis RAM Cache
    const redisCached = await cacheManager.get<any[]>(cacheKey);
    if (redisCached) {
      return res.json(redisCached);
    }

    // Automatically release rooms after the checkout date. Checkout day itself
    // remains occupied until the end of that date / manual checkout.
    try {
      await checkAndProcessAutoCheckouts();
    } catch (e: any) {
      console.warn("Auto-checkout process failed:", e.message);
    }
    const where: string[] = ["(is_deleted = FALSE OR is_deleted IS NULL)"];
    const params: unknown[] = [];

    const checkIn = req.query.checkIn as string | undefined;
    const checkOut = req.query.checkOut as string | undefined;
    if (orgIdParam) {
      where.push("(org_id = ? OR org_id IS NULL)");
      params.push(orgIdParam);
    } else if (orgNameParam) {
      where.push("(org_name = ? OR org_name IS NULL)");
      params.push(orgNameParam);
    }

    const locationParam = req.query.location as string | undefined;
    if (locationParam) {
      where.push("org_id IN (SELECT org_id FROM organizations WHERE location = ?)");
      params.push(locationParam);
    }

    if (checkIn && checkOut) {
      where.push(`(id NOT IN (
        SELECT room_id FROM bookings b 
        WHERE b.status != 'Cancelled' AND b.status != 'Completed' AND b.type != 'Previous'
        AND (
          STR_TO_DATE(?, '%Y-%m-%d') < 
          COALESCE(
            CASE 
              WHEN b.check_out_date REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN DATE(b.check_out_date)
              WHEN b.check_out_date REGEXP '^[0-9]{1,2} [a-zA-Z]{3,4} [0-9]{4}' THEN STR_TO_DATE(REPLACE(b.check_out_date, 'Sept', 'Sep'), '%d %b %Y')
            END,
            DATE(b.check_out_date)
          )
          AND
          STR_TO_DATE(?, '%Y-%m-%d') > 
          COALESCE(
            CASE 
              WHEN b.check_in_date REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN DATE(b.check_in_date)
              WHEN b.check_in_date REGEXP '^[0-9]{1,2} [a-zA-Z]{3,4} [0-9]{4}' THEN STR_TO_DATE(REPLACE(b.check_in_date, 'Sept', 'Sep'), '%d %b %Y')
            END,
            DATE(b.check_in_date)
          )
        )
      ))`);
      params.push(checkIn, checkOut);
    } else if (req.query.availableOnly === "true") {
      where.push(`(id NOT IN (
        SELECT room_id FROM bookings b 
        WHERE b.status != 'Cancelled' AND b.status != 'Completed' AND b.type != 'Previous'
        AND (
          CURDATE() < 
          COALESCE(
            CASE 
              WHEN b.check_out_date REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN DATE(b.check_out_date)
              WHEN b.check_out_date REGEXP '^[0-9]{1,2} [a-zA-Z]{3,4} [0-9]{4}' THEN STR_TO_DATE(REPLACE(b.check_out_date, 'Sept', 'Sep'), '%d %b %Y')
            END,
            DATE(b.check_out_date)
          )
          AND
          DATE_ADD(CURDATE(), INTERVAL 1 DAY) > 
          COALESCE(
            CASE 
              WHEN b.check_in_date REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN DATE(b.check_in_date)
              WHEN b.check_in_date REGEXP '^[0-9]{1,2} [a-zA-Z]{3,4} [0-9]{4}' THEN STR_TO_DATE(REPLACE(b.check_in_date, 'Sept', 'Sep'), '%d %b %Y')
            END,
            DATE(b.check_in_date)
          )
        )
      ))`);
    }

    const statusParam = req.query.status as string | undefined;
    if (statusParam && statusParam.toLowerCase() !== "all") {
      if (statusParam.toLowerCase() === "available") {
        where.push("(LOWER(status) = 'available' OR available = TRUE)");
      } else if (statusParam.toLowerCase() === "occupied") {
        where.push("(LOWER(status) = 'occupied' OR available = FALSE)");
      } else {
        where.push("LOWER(status) = ?");
        params.push(statusParam.toLowerCase());
      }
    }

    const type = req.query.type as string | undefined;
    if (type) {
      const types = type.split(",").filter(Boolean);
      if (types.length) {
        where.push(`type IN (${types.map(() => "?").join(", ")})`);
        params.push(...types);
      }
    }

    const guests = Number(req.query.guests);
    if (guests > 0) {
      where.push("capacity >= ?");
      params.push(guests);
    }

    const minPrice = Number(req.query.minPrice);
    const maxPrice = Number(req.query.maxPrice);
    if (minPrice > 0) {
      where.push("price_per_night >= ?");
      params.push(minPrice);
    }
    if (maxPrice > 0) {
      where.push("price_per_night <= ?");
      params.push(maxPrice);
    }

    const amenities = req.query.amenities as string | undefined;
    if (amenities) {
      for (const a of amenities.split(",").filter(Boolean)) {
        where.push("JSON_CONTAINS(amenities, ?)");
        params.push(JSON.stringify(a));
      }
    }

    const sortMap: Record<string, string> = {
      price_asc: "price_per_night ASC",
      price_desc: "price_per_night DESC",
      newest: "created_at DESC, id DESC",
    };
    const orderBy = sortMap[req.query.sort as string] || sortMap.newest;

    const rawRooms = await query<RoomRow>(
      `SELECT ${ROOM_COLUMNS} FROM rooms WHERE ${where.join(" AND ")} ORDER BY ${orderBy}`,
      params
    );

    const checkInQuery = req.query.checkIn as string | undefined;
    const checkOutQuery = req.query.checkOut as string | undefined;

    const rooms = await Promise.all(
      rawRooms.map(async (rawRoom) => {
        const r = ensureRoomFields(rawRoom);

        // If the user requested specific dates, or just requested available rooms,
        // it means the SQL query verified it has NO overlapping bookings for the requested dates or today.
        // Therefore, for the context of this search, the room is available.
        if ((checkInQuery && checkOutQuery) || req.query.availableOnly === "true") {
          r.status = "Available";
          r.available = true;
          r.booking = undefined;
          return r;
        }

        // Query active booking info from MySQL if room is occupied/booked/reserved
        if (
          String(r.status || "").toLowerCase() === "occupied" ||
          String(r.status || "").toLowerCase() === "booked" ||
          String(r.status || "").toLowerCase() === "reserved" ||
          r.available === false
        ) {
          try {
            const activeBookings = await query<any>(
              `SELECT id AS pkId,
                      booking_code AS bookingId,
                      room_uid AS roomUid,
                      guest_name AS guestName,
                      guest_email AS email,
                      guest_phone AS phone,
                      check_in_date AS checkIn,
                      check_out_date AS checkOut,
                      created_at AS createdAt,
                      payment_status AS paymentStatus,
                      payment_method AS paymentMethod,
                      amount_paid AS amountPaid,
                      source,
                      booked_by AS bookedBy
                 FROM bookings
                WHERE (room_uid = ? OR room_id = ? OR room_number = ? OR room_number = ?)
                  AND (status != 'Cancelled' AND status != 'Completed' AND type != 'Previous')
                ORDER BY id DESC LIMIT 1`,
              [r.roomUid || r.room_uid, r.id, r.roomNumber || r.number, `Room ${r.roomNumber || r.number}`]
            );
            if (activeBookings.length > 0) {
              const b = activeBookings[0];
              r.booking = {
                pkId: b.pkId,
                roomUid: b.roomUid || r.roomUid || r.room_uid,
                guestName: b.guestName || "Reserved Guest",
                bookingId: b.bookingId || `#B-${r.id}`,
                checkIn: b.checkIn || "",
                checkOut: b.checkOut || "",
                createdAt: b.createdAt || null,
                email: b.email || "",
                phone: b.phone || "",
                paymentStatus: b.paymentStatus || "",
                paymentMethod: b.paymentMethod || "",
                amountPaid: b.amountPaid || 0,
                source: b.source || "Direct",
                bookedBy: b.bookedBy || "Staff",
              };
            }
          } catch (e) {
            // Ignore booking query error
          }
        }
        return r;
      })
    );

    // Cache in Redis for 5 minutes (300s)
    await cacheManager.set(cacheKey, rooms, 300);

    return res.json(rooms);
  } catch (err) {
    console.error("GET /api/rooms error:", err);
    return res.status(500).json({ error: "Failed to load rooms." });
  }
});

// GET /api/rooms/status/summary & GET /api/rooms/status-summary — room status summary handler
const getRoomStatusSummary = async (req: any, res: any) => {
  try {
    const orgIdParam = (req.query.orgId as string) || (req.query.org_id as string) || (req.headers["x-org-id"] as string);
    const orgNameParam = (req.query.org as string) || (req.headers["x-org-name"] as string);
    let sql = `SELECT ${ROOM_COLUMNS} FROM rooms WHERE (is_deleted = FALSE OR is_deleted IS NULL)`;
    const params: unknown[] = [];
    if (orgIdParam) {
      sql += " AND (org_id = ? OR org_id IS NULL)";
      params.push(orgIdParam);
    } else if (orgNameParam) {
      sql += " AND (org_name = ? OR org_name IS NULL)";
      params.push(orgNameParam);
    }
    sql += " ORDER BY room_number ASC, id ASC";
    const allRoomsRaw = await query<RoomRow>(sql, params);

    const allRooms = allRoomsRaw.map(ensureRoomFields);

    const availableRooms = allRooms.filter(
      (r) =>
        String(r.status || "").toLowerCase() === "available" ||
        (!r.status && r.available)
    );
    const occupiedRooms = allRooms.filter(
      (r) =>
        String(r.status || "").toLowerCase() === "occupied" ||
        (r.status && !r.available)
    );
    const cleaningRooms = allRooms.filter(
      (r) => String(r.status || "").toLowerCase() === "cleaning"
    );

    return res.json({
      summary: {
        totalRooms: allRooms.length,
        availableCount: availableRooms.length,
        occupiedCount: occupiedRooms.length,
        cleaningCount: cleaningRooms.length,
      },
      availableRooms,
      occupiedRooms,
      cleaningRooms,
      allRooms,
    });
  } catch (err) {
    console.error("status summary error:", err);
    return res
      .status(500)
      .json({ error: "Failed to load room status summary." });
  }
};

// Helper to generate 10 rooms for standard or custom floors
export const get10RoomsForFloor = (floorStr: string): string[] => {
  const lower = String(floorStr || "1st Floor").trim().toLowerCase();
  if (lower.includes("ground") || lower.startsWith("g")) {
    return Array.from({ length: 10 }, (_, i) => `G${String(i + 1).padStart(2, "0")}`);
  }
  if (lower.includes("basement") || lower.startsWith("b")) {
    return Array.from({ length: 10 }, (_, i) => `B${String(i + 1).padStart(2, "0")}`);
  }
  if (lower.includes("penthouse") || lower.startsWith("ph")) {
    return Array.from({ length: 10 }, (_, i) => `PH${String(i + 1).padStart(2, "0")}`);
  }
  const match = String(floorStr).match(/\d+/);
  const floorNum = match ? parseInt(match[0], 10) : 1;
  const base = floorNum * 100;
  return Array.from({ length: 10 }, (_, i) => String(base + i + 1));
};

// Schema initialization for branch_floors and floor_room_numbers tables
(async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS branch_floors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        org_id VARCHAR(50) DEFAULT 'MA330',
        floor_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_org_floor (org_id, floor_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed default standard floors
    const defaultFloors = [
      "Ground Floor",
      "1st Floor",
      "2nd Floor",
      "3rd Floor",
      "4th Floor",
      "5th Floor",
      "6th Floor",
      "7th Floor",
      "8th Floor",
      "9th Floor",
      "10th Floor",
    ];
    for (const f of defaultFloors) {
      try {
        await query(
          "INSERT IGNORE INTO branch_floors (org_id, floor_name) VALUES ('MA330', ?)",
          [f]
        );
      } catch { }
    }

    // Also populate any floors present in rooms
    const existingFloors = await query<any>(
      "SELECT DISTINCT org_id, floor FROM rooms WHERE floor IS NOT NULL AND floor <> ''"
    );
    for (const r of existingFloors) {
      if (r.floor) {
        const orgId = r.org_id || "MA330";
        try {
          await query(
            "INSERT IGNORE INTO branch_floors (org_id, floor_name) VALUES (?, ?)",
            [orgId, String(r.floor).trim()]
          );
        } catch { }
      }
    }

    await query(`
      CREATE TABLE IF NOT EXISTS floor_room_numbers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        org_id VARCHAR(50) DEFAULT 'MA330',
        floor VARCHAR(100) NOT NULL DEFAULT '1st Floor',
        room_number VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_org_floor_room (org_id, floor, room_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Backfill any room numbers from rooms table into floor_room_numbers
    const existingRooms = await query<any>(
      "SELECT DISTINCT org_id, floor, room_number FROM rooms WHERE room_number IS NOT NULL AND room_number <> ''"
    );
    for (const r of existingRooms) {
      if (r.room_number) {
        const floor = r.floor || "1st Floor";
        const orgId = r.org_id || "MA330";
        try {
          await query(
            "INSERT IGNORE INTO floor_room_numbers (org_id, floor, room_number) VALUES (?, ?, ?)",
            [orgId, floor, String(r.room_number).trim()]
          );
        } catch { }
      }
    }

    // Seed exactly 10 rooms per floor for standard default floors
    for (const f of defaultFloors) {
      const tenRooms = get10RoomsForFloor(f);
      for (const rNum of tenRooms) {
        try {
          await query(
            "INSERT IGNORE INTO floor_room_numbers (org_id, floor, room_number) VALUES ('MA330', ?, ?)",
            [f, rNum]
          );
        } catch { }
      }
    }
  } catch (e) {
    console.warn("Floor / Room numbers table initialization failed:", e);
  }
})();

// Helper to sort floor names naturally
export function sortFloorNames(floors: string[]): string[] {
  const defaultOrder = [
    "Basement",
    "Lower Ground",
    "Ground Floor",
    "1st Floor",
    "2nd Floor",
    "3rd Floor",
    "4th Floor",
    "5th Floor",
    "6th Floor",
    "7th Floor",
    "8th Floor",
    "9th Floor",
    "10th Floor",
    "11th Floor",
    "12th Floor",
    "13th Floor",
    "14th Floor",
    "15th Floor",
    "16th Floor",
    "17th Floor",
    "18th Floor",
    "19th Floor",
    "20th Floor",
    "Penthouse",
    "Rooftop",
  ];

  return Array.from(new Set(floors)).sort((a, b) => {
    const idxA = defaultOrder.indexOf(a);
    const idxB = defaultOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;

    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });
}

// GET /api/rooms/floors?orgId=MA330
router.get("/floors", async (req, res) => {
  try {
    const orgId =
      (req.query.orgId as string) ||
      (req.query.org_id as string) ||
      (req.headers["x-org-id"] as string) ||
      null;

    let sql = "SELECT floor_name FROM branch_floors";
    const params: unknown[] = [];
    if (orgId) {
      sql += " WHERE (org_id = ? OR org_id IS NULL OR org_id = 'MA330')";
      params.push(orgId);
    }
    const rows = await query<any>(sql, params);
    let floorNames = rows.map((r: any) => String(r.floor_name).trim());

    // Also include any floors from existing rooms in this branch
    let roomsSql = "SELECT DISTINCT floor FROM rooms WHERE (is_deleted = FALSE OR is_deleted IS NULL) AND floor IS NOT NULL AND floor <> ''";
    const roomsParams: unknown[] = [];
    if (orgId) {
      roomsSql += " AND (org_id = ? OR org_id IS NULL)";
      roomsParams.push(orgId);
    }
    const roomFloorRows = await query<any>(roomsSql, roomsParams);
    for (const rf of roomFloorRows) {
      if (rf.floor) floorNames.push(String(rf.floor).trim());
    }

    const sorted = sortFloorNames(Array.from(new Set(floorNames)));

    return res.json({
      success: true,
      orgId,
      floors: sorted,
    });
  } catch (err: any) {
    console.error("GET /api/rooms/floors error:", err);
    return res.status(500).json({ error: "Failed to fetch floors." });
  }
});

// POST /api/rooms/floors
router.post("/floors", async (req, res) => {
  try {
    const { floorName, orgId } = req.body ?? {};
    if (!floorName || !String(floorName).trim()) {
      return res.status(400).json({ error: "Floor name is required." });
    }

    const cleanFloor = String(floorName).trim();
    const cleanOrgId = orgId ? String(orgId).trim() : "MA330";

    const existing = await query<any>(
      "SELECT id FROM branch_floors WHERE floor_name = ? AND (org_id = ? OR (org_id IS NULL AND ? IS NULL)) LIMIT 1",
      [cleanFloor, cleanOrgId, cleanOrgId]
    );

    if (existing.length > 0) {
      return res.status(200).json({
        success: true,
        message: `Floor "${cleanFloor}" is already configured.`,
        floorName: cleanFloor,
        orgId: cleanOrgId,
      });
    }

    await query(
      "INSERT IGNORE INTO branch_floors (org_id, floor_name) VALUES (?, ?)",
      [cleanOrgId, cleanFloor]
    );

    return res.status(201).json({
      success: true,
      message: `Floor "${cleanFloor}" added successfully.`,
      floorName: cleanFloor,
      orgId: cleanOrgId,
    });
  } catch (err: any) {
    console.error("POST /api/rooms/floors error:", err);
    return res.status(500).json({ error: err?.message || "Failed to add floor." });
  }
});

// GET /api/rooms/floor-room-numbers?floor=1st%20Floor&orgId=AJ01
router.get("/floor-room-numbers", async (req, res) => {
  try {
    const floor = (req.query.floor as string) || "1st Floor";
    const orgId = (req.query.orgId as string) || (req.query.org_id as string) || (req.headers["x-org-id"] as string) || null;

    let sql = "SELECT id, org_id, floor, room_number FROM floor_room_numbers WHERE floor = ?";
    const params: unknown[] = [floor];
    if (orgId) {
      sql += " AND (org_id = ? OR org_id IS NULL)";
      params.push(orgId);
    }
    sql += " ORDER BY CAST(room_number AS UNSIGNED) ASC, room_number ASC";

    const configuredRows = await query<any>(sql, params);
    let configuredNumbers = Array.from(new Set(configuredRows.map((r: any) => String(r.room_number).trim())));

    // Guarantee all 10 standard rooms exist for this floor
    const default10 = get10RoomsForFloor(floor);
    for (const num of default10) {
      if (!configuredNumbers.includes(num)) {
        try {
          await query(
            "INSERT IGNORE INTO floor_room_numbers (org_id, floor, room_number) VALUES (?, ?, ?)",
            [orgId || "MA330", floor, num]
          );
          configuredNumbers.push(num);
        } catch { }
      }
    }

    configuredNumbers.sort((a, b) => {
      const nA = Number(a);
      const nB = Number(b);
      if (!isNaN(nA) && !isNaN(nB)) return nA - nB;
      return String(a).localeCompare(String(b));
    });

    // Find assigned room numbers for this floor & branch
    let roomsSql = "SELECT room_number FROM rooms WHERE (is_deleted = FALSE OR is_deleted IS NULL) AND floor = ?";
    const roomsParams: unknown[] = [floor];
    if (orgId) {
      roomsSql += " AND (org_id = ? OR org_id IS NULL)";
      roomsParams.push(orgId);
    }
    const assignedRows = await query<any>(roomsSql, roomsParams);
    const assignedNumbers = new Set(assignedRows.map((r: any) => String(r.room_number).trim()));

    const availableNumbers = configuredNumbers.filter((n) => !assignedNumbers.has(n));

    return res.json({
      success: true,
      floor,
      orgId,
      configuredNumbers,
      assignedNumbers: Array.from(assignedNumbers),
      availableNumbers,
    });
  } catch (err: any) {
    console.error("GET floor-room-numbers error:", err);
    return res.status(500).json({ error: "Failed to fetch floor room numbers." });
  }
});

// POST /api/rooms/floor-room-numbers
router.post("/floor-room-numbers", async (req, res) => {
  try {
    const { floor, roomNumber, orgId } = req.body ?? {};
    if (!floor || !roomNumber || !String(roomNumber).trim()) {
      return res.status(400).json({ error: "Floor and Room Number are required." });
    }

    const cleanNum = String(roomNumber).trim();
    const cleanFloor = String(floor).trim();
    const cleanOrgId = orgId ? String(orgId).trim() : "MA330";

    const existing = await query<any>(
      "SELECT id FROM floor_room_numbers WHERE floor = ? AND room_number = ? AND (org_id = ? OR (org_id IS NULL AND ? IS NULL)) LIMIT 1",
      [cleanFloor, cleanNum, cleanOrgId, cleanOrgId]
    );

    if (existing.length > 0) {
      return res.status(200).json({
        success: true,
        message: `Room number ${cleanNum} is already configured for ${cleanFloor}.`,
        roomNumber: cleanNum,
        floor: cleanFloor,
        orgId: cleanOrgId,
      });
    }

    await query(
      "INSERT IGNORE INTO floor_room_numbers (org_id, floor, room_number) VALUES (?, ?, ?)",
      [cleanOrgId, cleanFloor, cleanNum]
    );

    return res.status(201).json({
      success: true,
      message: `Room number ${cleanNum} added to ${cleanFloor}.`,
      roomNumber: cleanNum,
      floor: cleanFloor,
      orgId: cleanOrgId,
    });
  } catch (err: any) {
    console.error("POST floor-room-numbers error:", err);
    return res.status(500).json({ error: err?.message || "Failed to add room number." });
  }
});

// DELETE /api/rooms/floors
router.delete("/floors", async (req, res) => {
  try {
    const floorName = (req.body?.floorName || req.query.floorName || req.query.floor) as string;
    const orgId = (req.body?.orgId || req.query.orgId || req.query.org_id || req.headers["x-org-id"] || "MA330") as string;

    if (!floorName || !String(floorName).trim()) {
      return res.status(400).json({ error: "Floor name is required." });
    }

    const cleanFloor = String(floorName).trim();

    // Check if any active rooms are currently assigned to this floor in this org
    let checkSql = "SELECT COUNT(*) as count FROM rooms WHERE floor = ? AND (is_deleted = FALSE OR is_deleted IS NULL)";
    const checkParams: unknown[] = [cleanFloor];
    if (orgId) {
      checkSql += " AND (org_id = ? OR org_id IS NULL)";
      checkParams.push(orgId);
    }
    const checkResult = await query<any>(checkSql, checkParams);
    const assignedRoomCount = Number(checkResult[0]?.count || 0);

    if (assignedRoomCount > 0 && req.query.force !== "true") {
      return res.status(400).json({
        error: `Cannot delete "${cleanFloor}" because ${assignedRoomCount} room(s) are currently on this floor. Delete or move the rooms first.`,
        assignedRoomCount,
      });
    }

    // Delete from branch_floors
    await query("DELETE FROM branch_floors WHERE floor_name = ?", [cleanFloor]);

    // Also delete any configured room numbers for this floor
    await query("DELETE FROM floor_room_numbers WHERE floor = ?", [cleanFloor]);

    return res.json({
      success: true,
      message: `Floor "${cleanFloor}" deleted successfully.`,
      floorName: cleanFloor,
    });
  } catch (err: any) {
    console.error("DELETE /api/rooms/floors error:", err);
    return res.status(500).json({ error: err?.message || "Failed to delete floor." });
  }
});

// DELETE /api/rooms/floor-room-numbers
router.delete("/floor-room-numbers", async (req, res) => {
  try {
    const floor = (req.body?.floor || req.query.floor) as string;
    const roomNumber = (req.body?.roomNumber || req.query.roomNumber || req.query.number) as string;
    const orgId = (req.body?.orgId || req.query.orgId || req.query.org_id || req.headers["x-org-id"] || "MA330") as string;

    if (!roomNumber || !String(roomNumber).trim()) {
      return res.status(400).json({ error: "Room number is required." });
    }

    const cleanNum = String(roomNumber).trim();
    const cleanFloor = floor ? String(floor).trim() : null;

    // Check if room number is assigned to an existing active room
    let checkSql = "SELECT id, name FROM rooms WHERE room_number = ? AND (is_deleted = FALSE OR is_deleted IS NULL)";
    const checkParams: unknown[] = [cleanNum];
    if (cleanFloor) {
      checkSql += " AND floor = ?";
      checkParams.push(cleanFloor);
    }
    if (orgId) {
      checkSql += " AND (org_id = ? OR org_id IS NULL)";
      checkParams.push(orgId);
    }
    const checkResult = await query<any>(checkSql, checkParams);

    if (checkResult.length > 0) {
      return res.status(400).json({
        error: `Cannot delete Room Number "${cleanNum}" because it is currently assigned to an active room ("${checkResult[0].name || cleanNum}"). Delete the room first.`,
      });
    }

    let deleteSql = "DELETE FROM floor_room_numbers WHERE room_number = ?";
    const deleteParams: unknown[] = [cleanNum];
    if (cleanFloor) {
      deleteSql += " AND floor = ?";
      deleteParams.push(cleanFloor);
    }
    if (orgId) {
      deleteSql += " AND (org_id = ? OR org_id IS NULL OR org_id = 'MA330')";
      deleteParams.push(orgId);
    }

    await query(deleteSql, deleteParams);

    return res.json({
      success: true,
      message: `Room number "${cleanNum}" deleted successfully.`,
      roomNumber: cleanNum,
      floor: cleanFloor,
    });
  } catch (err: any) {
    console.error("DELETE floor-room-numbers error:", err);
    return res.status(500).json({ error: err?.message || "Failed to delete room number." });
  }
});

// GET /api/rooms/:slug
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const isNumeric = /^\d+$/.test(slug);
    const sql = isNumeric
      ? `SELECT ${ROOM_COLUMNS} FROM rooms WHERE id = ? AND (is_deleted = FALSE OR is_deleted IS NULL) LIMIT 1`
      : `SELECT ${ROOM_COLUMNS} FROM rooms WHERE slug = ? AND (is_deleted = FALSE OR is_deleted IS NULL) LIMIT 1`;
    const roomRows = await query<RoomRow>(sql, [slug]);
    const rawRoom = roomRows[0];
    if (!rawRoom) {
      return res.status(404).json({ error: "Room not found." });
    }
    const room = ensureRoomFields(rawRoom);

    const [reviews, sameType] = await Promise.all([
      query(
        `SELECT id, room_id AS roomId, user_id AS userId, author_name AS authorName,
                rating, comment, created_at AS createdAt
           FROM reviews
          WHERE room_id = ?
          ORDER BY created_at DESC, id DESC`,
        [room.id]
      ).catch((e) => {
        console.warn("Reviews query warning:", e);
        return [];
      }),
      query<RoomRow>(
        `SELECT ${ROOM_COLUMNS}
           FROM rooms
          WHERE id <> ? AND type = ? 
            AND id NOT IN (
              SELECT room_id FROM bookings b 
              WHERE b.status != 'Cancelled' AND b.status != 'Completed' AND b.type != 'Previous'
              AND (
                CURDATE() < COALESCE(CASE WHEN b.check_out_date REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN DATE(b.check_out_date) WHEN b.check_out_date REGEXP '^[0-9]{1,2} [a-zA-Z]{3,4} [0-9]{4}' THEN STR_TO_DATE(REPLACE(b.check_out_date, 'Sept', 'Sep'), '%d %b %Y') END, DATE(b.check_out_date))
                AND DATE_ADD(CURDATE(), INTERVAL 1 DAY) > COALESCE(CASE WHEN b.check_in_date REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN DATE(b.check_in_date) WHEN b.check_in_date REGEXP '^[0-9]{1,2} [a-zA-Z]{3,4} [0-9]{4}' THEN STR_TO_DATE(REPLACE(b.check_in_date, 'Sept', 'Sep'), '%d %b %Y') END, DATE(b.check_in_date))
              )
            )
          LIMIT 3`,
        [room.id, room.type]
      ),
    ]);

    let related = sameType;
    if (related.length < 3) {
      const excludeIds = [room.id, ...related.map((r) => r.id)];
      const filler = await query<RoomRow>(
        `SELECT ${ROOM_COLUMNS}
           FROM rooms
          WHERE id NOT IN (${excludeIds.map(() => "?").join(", ")})
            AND id NOT IN (
              SELECT room_id FROM bookings b 
              WHERE b.status != 'Cancelled' AND b.status != 'Completed' AND b.type != 'Previous'
              AND (
                CURDATE() < COALESCE(CASE WHEN b.check_out_date REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN DATE(b.check_out_date) WHEN b.check_out_date REGEXP '^[0-9]{1,2} [a-zA-Z]{3,4} [0-9]{4}' THEN STR_TO_DATE(REPLACE(b.check_out_date, 'Sept', 'Sep'), '%d %b %Y') END, DATE(b.check_out_date))
                AND DATE_ADD(CURDATE(), INTERVAL 1 DAY) > COALESCE(CASE WHEN b.check_in_date REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN DATE(b.check_in_date) WHEN b.check_in_date REGEXP '^[0-9]{1,2} [a-zA-Z]{3,4} [0-9]{4}' THEN STR_TO_DATE(REPLACE(b.check_in_date, 'Sept', 'Sep'), '%d %b %Y') END, DATE(b.check_in_date))
              )
            )
          LIMIT ?`,
        [...excludeIds, 3 - related.length]
      );
      related = [...related, ...filler];
    }

    return res.json({ room, reviews, related: related.map(ensureRoomFields) });
  } catch (err) {
    console.error("room details error:", err);
    return res.status(500).json({ error: "Failed to load room." });
  }
});

// POST /api/rooms - Add a new room
router.post("/", async (req, res) => {
  try {
    const {
      name: rawName,
      title: rawTitle,
      type = "Standard",
      roomNumber: rawRoomNumber,
      number: rawNumber,
      floor: rawFloor,
      roomView = null,
      shortDescription = null,
      description = null,
      pricePerNight: rawPricePerNight,
      price: rawPrice,
      sizeSqm = 35,
      beds = "1 King Bed",
      images: rawImages,
      image: rawImage,
      amenities = ["Free Wi-Fi", "Air Conditioning", "TV"],
      policies = ["Check-in from 3:00 PM, check-out by 11:00 AM."],
    } = req.body ?? {};

    const roomNumber = rawRoomNumber || rawNumber || null;
    const name =
      rawName || rawTitle || (roomNumber ? `Room ${roomNumber}` : `${type} Room`);

    let floor = rawFloor || null;
    if (!floor && roomNumber) {
      const firstChar = String(roomNumber).trim().charAt(0);
      const suffixes: Record<string, string> = {
        "1": "1st Floor",
        "2": "2nd Floor",
        "3": "3rd Floor",
        "4": "4th Floor",
        "5": "5th Floor",
        "6": "6th Floor",
        "7": "7th Floor",
        "8": "8th Floor",
        "9": "9th Floor",
        "10": "10th Floor",
      };
      floor = suffixes[firstChar] || `${firstChar}th Floor`;
    }

    const pricePerNight =
      rawPricePerNight !== undefined
        ? Number(rawPricePerNight)
        : rawPrice !== undefined
          ? Number(rawPrice)
          : 1500;

    const rawCapacity =
      req.body.capacity !== undefined ? req.body.capacity : req.body.guests;
    const capacity =
      rawCapacity !== undefined &&
        rawCapacity !== null &&
        !isNaN(Number(rawCapacity))
        ? Number(rawCapacity)
        : 2;

    const images =
      rawImages !== undefined && Array.isArray(rawImages) && rawImages.length
        ? rawImages
        : rawImage
          ? [rawImage]
          : [
            "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80",
          ];

    const processedImages = await processBase64Images(images);

    const rawIsPopular =
      req.body.isPopular !== undefined
        ? req.body.isPopular
        : req.body.badge === "Popular";
    const isPopular = Boolean(rawIsPopular);

    const badge =
      req.body.badge !== undefined &&
        req.body.badge !== null &&
        String(req.body.badge).trim() !== ""
        ? String(req.body.badge).trim()
        : isPopular
          ? "Popular"
          : null;

    const finalRoomView = roomView || "Garden View";
    const finalShortDesc =
      shortDescription || `Executive ${type} room on ${floor || "1st Floor"}.`;
    const finalFullDesc =
      description ||
      "Enjoy a luxurious stay with premium furnishings and scenic views.";

    const roomStatus = req.body.status || "Available";
    const roomAvailable =
      roomStatus.toLowerCase() === "occupied"
        ? false
        : req.body.available !== undefined
          ? Boolean(req.body.available)
          : true;

    const slug = slugify(name) + "-" + Math.floor(Math.random() * 10000);

    let orgIdParam = req.body.orgId || req.body.org_id || req.query.orgId || (req.headers["x-org-id"] as string) || null;
    const orgName = req.body.org || req.body.orgName || req.query.org || (req.headers["x-org-name"] as string) || "Matcha Tea";

    if (!orgIdParam && orgName) {
      try {
        const orgRows = await query<any>("SELECT org_id FROM organizations WHERE LOWER(name) = LOWER(?) LIMIT 1", [String(orgName).trim()]);
        if (orgRows.length > 0 && orgRows[0].org_id) {
          orgIdParam = orgRows[0].org_id;
        }
      } catch (e) {
        // Ignore DB lookup error
      }
    }

    const finalOrgCode = orgIdParam || "MA330";
    const finalRoomNum = roomNumber ? String(roomNumber).trim() : null;
    const roomUid = req.body.roomUid || req.body.room_uid || `${finalOrgCode}-R${finalRoomNum || "101"}-${Date.now()}`;

    if (finalRoomNum) {
      const existingRoom = await query<any>(
        `SELECT id FROM rooms 
          WHERE (is_deleted = FALSE OR is_deleted IS NULL) 
            AND room_number = ? 
            AND (org_id = ? OR (org_id IS NULL AND ? IS NULL))
          LIMIT 1`,
        [finalRoomNum, finalOrgCode, finalOrgCode]
      );
      if (existingRoom.length > 0) {
        return res.status(400).json({
          error: `Room number ${finalRoomNum} is already assigned to an existing room on this property.`
        });
      }
    }

    if (roomNumber) {
      const targetRoomNum = String(roomNumber).trim();
      let dupCheckSql = `
        SELECT id FROM rooms
        WHERE (is_deleted = FALSE OR is_deleted IS NULL)
          AND LOWER(TRIM(room_number)) = LOWER(?)
      `;
      const dupParams: unknown[] = [targetRoomNum];

      if (orgIdParam) {
        dupCheckSql += ` AND (org_id = ? OR (org_id IS NULL AND LOWER(org_name) = LOWER(?)))`;
        dupParams.push(orgIdParam, orgName);
      } else if (orgName) {
        dupCheckSql += ` AND LOWER(org_name) = LOWER(?)`;
        dupParams.push(orgName);
      }

      const duplicateRooms = await query<any>(dupCheckSql, dupParams);
      if (duplicateRooms.length > 0) {
        return res.status(400).json({
          error: `Room number "${targetRoomNum}" already exists in this organization. Please use a unique room number.`,
        });
      }
    }

    const result: any = await query(
      `INSERT INTO rooms
         (room_uid, name, slug, type, room_number, floor, room_view, badge, is_popular, short_description, description, price_per_night,
          capacity, size_sqm, beds, images, amenities, policies, rating, reviews_count, available, status, is_deleted, org_name, org_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 5.0, 0, ?, ?, FALSE, ?, ?)`,
      [
        roomUid,
        name,
        slug,
        type,
        roomNumber ? String(roomNumber) : null,
        floor ? String(floor) : "1st Floor",
        finalRoomView,
        badge,
        isPopular,
        finalShortDesc,
        finalFullDesc,
        pricePerNight,
        capacity,
        sizeSqm,
        beds,
        JSON.stringify(processedImages),
        JSON.stringify(Array.isArray(amenities) ? amenities : []),
        JSON.stringify(Array.isArray(policies) ? policies : []),
        roomAvailable,
        roomStatus,
        orgName,
        orgIdParam,
      ]
    );

    const newRoomRaw = (
      await query<RoomRow>(
        `SELECT ${ROOM_COLUMNS} FROM rooms WHERE id = ? LIMIT 1`,
        [result.insertId]
      )
    )[0];

    const newRoom = ensureRoomFields(newRoomRaw);

    // Invalidate Redis caches
    await cacheManager.delPattern("rooms:");
    await cacheManager.delPattern("serp:");

    return res.status(201).json({ message: "Room created.", room: newRoom });
  } catch (err: any) {
    console.error("create room error:", err);
    return res.status(500).json({ error: err?.message || "Failed to create room." });
  }
});

// PUT /api/rooms/:id - Update an existing room in MySQL
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name: rawName,
      title: rawTitle,
      type,
      roomNumber: rawRoomNumber,
      number: rawNumber,
      floor,
      roomView,
      badge,
      isPopular,
      shortDescription,
      description,
      pricePerNight: rawPricePerNight,
      price: rawPrice,
      capacity: rawCapacity,
      guests: rawGuests,
      sizeSqm,
      beds,
      images: rawImages,
      image: rawImage,
      amenities,
      policies,
      available,
      status,
    } = req.body ?? {};

    const roomNumber = rawRoomNumber !== undefined ? rawRoomNumber : rawNumber;
    const pricePerNight =
      rawPricePerNight !== undefined ? rawPricePerNight : rawPrice;
    const capacity = rawCapacity !== undefined ? rawCapacity : rawGuests;
    const images =
      rawImages !== undefined
        ? rawImages
        : rawImage
          ? [rawImage]
          : undefined;

    const name =
      rawName !== undefined
        ? rawName
        : rawTitle !== undefined
          ? rawTitle
          : roomNumber !== undefined
            ? `Room ${roomNumber}`
            : undefined;

    if (roomNumber !== undefined && roomNumber !== null && String(roomNumber).trim() !== "") {
      const targetRoomNum = String(roomNumber).trim();
      let checkOrgId = req.body.orgId || req.body.org_id || (req.headers["x-org-id"] as string) || null;
      let checkOrgName = req.body.org || req.body.orgName || (req.headers["x-org-name"] as string) || null;

      if (!checkOrgId && !checkOrgName) {
        const currentRoom = await query<any>("SELECT org_id, org_name FROM rooms WHERE id = ? LIMIT 1", [id]);
        if (currentRoom.length > 0) {
          checkOrgId = currentRoom[0].org_id;
          checkOrgName = currentRoom[0].org_name;
        }
      }

      let dupCheckSql = `
        SELECT id FROM rooms
        WHERE id <> ?
          AND (is_deleted = FALSE OR is_deleted IS NULL)
          AND LOWER(TRIM(room_number)) = LOWER(?)
      `;
      const dupParams: unknown[] = [id, targetRoomNum];

      if (checkOrgId) {
        dupCheckSql += ` AND (org_id = ? OR (org_id IS NULL AND LOWER(org_name) = LOWER(?)))`;
        dupParams.push(checkOrgId, checkOrgName || "");
      } else if (checkOrgName) {
        dupCheckSql += ` AND LOWER(org_name) = LOWER(?)`;
        dupParams.push(checkOrgName);
      }

      const duplicateRooms = await query<any>(dupCheckSql, dupParams);
      if (duplicateRooms.length > 0) {
        return res.status(400).json({
          error: `Room number "${targetRoomNum}" already exists in this organization. Please use a unique room number.`,
        });
      }
    }

    const updateFields: string[] = [];
    const params: unknown[] = [];

    if (roomNumber !== undefined && roomNumber !== null && String(roomNumber).trim() !== "") {
      const currentOrgResult = await query<any>("SELECT org_id FROM rooms WHERE id = ? LIMIT 1", [id]);
      const currentOrgId = req.body.orgId || req.body.org_id || currentOrgResult[0]?.org_id || null;
      const cleanNum = String(roomNumber).trim();

      const existingOther = await query<any>(
        `SELECT id FROM rooms 
          WHERE (is_deleted = FALSE OR is_deleted IS NULL) 
            AND room_number = ? 
            AND id <> ?
            AND (org_id = ? OR (org_id IS NULL AND ? IS NULL))
          LIMIT 1`,
        [cleanNum, id, currentOrgId, currentOrgId]
      );

      if (existingOther.length > 0) {
        return res.status(400).json({
          error: `Room number ${cleanNum} is already assigned to another room on this property.`
        });
      }
    }

    if (name !== undefined) {
      updateFields.push("name = ?");
      params.push(String(name));
    }
    if (type !== undefined) {
      updateFields.push("type = ?");
      params.push(String(type));
    }
    if (roomNumber !== undefined) {
      updateFields.push("room_number = ?");
      params.push(roomNumber ? String(roomNumber).trim() : null);
    }
    if (floor !== undefined) {
      updateFields.push("floor = ?");
      params.push(String(floor));
    }
    if (roomView !== undefined) {
      updateFields.push("room_view = ?");
      params.push(roomView);
    }
    if (badge !== undefined) {
      updateFields.push("badge = ?");
      params.push(badge);
    }
    if (isPopular !== undefined) {
      updateFields.push("is_popular = ?");
      params.push(Boolean(isPopular));
    }
    if (shortDescription !== undefined) {
      updateFields.push("short_description = ?");
      params.push(shortDescription);
    }
    if (description !== undefined) {
      updateFields.push("description = ?");
      params.push(description);
    }
    if (pricePerNight !== undefined) {
      updateFields.push("price_per_night = ?");
      params.push(Number(pricePerNight));
    }
    if (capacity !== undefined) {
      updateFields.push("capacity = ?");
      params.push(Number(capacity));
    }
    if (sizeSqm !== undefined) {
      updateFields.push("size_sqm = ?");
      params.push(Number(sizeSqm));
    }
    if (beds !== undefined) {
      updateFields.push("beds = ?");
      params.push(String(beds));
    }
    if (available !== undefined) {
      updateFields.push("available = ?");
      params.push(Boolean(available));
    }
    if (images !== undefined) {
      const processedImages = await processBase64Images(images);
      updateFields.push("images = ?");
      params.push(JSON.stringify(processedImages));
    }
    if (amenities !== undefined) {
      updateFields.push("amenities = ?");
      params.push(
        JSON.stringify(Array.isArray(amenities) ? amenities : [amenities])
      );
    }
    if (policies !== undefined) {
      updateFields.push("policies = ?");
      params.push(
        JSON.stringify(Array.isArray(policies) ? policies : [policies])
      );
    }
    if (status !== undefined) {
      updateFields.push("status = ?");
      params.push(String(status));
      if (available === undefined) {
        updateFields.push("available = ?");
        params.push(String(status).toLowerCase() === "available" || String(status).toLowerCase() === "cleaning");
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields provided to update." });
    }

    const oldRoomRaw = (
      await query<any>(
        `SELECT * FROM rooms WHERE id = ? OR room_number = ? LIMIT 1`,
        [id, id]
      )
    )[0];

    await query(`UPDATE rooms SET ${updateFields.join(", ")} WHERE id = ? OR room_number = ?`, [
      ...params,
      id,
      id,
    ]);

    const updatedRoomRaw = (
      await query<any>(
        `SELECT * FROM rooms WHERE id = ? OR room_number = ? LIMIT 1`,
        [id, id]
      )
    )[0];

    const updatedRoom = ensureRoomFields(updatedRoomRaw);

    const { logActivity } = await import("../lib/audit.js");
    logActivity({
      req,
      action: "Updated Room",
      module: "Rooms",
      activity_type: "Update",
      entity_type: "Room",
      entity_id: updatedRoomRaw.id?.toString(),
      old_value: oldRoomRaw,
      new_value: updatedRoomRaw,
      description: `Updated details for room ${updatedRoomRaw.room_number}`
    });

    // Invalidate Redis caches
    await cacheManager.delPattern("rooms:");
    await cacheManager.delPattern("serp:");

    return res.json({
      message: "Room updated successfully.",
      room: updatedRoom,
    });
  } catch (err) {
    console.error("update room error:", err);
    return res.status(500).json({ error: "Failed to update room." });
  }
});

// DELETE /api/rooms/:id - Delete a room from MySQL database
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Determine if id is numeric to query primary key safely
    const isNumericId = !isNaN(Number(id));

    let oldRoomRaw = null;
    if (isNumericId) {
      oldRoomRaw = (await query<any>(`SELECT * FROM rooms WHERE id = ? LIMIT 1`, [Number(id)]))[0];
    }
    if (!oldRoomRaw) {
      oldRoomRaw = (await query<any>(`SELECT * FROM rooms WHERE room_number = ? OR room_uid = ? LIMIT 1`, [id, id]))[0];
    }

    if (!oldRoomRaw) {
      return res.status(404).json({ error: "Room not found." });
    }

    const targetId = oldRoomRaw.id;

    // Try physical hard delete first so row is completely removed from MySQL table
    try {
      await query("DELETE FROM rooms WHERE id = ?", [targetId]);
      console.log(`🗑️ Deleted room #${targetId} from MySQL database.`);
    } catch (e: any) {
      // Fall back to soft delete if foreign key constraint exists
      await query(
        "UPDATE rooms SET is_deleted = 1, available = 0 WHERE id = ?",
        [targetId]
      );
      console.log(`🗑️ Soft-deleted room #${targetId} in MySQL.`);
    }

    const { logActivity } = await import("../lib/audit.js");
    logActivity({
      req,
      action: "Deleted Room",
      module: "Rooms",
      activity_type: "Delete",
      entity_type: "Room",
      entity_id: targetId?.toString(),
      old_value: oldRoomRaw,
      description: `Deleted room ${oldRoomRaw.room_number}`
    });

    // Invalidate Redis caches
    await cacheManager.delPattern("rooms:");
    await cacheManager.delPattern("serp:");

    return res.json({ success: true, message: "Room deleted successfully from MySQL.", id: targetId });
  } catch (err: any) {
    console.error("delete room error:", err);
    return res.status(500).json({ error: "Failed to delete room from database." });
  }
});

export default router;
