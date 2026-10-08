import { Router } from "express";
import { query, db } from "../db.js";
import { requireAuth, requireOrgAuth, AuthedRequest } from "../lib/auth.js";
import { cacheManager } from "../lib/redis.js";
import { publishBookingNotification, publishOTASync } from "../lib/rabbitmq.js";
import { broadcastRoomEvent } from "../lib/websocket.js";
import { processNotificationJob } from "../workers/emailWorker.js";


const router = Router();

const BOOKING_COLUMNS = `
  id AS pkId,
  booking_code AS id,
  user_id AS userId,
  room_id AS roomId,
  room_uid AS roomUid,
  room_name AS roomName,
  room_number AS roomNumber,
  floor,
  room_view AS roomView,
  location,
  type,
  status,
  check_in_date AS checkInDate,
  check_in_time AS checkInTime,
  check_out_date AS checkOutDate,
  check_out_time AS checkOutTime,
  nights,
  days,
  guests,
  amount_paid AS amountPaid,
  nightly_rate AS nightlyRate,
  payment_method AS paymentMethod,
  payment_status AS paymentStatus,
  image,
  amenities,
  org_id AS orgId,
  guest_name AS guestName,
  gender,
  guest_phone AS guestPhone,
  guest_email AS guestEmail,
  id_proof_type AS idProofType,
  id_proof_number AS idProofNumber,
  address,
  city,
  state,
  country,
  pincode,
  source,
  booked_by AS bookedBy,
  offer_id AS offerId,
  offer_name AS offerName,
  coupon_code AS couponCode,
  discount_amount AS discountAmount,
  subtotal,
  tax,
  final_amount AS finalAmount,
  cancellation_reason AS cancellationReason,
  cancellation_fee AS cancellationFee,
  refund_amount AS refundAmount,
  refund_status AS refundStatus,
  created_at AS createdAt
`;

export function parseBookingDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const clean = dateStr.trim();
  if (!clean) return null;

  // 1. If ISO format YYYY-MM-DD or YYYY/MM/DD
  if (/^\d{4}[\-\/]\d{1,2}[\-\/]\d{1,2}/.test(clean)) {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) return d;
  }

  // 2. Standard JS Date parse (works for "14 Sep 2026", "Sep 14 2026", etc.)
  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    return d;
  }

  // 3. Handle DD/MM/YYYY, DD-MM-YYYY, DD MMM YYYY, YYYY/MM/DD
  const parts = clean.split(/[\s\/\-\.]+/);
  if (parts.length >= 3) {
    if (parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day);
      }
    } else {
      const day = parseInt(parts[0], 10);
      const monthStr = parts[1].toLowerCase();
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(year)) {
        // Numeric month check (e.g. 09 or 9)
        const numericMonth = parseInt(monthStr, 10);
        if (!isNaN(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
          return new Date(year, numericMonth - 1, day);
        }

        // Textual month lookup
        const monthMap: Record<string, number> = {
          jan: 0, january: 0,
          feb: 1, february: 1,
          mar: 2, march: 2,
          apr: 3, april: 3,
          may: 4,
          jun: 5, june: 5,
          jul: 6, july: 6,
          aug: 7, august: 7,
          sep: 8, sept: 8, september: 8,
          oct: 9, october: 9,
          nov: 10, november: 10,
          dec: 11, december: 11,
        };
        const mIdx = monthMap[monthStr];
        if (mIdx !== undefined) {
          return new Date(year, mIdx, day);
        }
      }
    }
  }

  return null;
}

export async function checkAndProcessAutoCheckouts() {
  try {
    const activeBookings = await query<any>(
      `SELECT id, booking_code, user_id, room_id, room_name, room_number, floor, type, status,
              check_in_date, check_out_date, org_id, guest_name, guest_email, guest_phone
         FROM bookings 
        WHERE status != 'Cancelled' AND status != 'Completed' AND type != 'Previous'`
    );

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const b of activeBookings) {
      const checkIn = parseBookingDate(b.check_in_date);
      const checkOut = parseBookingDate(b.check_out_date);

      if (checkOut) {
        const checkOutDay = new Date(checkOut.getFullYear(), checkOut.getMonth(), checkOut.getDate());

        // Condition 1: Checkout Date Has Arrived or Passed (today >= checkOutDay)
        if (today.getTime() >= checkOutDay.getTime()) {
          console.log(`⏱️ Auto checkout triggered for Booking #${b.booking_code} (Room ${b.room_number || b.room_id})`);

          // 1. Mark Booking Completed / Previous
          await query(
            "UPDATE bookings SET type = 'Previous', status = 'Completed' WHERE id = ?",
            [b.id]
          );

          // 2. Mark Room as 'Cleaning' & unavailable
          if (b.room_id) {
            await query(
              "UPDATE rooms SET status = 'Cleaning', available = FALSE WHERE id = ?",
              [b.room_id]
            );

            // 3. Mark Customer as 'Checked Out'
            await query(
              `UPDATE customers 
                 SET status = 'Checked Out' 
               WHERE room_booked = (SELECT name FROM rooms WHERE id = ?) 
                 AND status != 'Checked Out'`,
              [b.room_id]
            );
          }

          // 4. Create Housekeeping Task for cleaning
          const orgId = b.org_id || "CH560";
          const orgName = orgId === "CH560" ? "Cheery Clothing" : orgId === "AS435" ? "Ashirwad" : "Matcha Tea";
          const roomStr = b.room_name || `Room ${b.room_number || "101"}`;
          const floorStr = b.floor || "1st Floor • Standard Room";
          const taskCode = `HK-AUTO-${Math.floor(1000 + Math.random() * 9000)}`;
          const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

          // Check if task already exists for this room today
          const existingTasks = await query<any>(
            "SELECT id FROM housekeeping_tasks WHERE room = ? AND (status = 'Cleaning' OR status = 'Photo Uploaded')",
            [roomStr]
          );

          if (existingTasks.length === 0) {
            await query(
              `INSERT INTO housekeeping_tasks 
              (org_id, org_name, task_code, room, floor, room_type, staff, staff_email, staff_avatar, status, status_color, status_bg, priority, priority_color, priority_bg, task, last_cleaned, progress, icon, assigned_time, notes, approval_status, status_action_at)
              VALUES (?, ?, ?, ?, ?, 'Standard Room', 'Sunita Devi', 'housekeeping@hotel.com', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80', 'Cleaning', '#d97706', '#fef3c7', 'Urgent Checkout', '#dc2626', '#fee2e2', ?, 'Auto Assigned', 10, '🧹', ?, ?, 'No Photo Uploaded', ?)`,
              [
                orgId,
                orgName,
                taskCode,
                roomStr,
                floorStr,
                `Auto Checkout Room Cleaning & Sanitize (${roomStr})`,
                nowStr,
                `Automated System Alert: Guest ${b.guest_name || "Guest"} checkout date (${b.check_out_date}) reached. Room auto checked-out and assigned to Housekeeping for admin review.`,
                `Today, ${nowStr}`,
              ]
            );
            console.log(`🧹 Housekeeping cleaning task ${taskCode} created automatically for ${roomStr}`);
          }
        }
        // Condition 2: Future Check-In (checkIn > today)
        else if (checkIn) {
          const checkInDay = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate());
          if (today.getTime() < checkInDay.getTime()) {
            if (b.status === 'Active Stay' || b.status === 'Active') {
              await query("UPDATE bookings SET status = 'Upcoming' WHERE id = ?", [b.id]);
            }
            if (b.room_id) {
              const [rm] = await query<any>("SELECT status FROM rooms WHERE id = ?", [b.room_id]);
              if (rm && rm.length > 0 && rm[0].status === 'Occupied') {
                await query("UPDATE rooms SET status = 'Reserved', available = TRUE WHERE id = ?", [b.room_id]);
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("Auto checkout processor warning:", err);
  }
}

// Start periodic interval for background auto-checkouts (runs every 30s)
setInterval(() => {
  checkAndProcessAutoCheckouts().catch(() => { });
}, 30000);

// GET /api/bookings — List all bookings (with optional orgId, status, roomId, roomUid, roomNumber filters)
router.get("/", async (req, res) => {
  try {
    await checkAndProcessAutoCheckouts();
    const orgIdParam = (req.query.orgId as string) || (req.query.org_id as string) || (req.headers["x-org-id"] as string);
    const statusParam = req.query.status as string;
    const roomUidParam = (req.query.roomUid as string) || (req.query.room_uid as string);
    const roomIdParam = (req.query.roomId as string) || (req.query.room_id as string);
    const roomNumberParam = (req.query.roomNumber as string) || (req.query.room_number as string);

    const where: string[] = [];
    const params: unknown[] = [];
    if (orgIdParam && orgIdParam !== "all") {
      where.push("(org_id = ? OR org_id IS NULL OR org_id = '' OR org_id = 'AS435')");
      params.push(orgIdParam);
    }
    if (statusParam && statusParam !== "all") {
      if (statusParam.toLowerCase() === "active stay" || statusParam.toLowerCase() === "active") {
        where.push("(LOWER(status) = 'active stay' OR LOWER(status) = 'active' OR LOWER(status) = 'confirmed')");
      } else {
        where.push("LOWER(status) = ?");
        params.push(statusParam.toLowerCase());
      }
    }
    if (roomUidParam || roomIdParam || roomNumberParam) {
      const cleanNum = roomNumberParam ? roomNumberParam.replace(/[^0-9]/g, "") : "";
      where.push("(room_uid = ? OR room_id = ? OR room_number = ? OR room_number = ?)");
      params.push(
        roomUidParam || "___none___",
        roomIdParam || 0,
        roomNumberParam || "___none___",
        cleanNum ? `Room ${cleanNum}` : "___none___"
      );
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const bookings = await query<any>(
      `SELECT ${BOOKING_COLUMNS}
         FROM bookings ${whereSql}
        ORDER BY bookings.id DESC`,
      params
    );

    for (const b of bookings) {
      if (typeof b.amenities === "string") {
        try { b.amenities = JSON.parse(b.amenities); } catch { }
      } else if (!b.amenities) {
        b.amenities = [];
      }
      b.amountPaid = Number(b.amountPaid);
      b.nightlyRate = Number(b.nightlyRate);
    }

    return res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    console.error("Fetch all bookings error:", err);
    return res.status(500).json({ error: "Failed to fetch bookings." });
  }
});

// GET /api/bookings/room-history/:identifier — Returns complete booking & stay history for a room
router.get("/room-history/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;
    const cleanNum = identifier.replace(/[^0-9]/g, "");

    // Resolve room metadata to match across all identifier formats (id, room_uid, room_number)
    const roomInfo = await query<any>(
      `SELECT id, room_uid, room_number FROM rooms WHERE id = ? OR room_uid = ? OR room_number = ? OR room_number = ? LIMIT 1`,
      [identifier, identifier, identifier, cleanNum ? `Room ${cleanNum}` : identifier]
    );

    let roomId = identifier;
    let roomUid = identifier;
    let roomNum = identifier;
    if (roomInfo.length > 0) {
      roomId = String(roomInfo[0].id);
      roomUid = roomInfo[0].room_uid || identifier;
      roomNum = String(roomInfo[0].room_number || identifier);
    }

    const bookings = await query<any>(
      `SELECT ${BOOKING_COLUMNS}
         FROM bookings
        WHERE room_uid = ? OR room_id = ? OR room_number = ? OR room_number = ? OR room_number = ?
        ORDER BY bookings.id DESC`,
      [roomUid, roomId, roomNum, cleanNum ? `Room ${cleanNum}` : roomNum, `Room ${roomNum}`]
    );

    for (const b of bookings) {
      if (typeof b.amenities === "string") {
        try { b.amenities = JSON.parse(b.amenities); } catch { }
      } else if (!b.amenities) {
        b.amenities = [];
      }
      b.amountPaid = Number(b.amountPaid);
      b.nightlyRate = Number(b.nightlyRate);
    }

    return res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    console.error("Fetch room history error:", err);
    return res.status(500).json({ error: "Failed to fetch room history." });
  }
});

// GET /api/bookings/my-bookings — Returns all bookings for the signed-in user with guest details
router.get("/my-bookings", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId;

    // Fetch user's email to fallback if user_id was null during booking creation
    let userEmail: string | null = null;
    if (userId) {
      const userRows = await query<any>("SELECT email FROM users WHERE id = ?", [userId]);
      if (userRows && userRows.length > 0) userEmail = userRows[0].email;
    }

    const bookings: any[] = await query<any>(
      `SELECT ${BOOKING_COLUMNS}
         FROM bookings 
        WHERE user_id = ? OR (user_id IS NULL AND guest_email IS NOT NULL AND LOWER(guest_email) = LOWER(?))
        ORDER BY bookings.id DESC`,
      [userId, userEmail || "___no_email___"]
    );

    // Backfill missing user_id for future queries
    if (userId && userEmail) {
      await query("UPDATE bookings SET user_id = ? WHERE user_id IS NULL AND LOWER(guest_email) = LOWER(?)", [userId, userEmail]).catch(() => { });
    }

    for (const b of bookings) {
      if (typeof b.amenities === "string") {
        try { b.amenities = JSON.parse(b.amenities); } catch { }
      } else if (!b.amenities) {
        b.amenities = [];
      }
      b.amountPaid = Number(b.amountPaid);
      b.nightlyRate = Number(b.nightlyRate);

      const guestList = await query<any>(
        `SELECT name, relation, id_type AS idType, id_number AS idNumber,
                id_status AS idStatus, id_doc_name AS idDocName
           FROM booking_guests
          WHERE booking_id = ?`,
        [b.pkId]
      );
      b.guestList = guestList || [];
    }

    return res.json({ bookings });
  } catch (err) {
    console.error("Fetch bookings error:", err);
    return res.status(500).json({ error: "Failed to fetch user bookings." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bookings/:id — single booking with full details
// ─────────────────────────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const isCode = String(id).startsWith("RES-") || String(id).startsWith("#B-");

    const bookings: any[] = await query<any>(
      `SELECT ${BOOKING_COLUMNS}
         FROM bookings b
        WHERE ${isCode ? "b.booking_code = ?" : "b.id = ?"}
        LIMIT 1`,
      [id]
    );

    if (!bookings.length) {
      return res.status(404).json({ error: "Booking not found." });
    }

    const b = bookings[0];
    if (typeof b.amenities === "string") {
      try { b.amenities = JSON.parse(b.amenities); } catch { }
    } else if (!b.amenities) {
      b.amenities = [];
    }
    b.amountPaid = Number(b.amountPaid);
    b.nightlyRate = Number(b.nightlyRate);

    const guestList = await query<any>(
      `SELECT name, relation, id_type AS idType, id_number AS idNumber,
              id_status AS idStatus, id_doc_name AS idDocName
         FROM booking_guests
        WHERE booking_id = ?`,
      [b.pkId]
    );
    b.guestList = guestList || [];

    return res.json({ booking: b });
  } catch (err) {
    console.error("Fetch booking error:", err);
    return res.status(500).json({ error: "Failed to fetch booking." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bookings/:id/cancel — Cancel stay, calculate refund, free room & process refund
// ─────────────────────────────────────────────────────────────────────────────
router.post("/:id/cancel", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const { reason = "Guest requested cancellation" } = req.body || {};
    const userId = req.userId;

    let userEmail: string | null = null;
    if (userId) {
      const uRows = await query<any>("SELECT email FROM users WHERE id = ?", [userId]);
      if (uRows && uRows.length > 0) userEmail = uRows[0].email;
    }

    const isCode = String(id).startsWith("RES-") || String(id).startsWith("#B-");
    const bookings: any[] = await query<any>(
      `SELECT id, booking_code, user_id, room_id, room_uid, room_name, room_number, status, 
              amount_paid, payment_status, payment_method, guest_name, guest_email, guest_phone,
              check_in_date, created_at, org_id
         FROM bookings
        WHERE ${isCode ? "booking_code = ?" : "id = ?"}
        LIMIT 1`,
      [id]
    );

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ success: false, error: "Booking record not found." });
    }

    const b = bookings[0];

    // Check ownership
    if (userId && b.user_id && String(b.user_id) !== String(userId)) {
      if (userEmail && String(b.guest_email || "").toLowerCase() !== String(userEmail).toLowerCase()) {
        return res.status(403).json({ success: false, error: "You are not authorized to cancel this booking." });
      }
    }

    const currentStatus = String(b.status || "").toLowerCase();
    if (currentStatus === "cancelled") {
      return res.status(400).json({ success: false, error: "This booking is already cancelled." });
    }
    if (currentStatus === "checked out" || currentStatus === "completed") {
      return res.status(400).json({ success: false, error: "Completed stays cannot be cancelled." });
    }

    // 24-HOUR CANCELLATION POLICY CHECK
    const createdAtTime = b.created_at ? new Date(b.created_at).getTime() : Date.now();
    const elapsedHours = (Date.now() - createdAtTime) / (1000 * 60 * 60);

    const amountPaid = Number(b.amount_paid || 0);
    let cancellationFee = 0;
    let refundAmount = amountPaid;
    let policyNote = "";

    if (elapsedHours <= 24) {
      // Within 24 hours of booking creation: 100% Full Refund
      cancellationFee = 0;
      refundAmount = amountPaid;
      policyNote = "Full 100% Refund (Cancelled within 24-hour free cancellation window)";
    } else {
      // Past 24 hours: Check if check-in is > 48h away
      const checkInParsed = parseBookingDate(b.check_in_date);
      const hoursUntilCheckIn = checkInParsed ? (checkInParsed.getTime() - Date.now()) / (1000 * 60 * 60) : 0;

      if (hoursUntilCheckIn > 48) {
        cancellationFee = Math.round(amountPaid * 0.20 * 100) / 100; // 20% Fee
        refundAmount = Math.max(0, amountPaid - cancellationFee);
        policyNote = "Standard Cancellation Policy (20% Cancellation Fee applied as 24h creation window expired)";
      } else {
        return res.status(400).json({
          success: false,
          error: "Cancellation window expired. Bookings can only be cancelled within 24 hours of booking creation or at least 48 hours prior to check-in."
        });
      }
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Update Booking Status to Cancelled & Refunded
      await conn.query(
        `UPDATE bookings
            SET status = 'Cancelled',
                payment_status = 'Refunded',
                cancellation_reason = ?,
                cancellation_fee = ?,
                refund_amount = ?,
                refund_status = 'Processed'
          WHERE id = ?`,
        [reason, cancellationFee, refundAmount, b.id]
      );

      // 2. Free the Room (Set status = Available, available = TRUE)
      if (b.room_id || b.room_uid) {
        await conn.query(
          "UPDATE rooms SET status = 'Available', available = TRUE WHERE id = ? OR room_uid = ?",
          [b.room_id || 0, b.room_uid || "___no_uid___"]
        );
      }

      // 3. Record Refund Transaction in payments table
      const refundTxId = `REF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const invId = `REF-INV-${b.org_id || "CH560"}-${Math.floor(1000 + Math.random() * 9000)}`;
      await conn.query(
        `INSERT INTO payments 
        (transaction_id, booking_code, user_id, guest_name, guest_email, amount, currency, payment_method, status, invoice_id, org_id)
        VALUES (?, ?, ?, ?, ?, ?, 'INR', ?, 'Refunded', ?, ?)`,
        [
          refundTxId,
          b.booking_code,
          userId || null,
          b.guest_name || "Guest",
          b.guest_email || "guest@mail.com",
          refundAmount,
          b.payment_method || "Original Payment Method",
          invId,
          b.org_id || "AS435",
        ]
      );

      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }

    // 4. Invalidate Redis & RAM Room Caches
    try {
      await cacheManager.delPattern("rooms:");
    } catch {}

    // 5. Broadcast WebSockets Event so all clients update room status to Available instantly
    broadcastRoomEvent({
      event: "ROOM_UPDATED",
      roomId: b.room_id,
      roomUid: b.room_uid,
      roomName: b.room_name,
      status: "Available",
      available: true,
    });

    // 6. Trigger Email & SMS Notification for Refund Confirmation
    processNotificationJob({
      bookingId: b.booking_code,
      guestName: b.guest_name || "Guest",
      guestEmail: b.guest_email || "",
      guestPhone: b.guest_phone || "",
      roomName: b.room_name || "Room",
      amount: refundAmount,
      checkInDate: b.check_in_date || "",
      checkOutDate: "",
      action: "CANCELLED",
    }).catch(() => {});

    return res.json({
      success: true,
      message: `Booking #${b.booking_code} cancelled successfully. Refund of ₹${refundAmount.toLocaleString("en-IN")} processed.`,
      cancellation: {
        bookingCode: b.booking_code,
        status: "Cancelled",
        amountPaid,
        cancellationFee,
        refundAmount,
        refundStatus: "Processed",
        policyNote,
        refundTxId: `REF-${Date.now()}`,
      },
    });
  } catch (err: any) {
    console.error("Cancellation error:", err);
    return res.status(500).json({ success: false, error: err?.message || "Failed to process cancellation." });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bookings — Create a new booking.
// Accepts both website (requireAuth) and dashboard (token optional) bookings.
// After inserting, marks the room as Occupied.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/", requireOrgAuth, async (req: AuthedRequest, res) => {
  try {
    let userId = req.userId;
    if (!userId) {
      const { COOKIE_NAME, verifyToken } = await import("../lib/auth.js");
      const authHeader = req.headers.authorization;
      const token = req.cookies?.[COOKIE_NAME] || (authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null);
      if (token) {
        const payload = verifyToken(token);
        if (payload) userId = payload.sub;
      }
    }

    const {
      roomId,
      roomName,
      roomNumber,
      floor,
      roomView,
      location,
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
      nights,
      days,
      guests,
      amountPaid,
      nightlyRate,
      paymentMethod,
      image,
      amenities,
      guestList,
      orgId,
      // Dashboard walk-in guest fields
      guestName,
      gender,
      guestPhone,
      guestEmail,
      idProofType,
      idProofNumber,
      address,
      city,
      state,
      country,
      pincode,
      source = "website",
      bookedBy,
    } = req.body ?? {};

    if (!userId && guestEmail) {
      const uRows = await query<any>("SELECT id FROM users WHERE LOWER(email) = LOWER(?)", [guestEmail]);
      if (uRows && uRows.length > 0) {
        userId = String(uRows[0].id);
      }
    }

    if (!roomName && !roomId) {
      return res.status(400).json({ error: "Room name or room ID is required." });
    }
    if (!amountPaid && amountPaid !== 0) {
      return res.status(400).json({ error: "Amount paid is required." });
    }

    const orgIdParam = orgId || req.body.org_id || req.query.orgId || (req.headers["x-org-id"] as string) || "AS435";
    const bookingCode = `RES-${Math.floor(10000 + Math.random() * 90000)}`;

    let bookingId: any = null;
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      if (roomId) {
        // Lock the room row to ensure smooth transaction
        await conn.query("SELECT id FROM rooms WHERE id = ? FOR UPDATE", [roomId]);

        const newCheckInStr = checkInDate || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        const newCheckOutStr = checkOutDate || new Date(Date.now() + 86400000 * 2).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

        const checkInParsed = parseBookingDate(newCheckInStr);
        const checkOutParsed = parseBookingDate(newCheckOutStr);

        const newIn = checkInParsed ? checkInParsed.getTime() : NaN;
        const newOut = checkOutParsed ? checkOutParsed.getTime() : NaN;

        if (isNaN(newIn) || isNaN(newOut) || newOut <= newIn) {
          // If invalid date range, default checkOut to checkIn + 1 day
          console.warn("Invalid check-in/check-out range provided, normalizing date range.");
        }
      }

      const checkInParsed = parseBookingDate(checkInDate);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      let initialStatus = 'Active Stay';
      let initialRoomStatus = 'Occupied';
      let initialAvailable = false;

      if (checkInParsed) {
        const checkInMidnight = new Date(checkInParsed.getFullYear(), checkInParsed.getMonth(), checkInParsed.getDate());
        if (todayDate.getTime() < checkInMidnight.getTime()) {
          initialStatus = 'Upcoming';
          initialRoomStatus = 'Reserved';
          initialAvailable = true;
        }
      }

      const roomUidInput = req.body.roomUid || req.body.room_uid || null;

      const guestCountNum = typeof guests === 'number' ? guests : parseInt(String(guests || "1").replace(/[^0-9]/g, ""), 10) || 1;

      const [insertRes] = await conn.query<any>(
        `INSERT INTO bookings 
        (booking_code, user_id, room_id, room_uid, room_name, room_number, floor, room_view, location, type, status, check_in_date, check_in_time, check_out_date, check_out_time, nights, days, guests, amount_paid, nightly_rate, payment_method, payment_status, image, amenities, org_id, guest_name, gender, guest_phone, guest_email, id_proof_type, id_proof_number, address, city, state, country, pincode, source, booked_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Current', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Paid In Full', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bookingCode,
          userId || null,
          roomId || null,
          roomUidInput || null,
          roomName || "Room",
          roomNumber || "101",
          floor || "1st Floor",
          roomView || "Standard View",
          location || "Hotel Property",
          initialStatus,
          checkInDate || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          checkInTime || "02:00 PM",
          checkOutDate || new Date(Date.now() + 86400000 * 2).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          checkOutTime || "11:00 AM",
          nights || 1,
          days || 2,
          guestCountNum,
          amountPaid,
          nightlyRate || amountPaid,
          paymentMethod || "Credit Card",
          image || "/images/rooms/room-1.avif",
          JSON.stringify(amenities || []),
          orgIdParam,
          guestName || null,
          gender || "Prefer not to say",
          guestPhone || null,
          guestEmail || null,
          idProofType || null,
          idProofNumber || null,
          address || null,
          city || null,
          state || null,
          country || null,
          pincode || null,
          source,
          bookedBy || null
        ]
      );

      bookingId = (insertRes as any).insertId;

      // Insert accompanying guests
      if (Array.isArray(guestList)) {
        for (const g of guestList) {
          await conn.query(
            `INSERT INTO booking_guests (booking_id, name, relation, id_type, id_number, id_status, id_doc_name)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              bookingId,
              g.name || "Guest",
              g.relation || "Co-Guest",
              g.idType || "Aadhaar Card",
              g.idNumber || "XXXX-XXXX-0000",
              g.idStatus || "Verified & Approved",
              g.idDocName || "ID_Proof.pdf",
            ]
          );
        }
      }

      // Mark the room status dynamically by room_uid / id
      let assignedRoomId = roomId;
      let assignedRoomUid = req.body.roomUid || req.body.room_uid || null;
      let assignedRoomNumber = roomNumber;

      const cleanNum = String(roomNumber || "").replace(/[^0-9]/g, "");
      const [foundRooms] = await conn.query(
        "SELECT id, room_uid, room_number FROM rooms WHERE room_uid = ? OR id = ? OR room_number = ? OR room_number = ? OR name = ? LIMIT 1",
        [assignedRoomUid || "___no_uid___", roomId || cleanNum || 0, roomNumber, cleanNum, roomName]
      );
      if (Array.isArray(foundRooms) && (foundRooms as any[]).length > 0) {
        const f = (foundRooms as any[])[0];
        assignedRoomId = f.id;
        assignedRoomUid = f.room_uid || assignedRoomUid;
        assignedRoomNumber = f.room_number || assignedRoomNumber;
      }

      if (assignedRoomId || assignedRoomUid) {
        await conn.query(
          "UPDATE rooms SET status = ?, available = ? WHERE id = ? OR room_uid = ?",
          [initialRoomStatus, initialAvailable, assignedRoomId || 0, assignedRoomUid || "___no_uid___"]
        );
        await conn.query(
          "UPDATE bookings SET room_id = ?, room_uid = ?, room_number = ? WHERE id = ?",
          [assignedRoomId || 0, assignedRoomUid, assignedRoomNumber, bookingId]
        );
      }
<<<<<<< HEAD
=======

>>>>>>> 8e293b604b1117f92b001c8e966e779c2fc185c1
      // Sync guest into `customers` table for Admin Panel Customers & Billing tab
      const effectiveOrgId = orgIdParam || "CH560";
      let effectiveOrgName = "Main Branch";
      try {
        const [orgRows]: any = await conn.query("SELECT name FROM organizations WHERE org_id = ?", [effectiveOrgId]);
        if (Array.isArray(orgRows) && orgRows.length > 0) {
          effectiveOrgName = orgRows[0].name;
        }
      } catch (e) {
        effectiveOrgName = effectiveOrgId === "CH560" ? "Cheery Clothing" : effectiveOrgId === "AS435" ? "Ashirwad" : "Matcha Tea";
      }

      const customerCode = `C-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const guestDisplayName = guestName || (Array.isArray(guestList) && guestList[0]?.name) || "Website Guest";
      const guestPhoneVal = guestPhone || "+91 98765 00000";
      const guestEmailVal = guestEmail || `${guestDisplayName.toLowerCase().replace(/\s+/g, "")}@mail.com`;
      const invoiceId = `INV-${effectiveOrgId}-${Math.floor(1000 + Math.random() * 9000)}`;
      const docName = (Array.isArray(guestList) && guestList[0]?.idDocName) || "Aadhaar_Document.pdf";

      const fallbackDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      const safeCheckInDate = checkInDate || fallbackDate;
      const safeCheckOutDate = checkOutDate || fallbackDate;

      try {
        // Check if customer with same name & org_id exists
        const [existingCust]: any = await conn.query(
          "SELECT id, bookings, stays, total_bill, paid_amount FROM customers WHERE org_id = ? AND (LOWER(name) = LOWER(?) OR LOWER(email) = LOWER(?)) LIMIT 1",
          [effectiveOrgId, guestDisplayName.trim(), guestEmailVal.trim()]
        );

        if (Array.isArray(existingCust) && existingCust.length > 0) {
          const c: any = existingCust[0];
          const newBookings = (Number(c.bookings) || 1) + 1;
          const newStays = (Number(c.stays) || 1) + 1;
          const newTotalBill = (Number(c.total_bill) || 0) + (Number(amountPaid) || 2500);
          const newPaidAmount = (Number(c.paid_amount) || 0) + (Number(amountPaid) || 2500);

          await conn.query(
            `UPDATE customers 
                SET bookings = ?, stays = ?, room_booked = ?, check_in = ?, check_out = ?, total_bill = ?, paid_amount = ?, payment_status = 'Paid', last_visit = ?
              WHERE id = ?`,
            [
              newBookings,
              newStays,
              `Room ${roomNumber || "101"}`,
              safeCheckInDate,
              safeCheckOutDate,
              newTotalBill,
              newPaidAmount,
              safeCheckInDate,
              c.id,
            ]
          );
        } else {
          await conn.query(
            `INSERT INTO customers 
            (org_id, org_name, customer_code, name, username, gender, phone, email, bookings, tier, tier_color, tier_bg, tier_icon, points, stays, last_visit, status, room_booked, check_in, check_out, stay_days, guests_count, total_bill, paid_amount, payment_status, invoice_id, document_name, document_type, document_status)
            VALUES (?, ?, ?, ?, ?, 'Male', ?, ?, 1, 'Daily Guest', '#64748b', '#f1f5f9', '👤', '0', 1, ?, 'Active', ?, ?, ?, ?, 1, ?, ?, 'Paid', ?, ?, 'Aadhaar Card', 'Uploaded & Verified')`,
            [
              effectiveOrgId,
              effectiveOrgName,
              customerCode,
              guestDisplayName,
              `@${guestDisplayName.toLowerCase().replace(/\s+/g, "")}`,
              guestPhoneVal,
              guestEmailVal,
              safeCheckInDate,
              `Room ${roomNumber || "101"}`,
              safeCheckInDate,
              safeCheckOutDate,
              nights || 1,
              amountPaid || 2500,
              amountPaid || 2500,
              invoiceId,
              docName,
            ]
          );
        }
      } catch (custErr) {
        console.warn("Customer sync warning in booking:", custErr);
      }

      try {
        // Also record into `payments` table
        const txId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        await conn.query(
          `INSERT INTO payments 
          (transaction_id, booking_code, user_id, guest_name, guest_email, amount, currency, payment_method, status, invoice_id, org_id)
          VALUES (?, ?, ?, ?, ?, ?, 'INR', ?, 'Success', ?, ?)`,
          [
            txId,
            bookingCode,
            userId || null,
            guestDisplayName,
            guestEmailVal,
            amountPaid || 2500,
            paymentMethod || "UPI Instant Payment",
            invoiceId,
            effectiveOrgId,
          ]
        );
      } catch (payErr) {
        console.warn("Payment record warning in booking:", payErr);
      }

      try {
        // Also record guest into `visitors` table for Accountant branch Visitor Records
        let visitDateSql = new Date().toISOString().split("T")[0];
        if (checkInParsed && !isNaN(checkInParsed.getTime())) {
          const y = checkInParsed.getFullYear();
          const m = String(checkInParsed.getMonth() + 1).padStart(2, "0");
          const d = String(checkInParsed.getDate()).padStart(2, "0");
          visitDateSql = `${y}-${m}-${d}`;
        }

        const visitorStatus = initialStatus === "Active Stay" ? "Checked-In" : "Expected";
        const visitorCheckInTime = visitorStatus === "Checked-In" ? new Date() : null;

        await conn.query(
          `INSERT INTO visitors 
          (name, phone, room_number, floor, amount_paid, person_to_meet, purpose, org_id, org_name, status, check_in, check_out, visit_date, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
          [
            guestDisplayName,
            guestPhoneVal,
            roomNumber || "101",
            floor || "1st Floor",
            amountPaid || 2500,
            "Front Desk / Management",
            `Room Booking (${roomName || "Standard Room"})`,
            effectiveOrgId,
            effectiveOrgName,
            visitorStatus,
            visitorCheckInTime,
            visitDateSql,
            `Online Reservation ${bookingCode} via Hotel Website. Stay: ${safeCheckInDate} to ${safeCheckOutDate} (${nights || 1} Nights). Total Paid: ₹${amountPaid || 2500}.`,
          ]
        );
      } catch (visErr) {
        console.warn("Visitor record sync warning in booking:", visErr);
      }

      await conn.commit();

      // Clear Redis RAM & memory cache so all users get fresh room availability
      try {
        await cacheManager.delPattern("rooms:");
      } catch (cacheErr) {
        console.warn("Cache invalidation notice:", cacheErr);
      }

      // ⚡ Broadcast real-time WebSockets event to all connected clients for instant room locking
      broadcastRoomEvent({
        event: "ROOM_LOCKED",
        roomId: assignedRoomId || roomId,
        roomUid: assignedRoomUid,
        roomName: roomName || "Room",
        roomNumber: assignedRoomNumber || roomNumber,
        guestName: guestDisplayName,
        orgId: effectiveOrgId,
        status: initialRoomStatus || "Occupied",
        available: initialAvailable,
        bookingCode,
      });

    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }

<<<<<<< HEAD
    try {
      const { logActivity } = await import("../lib/audit.js");
      logActivity({
        req,
        action: "Created Booking",
        module: "Bookings",
        activity_type: "Create",
        entity_type: "Booking",
        entity_id: bookingId?.toString(),
        description: `Created new booking ${bookingCode} for ${guestName || "Guest"}`
      });
    } catch (e) {}
=======
    const { logActivity } = await import("../lib/audit.js");
    logActivity({
      req,
      action: "Created Booking",
      module: "Bookings",
      activity_type: "Create",
      entity_type: "Booking",
      entity_id: bookingId?.toString(),
      description: `Created new booking ${bookingCode} for ${guestName || "Guest"}`
    });

    // ⚡ Clear Redis cached room listings & rate caches
    await cacheManager.delPattern("rooms:");
    await cacheManager.delPattern("serp:");
>>>>>>> 8e293b604b1117f92b001c8e966e779c2fc185c1

    try {
      // ⚡ Clear Redis cached room listings & rate caches
      await cacheManager.delPattern("rooms:");
      await cacheManager.delPattern("serp:");
    } catch (cacheErr) {
      console.warn("Cache invalidation error (non-fatal):", cacheErr);
    }

    try {
      // 🐰 Publish async events to RabbitMQ queues
      await publishBookingNotification({
        bookingId: String(bookingId || bookingCode),
        guestName: guestName || "Guest",
        guestEmail: guestEmail || undefined,
        guestPhone: guestPhone || undefined,
        roomName: roomName || "Hotel Room",
        amount: Number(amountPaid) || 0,
        checkInDate: checkInDate || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        checkOutDate: checkOutDate || new Date(Date.now() + 86400000 * 2).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        action: "CREATED"
      });

      await publishOTASync({
        bookingCode,
        channelId: source || "direct_website",
        roomType: roomName || "Standard",
        action: "LOCK_ROOM"
      });
    } catch (queueErr) {
      console.warn("Queue publishing error (non-fatal):", queueErr);
    }

    return res.status(201).json({
      message: "Booking created successfully.",
      bookingCode,
      bookingId,
    });
  } catch (err: any) {
    console.error("Create booking error:", err?.message || err);
    return res.status(500).json({ error: "Failed to create booking.", details: err?.message || String(err) });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/bookings/:id/checkin — mark booking as Active Stay, room as Occupied, customer as Checked In
// ─────────────────────────────────────────────────────────────────────────────
router.put("/:id/checkin", async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const orgIdParam = req.headers["x-org-id"] as string;

    await conn.beginTransaction();
    const [bookings] = await conn.query("SELECT id, room_id, org_id, guest_name, guest_phone, guest_email FROM bookings WHERE id = ? OR booking_code = ? LIMIT 1", [id, id]);

    if (!Array.isArray(bookings) || bookings.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: "Booking not found." });
    }

    const booking = (bookings as any[])[0];
    const actualDbId = booking.id;

    if (orgIdParam && booking.org_id && booking.org_id !== orgIdParam) {
      await conn.rollback();
      return res.status(403).json({ error: "Access denied. Booking belongs to a different branch." });
    }

    const roomId = booking.room_id;
    if (roomId) {
      await conn.query("UPDATE rooms SET status = 'Occupied', available = FALSE WHERE id = ?", [roomId]);

      // Update customer status to 'Checked In'
      await conn.query(
        `UPDATE customers SET status = 'Checked In' WHERE org_id = ? AND (LOWER(name) = LOWER(?) OR LOWER(phone) = LOWER(?) OR LOWER(email) = LOWER(?)) AND status != 'Checked In'`,
        [booking.org_id || orgIdParam || "MA330", booking.guest_name, booking.guest_phone || '___no___', booking.guest_email || '___no___']
      );
    }
    await conn.query("UPDATE bookings SET status = 'Active Stay' WHERE id = ?", [actualDbId]);

    await conn.commit();

    // Audit Log
    try {
      const { logActivity } = await import("../lib/audit.js");
      logActivity({
        req,
        action: "Checked In Customer",
        module: "Bookings",
        activity_type: "Update",
        entity_type: "Booking",
        entity_id: id?.toString(),
        description: `Checked in booking ${id}`
      });
    } catch (e) {
      console.warn("Failed to log activity:", e);
    }

    res.json({ message: "Check-in successful." });
  } catch (err) {
    await conn.rollback();
    console.error("Checkin transaction error:", err);
    res.status(500).json({ error: "Check-in failed." });
  } finally {
    conn.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/bookings/:id/checkout — mark booking as Completed, room as Cleaning, customer as Checked Out
// ─────────────────────────────────────────────────────────────────────────────
router.put("/:id/checkout", async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const orgIdParam = req.headers["x-org-id"] as string;

    await conn.beginTransaction();
    const [bookings] = await conn.query("SELECT id, room_id, org_id, guest_name, guest_phone, guest_email FROM bookings WHERE id = ? OR booking_code = ? LIMIT 1", [id, id]);

    if (!Array.isArray(bookings) || bookings.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: "Booking not found." });
    }

    const booking = (bookings as any[])[0];
    const actualDbId = booking.id;

    if (orgIdParam && booking.org_id && booking.org_id !== orgIdParam) {
      await conn.rollback();
      return res.status(403).json({ error: "Access denied. Booking belongs to a different branch." });
    }

    // Update booking status
    await conn.query("UPDATE bookings SET type = 'Previous', status = 'Completed' WHERE id = ?", [actualDbId]);

    const roomId = booking.room_id;
    if (roomId) {
      // Also clean up any ghost active stays for this room
      await conn.query(
        "UPDATE bookings SET type = 'Previous', status = 'Completed' WHERE room_id = ? AND status IN ('Active Stay', 'Active', 'Occupied')",
        [roomId]
      );

      // Reset room availability
      await conn.query("UPDATE rooms SET status = 'Cleaning', available = FALSE WHERE id = ?", [roomId]);

      // Synchronize customer status to 'Checked Out'
      await conn.query(
        `UPDATE customers SET status = 'Checked Out' WHERE org_id = ? AND (LOWER(name) = LOWER(?) OR LOWER(phone) = LOWER(?) OR LOWER(email) = LOWER(?)) AND status != 'Checked Out'`,
        [booking.org_id || orgIdParam || "MA330", booking.guest_name, booking.guest_phone || '___no___', booking.guest_email || '___no___']
      );

      // Create an urgent branch-scoped housekeeping task automatically.
      const [roomsRows] = await conn.query("SELECT name, floor, type FROM rooms WHERE id = ?", [roomId]);
      const rm = (Array.isArray(roomsRows) && roomsRows.length > 0) ? (roomsRows as any[])[0] : {};
      const roomLabel = rm.name || `Room ${roomId}`;

      const [existingTask] = await conn.query(
        "SELECT id FROM housekeeping_tasks WHERE org_id = ? AND room = ? AND status NOT IN ('Cleaned & Approved', 'Cancelled') AND notes LIKE ? LIMIT 1",
        [booking.org_id, roomLabel, `%checkout:${id}%`]
      );

      if (Array.isArray(existingTask) && existingTask.length === 0) {
        const taskCode = `HK-${String(booking.org_id || 'BR').substring(0, 2)}-${Date.now().toString().slice(-6)}`;
        await conn.query(
          `INSERT INTO housekeeping_tasks
           (org_id, org_name, task_code, room, floor, room_type, staff, staff_email, status,
            status_color, status_bg, priority, priority_color, priority_bg, task, last_cleaned,
            progress, icon, assigned_time, notes, approval_status, status_action_at)
           VALUES (?, ?, ?, ?, ?, ?, 'Unassigned', NULL, 'Cleaning', '#d97706', '#fef3c7',
                   'Urgent Checkout', '#dc2626', '#fee2e2', 'Checkout Cleaning & Linen Change',
                   'Checkout Completed', 10, 'Cleaning', 'Now', ?, 'Pending Cleaning', ?)` ,
          [booking.org_id, booking.org_id || '', taskCode, roomLabel, rm.floor || '1st Floor', rm.type || 'Room', `Auto-created after checkout:${id}`, `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`]
        );
      }
    }

    await conn.commit();

    // Audit Log
    try {
      const { logActivity } = await import("../lib/audit.js");
      logActivity({
        req,
        action: "Checked Out Customer",
        module: "Bookings",
        activity_type: "Update",
        entity_type: "Booking",
        entity_id: id?.toString(),
        description: `Checked out booking ${id}`
      });
    } catch (e) {
      console.warn("Failed to log activity:", e);
    }

    res.json({ message: "Check-out successful." });
  } catch (err) {
    await conn.rollback();
    console.error("Checkout transaction error:", err);
    res.status(500).json({ error: "Check-out failed." });
  } finally {
    conn.release();
  }
});

// PATCH /api/bookings/:id/cancel — cancel a booking.
// Resets the room to Available.
// ─────────────────────────────────────────────────────────────────────────────
router.patch("/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;
    const orgIdParam = req.headers["x-org-id"] as string;

    const bookings: any[] = await query<any>(
      "SELECT id, room_id, org_id FROM bookings WHERE id = ? LIMIT 1",
      [id]
    );
    if (!bookings.length) {
      return res.status(404).json({ error: "Booking not found." });
    }

    const booking = bookings[0];

    if (orgIdParam && booking.org_id && booking.org_id !== orgIdParam) {
      return res.status(403).json({ error: "Access denied. Booking belongs to a different branch." });
    }

    await query(
      "UPDATE bookings SET type = 'Cancelled', status = 'Cancelled' WHERE id = ?",
      [id]
    );

    if (booking.room_id) {
      await query(
        "UPDATE rooms SET status = 'Available', available = TRUE WHERE id = ?",
        [booking.room_id]
      );
    }

    const { logActivity } = await import("../lib/audit.js");
    logActivity({
      req,
      action: "Cancelled Booking",
      module: "Bookings",
      activity_type: "Update",
      entity_type: "Booking",
      entity_id: id?.toString(),
      description: `Cancelled booking ${id}`
    });

    return res.json({ message: "Booking cancelled successfully." });
  } catch (err) {
    console.error("Cancel booking error:", err);
    return res.status(500).json({ error: "Failed to cancel booking." });
  }
});

export default router;


