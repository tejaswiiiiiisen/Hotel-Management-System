import { Router } from "express";
import { query } from "../db.js";
import { cacheManager } from "../lib/redis.js";
import { publishBookingNotification, publishOTASync } from "../lib/rabbitmq.js";

const router = Router();

// =====================================================
// DATABASE SCHEMA INITIALIZATION & SEEDING
// =====================================================
export async function initOtaTables() {
  try {
    // 1. ota_channels table
    await query(`
      CREATE TABLE IF NOT EXISTS ota_channels (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(191) NOT NULL,
        display_name VARCHAR(191) NOT NULL,
        logo TEXT,
        icon_bg VARCHAR(50) DEFAULT '#3b82f6',
        status VARCHAR(50) NOT NULL DEFAULT 'CONNECTED',
        property_id VARCHAR(100) DEFAULT NULL,
        api_key VARCHAR(255) DEFAULT NULL,
        api_secret VARCHAR(255) DEFAULT NULL,
        commission_rate DECIMAL(5,2) DEFAULT 15.00,
        synced_rooms INT DEFAULT 42,
        total_rooms INT DEFAULT 42,
        live_rate DECIMAL(10,2) DEFAULT 4500.00,
        bookings_30days INT DEFAULT 12,
        revenue_30days DECIMAL(12,2) DEFAULT 54000.00,
        auto_sync_enabled BOOLEAN DEFAULT TRUE,
        sync_interval INT DEFAULT 15,
        sync_error TEXT DEFAULT NULL,
        last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. ota_room_mappings table
    await query(`
      CREATE TABLE IF NOT EXISTS ota_room_mappings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        channel_id VARCHAR(50) NOT NULL,
        room_id INT UNSIGNED NOT NULL,
        channel_room_code VARCHAR(100) NOT NULL,
        channel_room_name VARCHAR(255) NOT NULL,
        rate_multiplier DECIMAL(5,2) DEFAULT 1.15,
        custom_rate DECIMAL(10,2) DEFAULT NULL,
        available_inventory INT DEFAULT 5,
        min_stay INT DEFAULT 1,
        max_stay INT DEFAULT 30,
        stop_sell BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_channel (channel_id),
        INDEX idx_room (room_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. ota_bookings table
    await query(`
      CREATE TABLE IF NOT EXISTS ota_bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_code VARCHAR(100) NOT NULL UNIQUE,
        channel_id VARCHAR(50) NOT NULL,
        channel_name VARCHAR(191) NOT NULL,
        guest_name VARCHAR(255) NOT NULL,
        guest_email VARCHAR(255) DEFAULT NULL,
        guest_phone VARCHAR(100) DEFAULT NULL,
        room_type VARCHAR(191) NOT NULL,
        room_id INT UNSIGNED DEFAULT NULL,
        check_in DATE NOT NULL,
        check_out DATE NOT NULL,
        guests INT DEFAULT 2,
        amount DECIMAL(10,2) NOT NULL,
        commission_amount DECIMAL(10,2) DEFAULT 0.00,
        net_payout DECIMAL(10,2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'CONFIRMED',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_channel_id (channel_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. ota_sync_logs table
    await query(`
      CREATE TABLE IF NOT EXISTS ota_sync_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        log_code VARCHAR(100) NOT NULL,
        channel_id VARCHAR(50) NOT NULL,
        channel_name VARCHAR(191) NOT NULL,
        type VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        rooms_updated INT DEFAULT 0,
        rates_updated INT DEFAULT 0,
        duration_ms INT DEFAULT 0,
        message TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_channel_log (channel_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed default channels if empty
    const existingChannels: any = await query(`SELECT COUNT(*) as count FROM ota_channels`);
    if (existingChannels[0]?.count === 0) {
      await query(`
        INSERT INTO ota_channels 
        (id, name, display_name, logo, icon_bg, status, property_id, live_rate, bookings_30days, revenue_30days, commission_rate)
        VALUES
        ('booking', 'Booking.com', 'Booking.com', 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Booking.com_logo.svg', '#3b82f6', 'CONNECTED', 'PROP-BK-101', 4500.00, 18, 81000.00, 15.00),
        ('agoda', 'Agoda', 'Agoda Global', 'https://cdn6.agoda.net/images/MSE/agoda-logo.svg', '#10b981', 'CONNECTED', 'PROP-AGO-202', 4350.00, 14, 60900.00, 12.00),
        ('expedia', 'Expedia', 'Expedia Group', 'https://www.expediagroup.com/files/live/sites/expediagroup/files/images/expedia-group-logo.svg', '#f59e0b', 'CONNECTED', 'PROP-EXP-303', 4600.00, 10, 46000.00, 18.00),
        ('mmt', 'MakeMyTrip', 'MakeMyTrip India', 'https://imgak.mmtcdn.com/pwa_v3/pwa_commons_assets/desktop/mmt_logo.png', '#ef4444', 'CONNECTED', 'PROP-MMT-404', 4200.00, 22, 92400.00, 14.00),
        ('goibibo', 'Goibibo', 'Goibibo Stays', 'https://static.gocontent.io/goui/assets/images/goibibo-logo.svg', '#8b5cf6', 'CONNECTED', 'PROP-GOI-505', 4100.00, 16, 65600.00, 12.00),
        ('airbnb', 'Airbnb', 'Airbnb Stays', 'https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_B%C3%A9lo.svg', '#ec4899', 'DISCONNECTED', 'PROP-AB-606', 4800.00, 6, 28800.00, 10.00);
      `);
    }

    // Seed default OTA bookings if empty
    const existingBookings: any = await query(`SELECT COUNT(*) as count FROM ota_bookings`);
    if (existingBookings[0]?.count === 0) {
      await query(`
        INSERT INTO ota_bookings 
        (booking_code, channel_id, channel_name, guest_name, room_type, check_in, check_out, guests, amount, commission_amount, net_payout, status)
        VALUES
        ('OTA-BK-9001', 'booking', 'Booking.com', 'Aarav Sharma', 'Deluxe Ocean View', '2026-10-01', '2026-10-04', 2, 13500.00, 2025.00, 11475.00, 'CONFIRMED'),
        ('OTA-AGO-8022', 'agoda', 'Agoda Global', 'Priya Patel', 'Presidential Suite', '2026-10-05', '2026-10-08', 3, 22500.00, 2700.00, 19800.00, 'CONFIRMED'),
        ('OTA-MMT-4011', 'mmt', 'MakeMyTrip India', 'Rohan Gupta', 'Executive King', '2026-10-02', '2026-10-03', 2, 4200.00, 588.00, 3612.00, 'CONFIRMED');
      `);
    }

    // Seed default sync logs if empty
    const existingLogs: any = await query(`SELECT COUNT(*) as count FROM ota_sync_logs`);
    if (existingLogs[0]?.count === 0) {
      await query(`
        INSERT INTO ota_sync_logs
        (log_code, channel_id, channel_name, type, status, rooms_updated, rates_updated, duration_ms, message)
        VALUES
        ('sync-log-1', 'booking', 'Booking.com', 'Inventory & Rates', 'SUCCESS', 42, 6, 920, '2-way room availability and rates synchronized with Booking.com.'),
        ('sync-log-2', 'agoda', 'Agoda Global', 'Reservation Event', 'SUCCESS', 1, 0, 750, 'New booking OTA-AGO-8022 received from Agoda.');
      `);
    }

    console.log("✅ OTA Channel Manager MySQL tables & seed data ready.");
  } catch (err) {
    console.error("⚠️ Error initializing OTA tables:", err);
  }
}

// Call init on module load
initOtaTables();

// =====================================================
// Helper to format OTA channel object for API & React UI
// =====================================================
function formatChannel(c: any) {
  return {
    id: c.id,
    name: c.name,
    displayName: c.display_name,
    logo: c.logo,
    iconBg: c.icon_bg || "#3b82f6",
    status: c.status,
    propertyId: c.property_id,
    syncedRooms: Number(c.synced_rooms || 0),
    totalRooms: Number(c.total_rooms || 42),
    liveRate: Number(c.live_rate || 4200),
    bookings30Days: Number(c.bookings_30days || 0),
    revenue30Days: Number(c.revenue_30days || 0),
    commissionRate: Number(c.commission_rate || 15.00),
    lastSyncedAt: c.last_synced_at,
    autoSyncEnabled: Boolean(c.auto_sync_enabled),
    syncInterval: Number(c.sync_interval || 15),
    syncError: c.sync_error || null,
    active: c.status === "CONNECTED" || c.status === "SYNCING",
  };
}

// =====================================================
// 1. GET ALL OTA CHANNELS (REDIS + MYSQL DB)
// =====================================================
router.get("/channels", async (_req, res) => {
  try {
    const redisKey = "ota:channels:all";
    const cached = await cacheManager.get<any[]>(redisKey);
    if (cached) {
      return res.status(200).json({ success: true, source: "redis_cache", connections: cached });
    }

    const rows: any = await query(`SELECT * FROM ota_channels ORDER BY bookings_30days DESC`);
    const connections = rows.map(formatChannel);

    // Cache in Redis for 5 minutes
    await cacheManager.set(redisKey, connections, 300);

    return res.status(200).json({ success: true, source: "mysql_db", connections });
  } catch (error: any) {
    console.error("❌ Error fetching OTA channels:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch OTA channels" });
  }
});

// =====================================================
// 2. CONNECT / RECONNECT OTA CHANNEL (MYSQL DB + REDIS INVALIDATE)
// =====================================================
router.post("/channels/connect", async (req, res) => {
  try {
    const { channelId, displayName, propertyId, apiKey, apiSecret, autoSync = true } = req.body;
    if (!channelId) {
      return res.status(400).json({ success: false, message: "Channel ID is required" });
    }

    const name = displayName || channelId.charAt(0).toUpperCase() + channelId.slice(1);
    const propId = propertyId || `PROP-${channelId.toUpperCase()}-101`;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    await query(
      `INSERT INTO ota_channels 
       (id, name, display_name, status, property_id, api_key, api_secret, auto_sync_enabled, last_synced_at, sync_error)
       VALUES (?, ?, ?, 'CONNECTED', ?, ?, ?, ?, ?, NULL)
       ON DUPLICATE KEY UPDATE
       display_name = VALUES(display_name),
       status = 'CONNECTED',
       property_id = VALUES(property_id),
       api_key = VALUES(api_key),
       api_secret = VALUES(api_secret),
       auto_sync_enabled = VALUES(auto_sync_enabled),
       last_synced_at = VALUES(last_synced_at),
       sync_error = NULL`,
      [channelId, name, name, propId, apiKey || null, apiSecret || null, autoSync, now]
    );

    // Log connection in ota_sync_logs
    const logCode = `sync-log-${Date.now()}`;
    await query(
      `INSERT INTO ota_sync_logs (log_code, channel_id, channel_name, type, status, rooms_updated, duration_ms, message)
       VALUES (?, ?, ?, 'Connection Initialized', 'SUCCESS', 42, 1100, ?)`,
      [logCode, channelId, name, `Channel connected and synchronized initial 2-way room state in MySQL DB.`]
    );

    // Invalidate Redis caches
    await cacheManager.delPattern("ota:");

    const updatedRow: any = await query(`SELECT * FROM ota_channels WHERE id = ? LIMIT 1`, [channelId]);
    return res.status(200).json({
      success: true,
      message: `${name} is now connected and 2-way synced in MySQL DB.`,
      channel: formatChannel(updatedRow[0]),
    });
  } catch (error: any) {
    console.error("❌ Error connecting OTA channel:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to connect channel" });
  }
});

// =====================================================
// 3. DISCONNECT OTA CHANNEL (MYSQL DB)
// =====================================================
router.post("/channels/disconnect", async (req, res) => {
  try {
    const { channelId } = req.body;
    if (!channelId) {
      return res.status(400).json({ success: false, message: "Channel ID is required" });
    }

    await query(
      `UPDATE ota_channels SET status = 'DISCONNECTED', sync_error = 'Channel manually disconnected by admin' WHERE id = ?`,
      [channelId]
    );

    await cacheManager.delPattern("ota:");

    const updatedRow: any = await query(`SELECT * FROM ota_channels WHERE id = ? LIMIT 1`, [channelId]);
    return res.status(200).json({
      success: true,
      message: `Channel disconnected successfully in MySQL DB.`,
      channel: formatChannel(updatedRow[0]),
    });
  } catch (error: any) {
    console.error("❌ Error disconnecting OTA channel:", error);
    return res.status(500).json({ success: false, message: "Failed to disconnect channel" });
  }
});

// =====================================================
// 4. SYNC NOW ACTION (PERFORM 2-WAY SYNC IN MYSQL DB)
// =====================================================
router.post("/channels/sync", async (req, res) => {
  try {
    const { channelId, forceFail = false } = req.body;
    if (!channelId) {
      return res.status(400).json({ success: false, message: "Channel ID is required" });
    }

    const channelRows: any = await query(`SELECT * FROM ota_channels WHERE id = ? LIMIT 1`, [channelId]);
    if (channelRows.length === 0) {
      return res.status(404).json({ success: false, message: "Channel not found" });
    }

    const channelName = channelRows[0].display_name || channelRows[0].name;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    if (forceFail) {
      await query(
        `UPDATE ota_channels SET status = 'ERROR', sync_error = 'Sync failed: Server response timeout during rate upload.' WHERE id = ?`,
        [channelId]
      );
      await query(
        `INSERT INTO ota_sync_logs (log_code, channel_id, channel_name, type, status, duration_ms, message)
         VALUES (?, ?, ?, 'Inventory & Rates', 'FAILED', 1400, 'Sync failed: Server response timeout during rate upload.')`,
        [`sync-log-${Date.now()}`, channelId, channelName]
      );

      await cacheManager.delPattern("ota:");
      return res.status(500).json({ success: false, message: "Sync failed: Server response timeout during rate upload." });
    }

    // Success sync in MySQL DB
    const totalRoomsCount: any = await query(`SELECT COUNT(*) as count FROM rooms WHERE (is_deleted = FALSE OR is_deleted IS NULL)`);
    const count = Number(totalRoomsCount[0]?.count || 42);

    await query(
      `UPDATE ota_channels SET status = 'CONNECTED', last_synced_at = ?, synced_rooms = ?, sync_error = NULL WHERE id = ?`,
      [now, count, channelId]
    );

    await query(
      `INSERT INTO ota_sync_logs (log_code, channel_id, channel_name, type, status, rooms_updated, rates_updated, duration_ms, message)
       VALUES (?, ?, ?, 'Inventory & Rates', 'SUCCESS', ?, ?, 980, '2-way room availability and rates synchronized with MySQL DB.')`,
      [`sync-log-${Date.now()}`, channelId, channelName, count, count]
    );

    await cacheManager.delPattern("ota:");

    const updatedRow: any = await query(`SELECT * FROM ota_channels WHERE id = ? LIMIT 1`, [channelId]);
    return res.status(200).json({
      success: true,
      message: `2-Way Sync completed for ${channelName} in MySQL DB.`,
      channel: formatChannel(updatedRow[0]),
    });
  } catch (error: any) {
    console.error("❌ Error syncing OTA channel:", error);
    return res.status(500).json({ success: false, message: "Failed to sync channel" });
  }
});

// =====================================================
// 5. GET ALL OTA BOOKINGS (MYSQL DB)
// =====================================================
router.get("/bookings", async (_req, res) => {
  try {
    const redisKey = "ota:bookings:all";
    const cached = await cacheManager.get<any[]>(redisKey);
    if (cached) {
      return res.status(200).json({ success: true, source: "redis_cache", bookings: cached });
    }

    const rows: any = await query(`SELECT * FROM ota_bookings ORDER BY created_at DESC`);
    const bookings = rows.map((b: any) => ({
      id: b.booking_code,
      bookingId: b.booking_code,
      otaChannel: b.channel_id,
      otaChannelName: b.channel_name,
      guestName: b.guest_name,
      guestEmail: b.guest_email || "",
      guestPhone: b.guest_phone || "",
      roomType: b.room_type,
      checkIn: String(b.check_in).slice(0, 10),
      checkOut: String(b.check_out).slice(0, 10),
      guests: Number(b.guests || 2),
      amount: Number(b.amount || 0),
      commissionAmount: Number(b.commission_amount || 0),
      netPayout: Number(b.net_payout || 0),
      status: b.status || "CONFIRMED",
      createdAt: b.created_at,
    }));

    await cacheManager.set(redisKey, bookings, 300);

    return res.status(200).json({ success: true, source: "mysql_db", bookings });
  } catch (error: any) {
    console.error("❌ Error fetching OTA bookings:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch OTA bookings" });
  }
});

// =====================================================
// 6. CREATE / SIMULATE NEW OTA BOOKING (MYSQL DB + INVENTORY DEPLETION)
// =====================================================
router.post("/bookings", async (req, res) => {
  try {
    const { otaChannel, roomType, guestName, checkIn, checkOut, guests, amount } = req.body;

    const channelId = otaChannel || "booking";
    const channelRows: any = await query(`SELECT * FROM ota_channels WHERE id = ? LIMIT 1`, [channelId]);
    const channelName = channelRows[0]?.display_name || "Booking.com";
    const commissionRate = Number(channelRows[0]?.commission_rate || 15.00);

    const bookingCode = `OTA-${channelId.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const rType = roomType || "Deluxe King Room";
    const gName = guestName || "Pooja Sharma";
    const inDate = checkIn || new Date().toISOString().slice(0, 10);
    const outDate = checkOut || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const totalAmount = Number(amount || 9500.00);
    const commAmount = Math.round((totalAmount * (commissionRate / 100)) * 100) / 100;
    const netPayout = totalAmount - commAmount;

    // 1. Insert into MySQL ota_bookings table
    await query(
      `INSERT INTO ota_bookings
       (booking_code, channel_id, channel_name, guest_name, room_type, check_in, check_out, guests, amount, commission_amount, net_payout, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')`,
      [bookingCode, channelId, channelName, gName, rType, inDate, outDate, guests || 2, totalAmount, commAmount, netPayout]
    );

    // 2. Also insert into main hotel bookings table for unified guest management
    try {
      await query(
        `INSERT INTO bookings (booking_code, guest_name, check_in_date, check_out_date, status, source, amount_paid)
         VALUES (?, ?, ?, ?, 'Active Stay', ?, ?)`,
        [bookingCode, gName, inDate, outDate, channelName, totalAmount]
      );
    } catch {}

    // 3. Update room status to Occupied in MySQL rooms table
    await query(
      `UPDATE rooms SET status = 'Occupied', available = FALSE WHERE (type LIKE ? OR name LIKE ?) AND available = TRUE LIMIT 1`,
      [`%${rType}%`, `%${rType}%`]
    );

    // 4. Update 30-day revenue & bookings count for OTA channel in MySQL DB
    await query(
      `UPDATE ota_channels SET bookings_30days = bookings_30days + 1, revenue_30days = revenue_30days + ? WHERE id = ?`,
      [totalAmount, channelId]
    );

    // 5. Insert Sync Audit Log entry
    await query(
      `INSERT INTO ota_sync_logs (log_code, channel_id, channel_name, type, status, rooms_updated, duration_ms, message)
       VALUES (?, ?, ?, 'Reservation Event', 'SUCCESS', 1, 750, ?)`,
      [`sync-log-${Date.now()}`, channelId, channelName, `New reservation ${bookingCode} received. Room availability updated in MySQL DB.`]
    );

    // Invalidate Redis caches
    await cacheManager.delPattern("ota:");
    await cacheManager.delPattern("rooms:");

    // 🐰 Publish async events to RabbitMQ queues
    await publishBookingNotification({
      bookingId: bookingCode,
      guestName: gName,
      roomName: rType,
      amount: totalAmount,
      action: "CREATED",
    });

    await publishOTASync({
      bookingCode,
      channelId,
      roomType: rType,
      action: "SYNC_BOOKING",
      details: { amount: totalAmount, netPayout }
    });

    const newBookingRow: any = await query(`SELECT * FROM ota_bookings WHERE booking_code = ? LIMIT 1`, [bookingCode]);
    return res.status(201).json({
      success: true,
      message: `🎉 Booking ${bookingCode} created and 2-way synced in MySQL DB!`,
      booking: newBookingRow[0],
    });
  } catch (error: any) {
    console.error("❌ Error creating OTA booking:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create booking" });
  }
});

// =====================================================
// 7. CANCEL OTA BOOKING (MYSQL DB + INVENTORY RESTORATION)
// =====================================================
router.post("/bookings/cancel", async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: "Booking ID is required" });
    }

    const bRows: any = await query(`SELECT * FROM ota_bookings WHERE booking_code = ? OR id = ? LIMIT 1`, [bookingId, bookingId]);
    if (bRows.length === 0) {
      return res.status(404).json({ success: false, message: "Booking not found in MySQL DB" });
    }

    const booking = bRows[0];
    if (booking.status === "CANCELLED") {
      return res.status(400).json({ success: false, message: "Booking is already cancelled" });
    }

    // 1. Mark as CANCELLED in MySQL ota_bookings
    await query(`UPDATE ota_bookings SET status = 'CANCELLED' WHERE id = ?`, [booking.id]);

    // 2. Also update main bookings table
    try {
      await query(`UPDATE bookings SET status = 'Cancelled' WHERE booking_code = ?`, [booking.booking_code]);
    } catch {}

    // 3. Restore Room Availability in MySQL rooms table
    await query(
      `UPDATE rooms SET status = 'Available', available = TRUE WHERE (type LIKE ? OR name LIKE ?) AND available = FALSE LIMIT 1`,
      [`%${booking.room_type}%`, `%${booking.room_type}%`]
    );

    // 4. Log Cancellation event to ota_sync_logs
    await query(
      `INSERT INTO ota_sync_logs (log_code, channel_id, channel_name, type, status, rooms_updated, duration_ms, message)
       VALUES (?, ?, ?, 'Cancellation Event', 'SUCCESS', 1, 650, ?)`,
      [`sync-log-${Date.now()}`, booking.channel_id, booking.channel_name, `Reservation ${booking.booking_code} cancelled by guest. Inventory restored in MySQL DB.`]
    );

    await cacheManager.delPattern("ota:");
    await cacheManager.delPattern("rooms:");

    return res.status(200).json({
      success: true,
      message: `Reservation ${booking.booking_code} cancelled & room inventory restored in MySQL DB.`,
    });
  } catch (error: any) {
    console.error("❌ Error cancelling OTA booking:", error);
    return res.status(500).json({ success: false, message: "Failed to cancel booking" });
  }
});

// =====================================================
// 8. GET SYNC AUDIT HISTORY LOGS (MYSQL DB)
// =====================================================
router.get("/history", async (_req, res) => {
  try {
    const redisKey = "ota:history:all";
    const cached = await cacheManager.get<any[]>(redisKey);
    if (cached) {
      return res.status(200).json({ success: true, source: "redis_cache", syncHistory: cached });
    }

    const rows: any = await query(`SELECT * FROM ota_sync_logs ORDER BY timestamp DESC LIMIT 50`);
    const syncHistory = rows.map((r: any) => ({
      id: r.log_code || `log-${r.id}`,
      otaChannelId: r.channel_id,
      otaChannelName: r.channel_name,
      type: r.type,
      status: r.status,
      roomsUpdated: Number(r.rooms_updated || 0),
      ratesUpdated: Number(r.rates_updated || 0),
      durationMs: Number(r.duration_ms || 0),
      timestamp: r.timestamp,
      message: r.message,
    }));

    await cacheManager.set(redisKey, syncHistory, 300);

    return res.status(200).json({ success: true, source: "mysql_db", syncHistory });
  } catch (error: any) {
    console.error("❌ Error fetching OTA sync history:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch sync history" });
  }
});

// =====================================================
// 9. GET DYNAMIC OTA KPI STATS (MYSQL DB)
// =====================================================
router.get("/stats", async (_req, res) => {
  try {
    const channelStats: any = await query(
      `SELECT 
        COUNT(*) as totalConnections,
        SUM(CASE WHEN status = 'CONNECTED' OR status = 'SYNCING' THEN 1 ELSE 0 END) as activeConnections,
        SUM(revenue_30days) as totalRevenue30d,
        SUM(bookings_30days) as totalBookings30d
       FROM ota_channels`
    );

    const s = channelStats[0] || {};
    return res.status(200).json({
      success: true,
      stats: {
        activeConnections: Number(s.activeConnections || 0),
        totalConnections: Number(s.totalConnections || 0),
        totalRevenue30d: Number(s.totalRevenue30d || 0),
        totalBookings30d: Number(s.totalBookings30d || 0),
      }
    });
  } catch (error: any) {
    console.error("❌ Error fetching OTA stats:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch OTA stats" });
  }
});

export default router;
