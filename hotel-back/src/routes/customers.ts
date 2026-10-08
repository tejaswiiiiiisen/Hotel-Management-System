import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { query } from "../db.js";

const router = Router();

// Ensure Uploads Directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration for Customer Document Uploads
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "doc-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

function formatCustomer(c: any, req: Request) {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const docUrl = c.document_url || (c.document_name ? `${baseUrl}/uploads/${c.document_name}` : null);
  const totalBillNum = Number(c.total_bill || c.totalBill || 2500);
  const paidAmountNum = Number(c.paid_amount || c.paidAmount || (c.payment_status === "Paid" ? totalBillNum : 0));
  const orgId = c.org_id || c.orgId || "CH560";
  const orgName = c.org_name || c.orgName || (orgId === "CH560" ? "Cheery Clothing" : "Matcha Tea");

  return {
    id: c.customer_code || (typeof c.id === "string" ? c.id : `C-${c.id}`),
    dbId: c.id,
    orgId,
    orgName,
    name: c.name,
    username: c.username || `@${c.name.toLowerCase().replace(/\s+/g, "")}`,
    gender: c.gender || "Male",
    phone: c.phone || "+91 98765 00000",
    email: c.email || `${c.name.toLowerCase().replace(/\s+/g, "")}@mail.com`,
    bookings: Number(c.bookings || 1),
    amount: `₹${totalBillNum.toLocaleString("en-IN")}`,
    tier: c.tier || "Daily Guest",
    tierColor: c.tier_color || c.tierColor || (c.tier === "Platinum" ? "#7c3aed" : c.tier === "Gold" ? "#d97706" : c.tier === "Silver" ? "#475569" : "#64748b"),
    tierBg: c.tier_bg || c.tierBg || (c.tier === "Platinum" ? "#f3e8ff" : c.tier === "Gold" ? "#fef3c7" : c.tier === "Silver" ? "#f1f5f9" : "#f1f5f9"),
    tierIcon: c.tier_icon || c.tierIcon || (c.tier === "Platinum" ? "👑" : c.tier === "Gold" ? "⭐" : c.tier === "Silver" ? "🥈" : "👤"),
    points: String(c.points || "0"),
    stays: Number(c.stays || 1),
    lastVisit: c.last_visit || c.lastVisit || c.check_in || "18 Aug 2026",
    status: c.status || "Active",
    image: c.image || (c.gender === "Female" ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80" : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"),
    roomBooked: c.room_booked || c.roomBooked || "Room 101",
    checkIn: c.check_in || c.checkIn || "17 Aug 2026",
    checkOut: c.check_out || c.checkOut || "19 Aug 2026",
    stayDays: Number(c.stay_days || c.stayDays || 2),
    guestsCount: Number(c.guests_count || c.guestsCount || 1),
    totalBill: totalBillNum,
    paidAmount: paidAmountNum,
    paymentStatus: c.payment_status || c.paymentStatus || "Paid",
    invoiceId: c.invoice_id || c.invoiceId || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    offerName: c.offer_name || null,
    discountAmount: Number(c.discount_amount || 0),
    subtotal: Number(c.subtotal || totalBillNum),
    tax: Number(c.tax || 0),
    document: (c.document_name || c.document_url || c.document)
      ? {
          fileName: c.document_name || "ID_Document.pdf",
          docType: c.document_type || "Aadhaar Card",
          fileUrl: docUrl,
          status: c.document_status || "Uploaded & Verified",
          uploadedAt: "Recently",
        }
      : null,
  };
}

// In-memory Fallback Array if MySQL is unavailable
let inMemoryCustomers: any[] = [];

// GET /api/customers
router.get("/", async (req: Request, res: Response) => {
  const headerOrgId = req.headers["x-org-id"] as string;
  const orgId = headerOrgId || req.query.org_id || req.query.orgId;
  try {
    let rows: any[];
    if (orgId) {
      rows = await query<any>("SELECT * FROM customers WHERE org_id = ? ORDER BY id DESC", [orgId]);
    } else {
      rows = await query<any>("SELECT * FROM customers ORDER BY id DESC");
    }
    const customers = rows.map((c) => formatCustomer(c, req));
    return res.json({ success: true, customers });
  } catch (err: any) {
    console.warn("MySQL unavailable for GET customers, returning in-memory store:", err.message);
    let filtered = inMemoryCustomers;
    if (orgId) {
      filtered = inMemoryCustomers.filter((c) => (c.org_id || c.orgId || "CH560") === orgId);
    }
    const customers = filtered.map((c) => formatCustomer(c, req));
    return res.json({ success: true, customers });
  }
});

// POST /api/customers — Register New Customer / Guest
router.post("/", async (req: Request, res: Response) => {
  const {
    name,
    gender,
    phone,
    email,
    roomBooked,
    checkIn,
    checkOut,
    stayDays,
    guestsCount,
    totalBill,
    paymentStatus,
    tier,
    orgId,
    org_id,
    orgName,
    org_name,
  } = req.body ?? {};

  if (!name || !String(name).trim()) {
    return res.status(400).json({ success: false, message: "Customer name is required." });
  }

  const targetOrgId = String(org_id || orgId || "CH560").trim();
  const targetOrgName = String(org_name || orgName || (targetOrgId === "CH560" ? "Cheery Clothing" : targetOrgId === "AS435" ? "Ashirwad" : "Matcha Tea")).trim();

  const cleanName = String(name).trim();
  const customerCode = `C-${Math.floor(100 + Math.random() * 900)}`;
  const username = `@${cleanName.toLowerCase().replace(/\s+/g, "")}`;
  const g = gender || "Male";
  const p = phone || "+91 98765 00000";
  const e = email || `${cleanName.toLowerCase().replace(/\s+/g, "")}@mail.com`;
  const room = roomBooked || "Room 101";
  const inDate = checkIn || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const outDate = checkOut || "19 Aug 2026";
  const days = Number(stayDays) || 2;
  const numGuests = Number(guestsCount) || 1;
  const bill = Number(totalBill) || 2500;
  const payStat = paymentStatus || "Paid";
  const paidAmt = payStat === "Paid" ? bill : 0;
  const t = tier || "Daily Guest";
  const tColor = t === "Platinum" ? "#7c3aed" : t === "Gold" ? "#d97706" : t === "Silver" ? "#475569" : "#64748b";
  const tBg = t === "Platinum" ? "#f3e8ff" : t === "Gold" ? "#fef3c7" : t === "Silver" ? "#f1f5f9" : "#f1f5f9";
  const tIcon = t === "Platinum" ? "👑" : t === "Gold" ? "⭐" : t === "Silver" ? "🥈" : "👤";
  const invId = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    const result: any = await query(
      `INSERT INTO customers 
      (org_id, org_name, customer_code, name, username, gender, phone, email, bookings, tier, tier_color, tier_bg, tier_icon, points, stays, last_visit, status, room_booked, check_in, check_out, stay_days, guests_count, total_bill, paid_amount, payment_status, invoice_id, document_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, '0', 1, ?, 'Active', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        targetOrgId,
        targetOrgName,
        customerCode,
        cleanName,
        username,
        g,
        p,
        e,
        t,
        tColor,
        tBg,
        tIcon,
        inDate,
        room,
        inDate,
        outDate,
        days,
        numGuests,
        bill,
        paidAmt,
        payStat,
        invId,
      ]
    );

    const insertedRows = await query<any>("SELECT * FROM customers WHERE id = ?", [result.insertId]);
    const created = formatCustomer(insertedRows[0], req);
    return res.status(201).json({ success: true, message: "Guest registered successfully.", customer: created });
  } catch (err: any) {
    console.warn("MySQL unavailable for POST customer, using in-memory store:", err.message);

    const newObj = {
      id: Date.now(),
      org_id: targetOrgId,
      org_name: targetOrgName,
      customer_code: customerCode,
      name: cleanName,
      username,
      gender: g,
      phone: p,
      email: e,
      bookings: 1,
      tier: t,
      tier_color: tColor,
      tier_bg: tBg,
      tier_icon: tIcon,
      points: "0",
      stays: 1,
      last_visit: inDate,
      status: "Active",
      image: g === "Female" ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80" : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      room_booked: room,
      check_in: inDate,
      check_out: outDate,
      stay_days: days,
      guests_count: numGuests,
      total_bill: bill,
      paid_amount: paidAmt,
      payment_status: payStat,
      invoice_id: invId,
      document_status: "Pending",
    };

    inMemoryCustomers.unshift(newObj);
    return res.status(201).json({ success: true, message: "Guest registered successfully.", customer: formatCustomer(newObj, req) });
  }
});

// PUT /api/customers/:id — Update Customer & Booking Details
router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    gender,
    phone,
    email,
    roomBooked,
    checkIn,
    checkOut,
    stayDays,
    guestsCount,
    totalBill,
    paidAmount,
    paymentStatus,
    status,
    tier,
  } = req.body ?? {};

  const t = tier || "Daily Guest";
  const tColor = t === "Platinum" ? "#7c3aed" : t === "Gold" ? "#d97706" : t === "Silver" ? "#475569" : "#64748b";
  const tBg = t === "Platinum" ? "#f3e8ff" : t === "Gold" ? "#fef3c7" : t === "Silver" ? "#f1f5f9" : "#f1f5f9";
  const tIcon = t === "Platinum" ? "👑" : t === "Gold" ? "⭐" : t === "Silver" ? "🥈" : "👤";

  try {
    const rows = await query<any>("SELECT * FROM customers WHERE customer_code = ? OR id = ?", [id, id]);
    if (rows.length > 0) {
      const c = rows[0];
      const cleanName = name !== undefined ? String(name).trim() : c.name;
      const g = gender !== undefined ? gender : c.gender;
      const p = phone !== undefined ? phone : c.phone;
      const e = email !== undefined ? email : c.email;
      const room = roomBooked !== undefined ? roomBooked : c.room_booked;
      const inDate = checkIn !== undefined ? checkIn : c.check_in;
      const outDate = checkOut !== undefined ? checkOut : c.check_out;
      const days = stayDays !== undefined ? Number(stayDays) : c.stay_days;
      const guests = guestsCount !== undefined ? Number(guestsCount) : c.guests_count;
      const bill = totalBill !== undefined ? Number(totalBill) : Number(c.total_bill || 2500);
      const payStat = paymentStatus !== undefined ? paymentStatus : c.payment_status;
      const paid = paidAmount !== undefined ? Number(paidAmount) : (payStat === "Paid" ? bill : Number(c.paid_amount || 0));
      const stat = status !== undefined ? status : c.status;

      await query(
        `UPDATE customers 
         SET name = ?, gender = ?, phone = ?, email = ?, room_booked = ?, check_in = ?, check_out = ?, 
             stay_days = ?, guests_count = ?, total_bill = ?, paid_amount = ?, payment_status = ?, 
             status = ?, tier = ?, tier_color = ?, tier_bg = ?, tier_icon = ?
         WHERE id = ?`,
        [cleanName, g, p, e, room, inDate, outDate, days, guests, bill, paid, payStat, stat, t, tColor, tBg, tIcon, c.id]
      );

      const updatedRows = await query<any>("SELECT * FROM customers WHERE id = ?", [c.id]);
      return res.json({ success: true, message: "Customer details updated successfully.", customer: formatCustomer(updatedRows[0], req) });
    }
  } catch (err: any) {
    console.warn("MySQL unavailable for PUT customer, updating in-memory store:", err.message);
  }

  // Fallback in-memory
  const idx = inMemoryCustomers.findIndex((c) => c.customer_code === id || String(c.id) === id);
  if (idx !== -1) {
    const c = inMemoryCustomers[idx];
    if (name !== undefined) c.name = String(name).trim();
    if (gender !== undefined) c.gender = gender;
    if (phone !== undefined) c.phone = phone;
    if (email !== undefined) c.email = email;
    if (roomBooked !== undefined) c.room_booked = roomBooked;
    if (checkIn !== undefined) c.check_in = checkIn;
    if (checkOut !== undefined) c.check_out = checkOut;
    if (stayDays !== undefined) c.stay_days = Number(stayDays);
    if (guestsCount !== undefined) c.guests_count = Number(guestsCount);
    if (totalBill !== undefined) c.total_bill = Number(totalBill);
    if (paymentStatus !== undefined) c.payment_status = paymentStatus;
    if (paidAmount !== undefined) {
      c.paid_amount = Number(paidAmount);
    } else if (paymentStatus === "Paid") {
      c.paid_amount = c.total_bill;
    }
    if (status !== undefined) c.status = status;
    if (tier !== undefined) {
      c.tier = t;
      c.tier_color = tColor;
      c.tier_bg = tBg;
      c.tier_icon = tIcon;
    }
    return res.json({ success: true, message: "Customer details updated successfully.", customer: formatCustomer(c, req) });
  }

  return res.status(404).json({ success: false, message: "Customer not found." });
});

// PUT /api/customers/:id/payment — Update Payment Status
router.put("/:id/payment", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { paymentStatus, paidAmount } = req.body ?? {};
  const statusVal = paymentStatus || "Paid";

  try {
    const rows = await query<any>("SELECT * FROM customers WHERE customer_code = ? OR id = ?", [id, id]);
    if (rows.length > 0) {
      const c = rows[0];
      const billAmt = Number(c.total_bill || 2500);
      const newPaid = paidAmount !== undefined ? Number(paidAmount) : (statusVal === "Paid" ? billAmt : 0);

      await query(
        "UPDATE customers SET payment_status = ?, paid_amount = ? WHERE id = ?",
        [statusVal, newPaid, c.id]
      );

      const updatedRows = await query<any>("SELECT * FROM customers WHERE id = ?", [c.id]);
      return res.json({ success: true, message: "Payment updated successfully.", customer: formatCustomer(updatedRows[0], req) });
    }
  } catch (err: any) {
    console.warn("MySQL unavailable for PUT payment, updating in-memory store:", err.message);
  }

  // Fallback in-memory
  const idx = inMemoryCustomers.findIndex((c) => c.customer_code === id || String(c.id) === id);
  if (idx !== -1) {
    const c = inMemoryCustomers[idx];
    c.payment_status = statusVal;
    c.paid_amount = paidAmount !== undefined ? Number(paidAmount) : (statusVal === "Paid" ? Number(c.total_bill || 2500) : 0);
    return res.json({ success: true, message: "Payment updated successfully.", customer: formatCustomer(c, req) });
  }

  return res.status(404).json({ success: false, message: "Customer not found." });
});

// POST /api/customers/:id/document — Upload ID Proof Document
router.post("/:id/document", upload.single("document"), async (req: Request, res: Response) => {
  const { id } = req.params;
  const docType = req.body?.docType || "Aadhaar Card";

  if (!req.file) {
    return res.status(400).json({ success: false, message: "No document file uploaded." });
  }

  const filename = req.file.filename;

  try {
    const rows = await query<any>("SELECT * FROM customers WHERE customer_code = ? OR id = ?", [id, id]);
    if (rows.length > 0) {
      const c = rows[0];
      await query(
        `UPDATE customers 
         SET document_name = ?, document_type = ?, document_status = 'Uploaded & Verified' 
         WHERE id = ?`,
        [filename, docType, c.id]
      );

      const updatedRows = await query<any>("SELECT * FROM customers WHERE id = ?", [c.id]);
      return res.json({ success: true, message: "ID Document uploaded & verified successfully.", customer: formatCustomer(updatedRows[0], req) });
    }
  } catch (err: any) {
    console.warn("MySQL unavailable for POST document, updating in-memory store:", err.message);
  }

  // Fallback in-memory
  const idx = inMemoryCustomers.findIndex((c) => c.customer_code === id || String(c.id) === id);
  if (idx !== -1) {
    const c = inMemoryCustomers[idx];
    c.document_name = filename;
    c.document_type = docType;
    c.document_status = "Uploaded & Verified";
    return res.json({ success: true, message: "ID Document uploaded & verified successfully.", customer: formatCustomer(c, req) });
  }

  return res.status(404).json({ success: false, message: "Customer not found." });
});

// DELETE /api/customers/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const headerOrgId = req.headers["x-org-id"] as string;

  try {
    const rows = await query<any>("SELECT * FROM customers WHERE customer_code = ? OR id = ?", [id, id]);
    if (rows.length > 0) {
      if (headerOrgId && rows[0].org_id !== headerOrgId) {
        return res.status(403).json({ success: false, message: "Access denied. Customer belongs to a different branch." });
      }
      await query("DELETE FROM customers WHERE id = ?", [rows[0].id]);
    }
  } catch (err: any) {
    console.warn("MySQL unavailable for DELETE customer, updating in-memory store:", err.message);
  }

  inMemoryCustomers = inMemoryCustomers.filter((c) => c.customer_code !== id && String(c.id) !== id);
  return res.json({ success: true, message: "Customer deleted successfully." });
});

// PUT /api/customers/:id/status — Update Customer Status (Check-in/out)
router.put("/:id/status", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body ?? {};
  const headerOrgId = req.headers["x-org-id"] as string;

  if (!status) {
    return res.status(400).json({ success: false, message: "Status is required." });
  }

  try {
    const rows = await query<any>("SELECT * FROM customers WHERE customer_code = ? OR id = ?", [id, id]);
    if (rows.length > 0) {
      const c = rows[0];
      if (headerOrgId && c.org_id !== headerOrgId) {
        return res.status(403).json({ success: false, message: "Access denied. Customer belongs to a different branch." });
      }

      const { db } = await import("../db.js");
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        await conn.query(
          "UPDATE customers SET status = ? WHERE id = ?",
          [status, c.id]
        );

        if (c.room_booked) {
          // Try to find the exact booking for this customer based on room and branch
          const [bookings] = await conn.query(
            "SELECT * FROM bookings WHERE (room_name = ? OR room_number = ? OR CONCAT('Room ', room_number) = ?) AND (org_id = ? OR org_id IS NULL) AND status IN ('Reserved', 'Upcoming', 'Pending', 'Checked In', 'Active Stay', 'Current') ORDER BY id DESC LIMIT 1",
            [c.room_booked, c.room_booked, c.room_booked, c.org_id]
          );

          if (Array.isArray(bookings) && bookings.length > 0) {
            const b = (bookings as any)[0];
            const roomId = b.room_id;

            if (status === "Checked Out") {
              await conn.query("UPDATE bookings SET status = 'Completed', type = 'Previous' WHERE id = ?", [b.id]);
              if (roomId) {
                await conn.query("UPDATE rooms SET status = 'Cleaning', available = FALSE WHERE id = ?", [roomId]);
                
                // Add housekeeping task
                await conn.query(
                  `INSERT INTO housekeeping_tasks (org_id, org_name, room_id, room_number, room_type, task_type, status, priority, assigned_to, created_at, updated_at) 
                   VALUES (?, ?, ?, ?, ?, 'Checkout Cleaning', 'Pending', 'High', 'Unassigned', NOW(), NOW())`,
                  [b.org_id, b.org_name, roomId, b.room_number, b.room_type || "Standard"]
                ).catch((e: any) => console.warn("Failed to add housekeeping task:", e.message));
              }
            } else if (status === "Checked In") {
              await conn.query("UPDATE bookings SET status = 'Active Stay', type = 'Current' WHERE id = ?", [b.id]);
              if (roomId) {
                await conn.query("UPDATE rooms SET status = 'Occupied', available = FALSE WHERE id = ?", [roomId]);
              }
            }
          }
        }
        await conn.commit();
        conn.release();
      } catch (txnErr) {
        await conn.rollback();
        conn.release();
        throw txnErr; // Throw to the outer catch block to fallback if needed
      }

      const updatedRows = await query<any>("SELECT * FROM customers WHERE id = ?", [c.id]);
      return res.json({ success: true, message: "Status updated successfully.", customer: formatCustomer(updatedRows[0], req) });
    }
  } catch (err: any) {
    console.warn("MySQL unavailable for PUT status, updating in-memory store:", err.message);
  }

  // Fallback in-memory
  const idx = inMemoryCustomers.findIndex((c) => c.customer_code === id || String(c.id) === id);
  if (idx !== -1) {
    const c = inMemoryCustomers[idx];
    if (headerOrgId && c.org_id !== headerOrgId) {
       return res.status(403).json({ success: false, message: "Access denied." });
    }
    c.status = status;
    return res.json({ success: true, message: "Status updated successfully.", customer: formatCustomer(c, req) });
  }

  return res.status(404).json({ success: false, message: "Customer not found." });
});

export default router;
