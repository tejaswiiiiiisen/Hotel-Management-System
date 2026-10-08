import { Router } from "express";
import { query, ROOM_COLUMNS } from "../db.js";
import { requireAuth, type AuthedRequest } from "../lib/auth.js";

const router = Router();

// Auto-initialize wishlists table if not present
export async function initWishlistsSchema() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS wishlists (
        id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id     INT UNSIGNED NOT NULL,
        room_id     INT UNSIGNED NOT NULL,
        branch_id   VARCHAR(255),
        created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_wishlists_user_room (user_id, room_id),
        KEY idx_wishlists_user (user_id),
        KEY idx_wishlists_room (room_id),
        CONSTRAINT fk_wishlists_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT fk_wishlists_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
      await query("ALTER TABLE wishlists ADD COLUMN branch_id VARCHAR(255)").catch(e => { /* ignore */ });
  } catch (err) {
    console.error("Failed to ensure wishlists table exists:", err);
  }
}

// Requires user authentication for all wishlist endpoints
router.use(requireAuth);

// GET /api/wishlist — Get the signed-in user's saved wishlist rooms
router.get("/", async (req: AuthedRequest, res) => {
  try {
    const rooms = await query(
      `SELECT ${ROOM_COLUMNS.replace(/^  ([a-z_]+)/gm, "  r.$1")}
         FROM wishlists w
         JOIN rooms r ON r.id = w.room_id
        WHERE w.user_id = ?
        ORDER BY w.created_at DESC`,
      [req.userId]
    );

    return res.json({ rooms });
  } catch (err) {
    console.error("wishlist list error:", err);
    return res.status(500).json({ error: "Failed to load wishlist." });
  }
});

// POST /api/wishlist — Save a room to the user's wishlist
router.post("/", async (req: AuthedRequest, res) => {
  try {
    const roomId = Number(req.body?.roomId ?? req.body?.id);
    if (!roomId || !Number.isInteger(roomId)) {
      return res.status(400).json({ error: "Valid room id is required." });
    }

    // Verify room exists
    const existingRooms = await query("SELECT id FROM rooms WHERE id = ?", [roomId]);
    if (existingRooms.length === 0) {
      return res.status(404).json({ error: "Room not found." });
    }

    await query(
      "INSERT IGNORE INTO wishlists (user_id, room_id) VALUES (?, ?)",
      [req.userId, roomId]
    );

    return res.status(201).json({ ok: true, roomId });
  } catch (err) {
    console.error("wishlist add error:", err);
    return res.status(500).json({ error: "Failed to add to wishlist." });
  }
});

// DELETE /api/wishlist/:roomId — Remove a room from wishlist
router.delete("/:roomId", async (req: AuthedRequest, res) => {
  try {
    const roomId = Number(req.params.roomId);
    if (!Number.isInteger(roomId)) {
      return res.status(400).json({ error: "Invalid room id." });
    }

    await query(
      "DELETE FROM wishlists WHERE user_id = ? AND room_id = ?",
      [req.userId, roomId]
    );

    return res.json({ ok: true, roomId });
  } catch (err) {
    console.error("wishlist delete error:", err);
    return res.status(500).json({ error: "Failed to remove from wishlist." });
  }
});

// DELETE /api/wishlist — Clear all wishlist items for user
router.delete("/", async (req: AuthedRequest, res) => {
  try {
    await query("DELETE FROM wishlists WHERE user_id = ?", [req.userId]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("wishlist clear error:", err);
    return res.status(500).json({ error: "Failed to clear wishlist." });
  }
});

export default router;
