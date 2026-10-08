import express from "express";
import { query } from "../db.js";

const router = express.Router();

// Get all offers (admin/manager) or active offers (public)
router.get("/", async (req, res) => {
  try {
    const { activeOnly, branch_id } = req.query;
    
    let sql = "SELECT * FROM offers WHERE 1=1";
    let params: any[] = [];
    
    if (activeOnly === "true") {
      sql += " AND is_active = TRUE AND (valid_to IS NULL OR valid_to >= CURDATE())";
    }
    
    if (branch_id) {
      sql += " AND (branch_id = ? OR branch_id IS NULL OR branch_id = '')";
      params.push(branch_id);
    }
    
    sql += " ORDER BY created_at DESC";
    
    const offers = await query(sql, params);
    res.json(offers);
  } catch (error: any) {
    console.error("Error fetching offers:", error);
    res.status(500).json({ error: "Failed to fetch offers" });
  }
});

// Create offer
router.post("/", async (req, res) => {
  try {
    const { name, coupon_code, discount_type, discount_value, valid_from, valid_to, branch_id, room_type, room_id, min_nights, is_active } = req.body;
    
    // Check if code exists
    const existing = await query("SELECT id FROM offers WHERE coupon_code = ?", [coupon_code]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Coupon code already exists" });
    }
    
    await query(
      `INSERT INTO offers (name, coupon_code, discount_type, discount_value, valid_from, valid_to, branch_id, room_type, room_id, min_nights, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, coupon_code, discount_type || 'percent', discount_value || 0, valid_from || null, valid_to || null, branch_id || null, room_type || null, room_id || null, min_nights || 1, is_active !== false]
    );
    
    res.json({ message: "Offer created successfully" });
  } catch (error: any) {
    console.error("Error creating offer:", error);
    res.status(500).json({ error: "Failed to create offer" });
  }
});

// Update offer
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, coupon_code, discount_type, discount_value, valid_from, valid_to, branch_id, room_type, room_id, min_nights, is_active } = req.body;
    
    // Check if code exists for another offer
    const existing = await query("SELECT id FROM offers WHERE coupon_code = ? AND id != ?", [coupon_code, id]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Coupon code already exists" });
    }
    
    await query(
      `UPDATE offers SET 
        name = ?, coupon_code = ?, discount_type = ?, discount_value = ?, valid_from = ?, valid_to = ?, 
        branch_id = ?, room_type = ?, room_id = ?, min_nights = ?, is_active = ?
       WHERE id = ?`,
      [name, coupon_code, discount_type, discount_value, valid_from || null, valid_to || null, branch_id || null, room_type || null, room_id || null, min_nights || 1, is_active !== false, id]
    );
    
    res.json({ message: "Offer updated successfully" });
  } catch (error: any) {
    console.error("Error updating offer:", error);
    res.status(500).json({ error: "Failed to update offer" });
  }
});

// Validate coupon code
router.post("/validate", async (req, res) => {
  try {
    const { coupon_code, branch_id, room_id, room_type, nights } = req.body;
    
    if (!coupon_code) return res.status(400).json({ error: "Coupon code is required" });
    
    const offers = await query("SELECT * FROM offers WHERE coupon_code = ? AND is_active = TRUE", [coupon_code]);
    if (offers.length === 0) {
      return res.status(404).json({ error: "Invalid or inactive coupon code" });
    }
    
    const offer = offers[0];
    
    // Check dates
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (offer.valid_from && new Date(offer.valid_from) > today) {
      return res.status(400).json({ error: "This offer is not yet valid" });
    }
    
    if (offer.valid_to && new Date(offer.valid_to) < today) {
      return res.status(400).json({ error: "This offer has expired" });
    }
    
    // Check branch
    if (offer.branch_id && offer.branch_id !== branch_id) {
      return res.status(400).json({ error: "This offer is not valid for the selected branch" });
    }
    
    // Check room id
    if (offer.room_id && offer.room_id != room_id) {
      return res.status(400).json({ error: "This offer is not valid for this room" });
    }
    
    // Check room type
    if (offer.room_type && offer.room_type !== room_type) {
      return res.status(400).json({ error: "This offer is not valid for this room type" });
    }
    
    // Check min nights
    if (offer.min_nights && nights < offer.min_nights) {
      return res.status(400).json({ error: `This offer requires a minimum of ${offer.min_nights} nights` });
    }
    
    res.json({ message: "Coupon applied successfully", offer });
  } catch (error: any) {
    console.error("Error validating offer:", error);
    res.status(500).json({ error: "Failed to validate offer" });
  }
});

export default router;
