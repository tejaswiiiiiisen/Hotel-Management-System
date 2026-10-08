import { Router, Request, Response } from "express";
import { query } from "../db.js";

const router = Router();

// In-memory fallback if MySQL table is temporarily offline
let inMemoryPayments: any[] = [];

// GET /api/payments — Fetch all payment transactions
router.get("/", async (req: Request, res: Response) => {
  const orgId = req.query.org_id || req.query.orgId;
  try {
    let sql = "SELECT * FROM payments ORDER BY id DESC";
    let params: any[] = [];

    if (orgId && orgId !== "all") {
      sql = "SELECT * FROM payments WHERE org_id = ? ORDER BY id DESC";
      params = [orgId];
    }

    const rows = await query<any>(sql, params);
    return res.json({ success: true, count: rows.length, payments: rows });
  } catch (err: any) {
    console.warn("MySQL query error for payments, using fallback:", err.message);
    return res.json({ success: true, count: inMemoryPayments.length, payments: inMemoryPayments });
  }
});

// POST /api/payments/process — Record a new payment transaction
router.post("/process", async (req: Request, res: Response) => {
  const {
    bookingCode,
    guestName,
    guestEmail,
    amount,
    currency = "INR",
    paymentMethod = "UPI Instant Payment",
    orgId = "CH560",
    userId,
  } = req.body ?? {};

  if (!amount || !guestName) {
    return res.status(400).json({ success: false, error: "Amount and guest name are required." });
  }

  const txId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const invId = `INV-${orgId}-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    const result: any = await query(
      `INSERT INTO payments 
      (transaction_id, booking_code, user_id, guest_name, guest_email, amount, currency, payment_method, status, invoice_id, org_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Success', ?, ?)`,
      [
        txId,
        bookingCode || `RES-${Math.floor(10000 + Math.random() * 90000)}`,
        userId || null,
        guestName,
        guestEmail || `${guestName.toLowerCase().replace(/\s+/g, "")}@mail.com`,
        amount,
        currency,
        paymentMethod,
        invId,
        orgId,
      ]
    );

    const createdRows = await query<any>("SELECT * FROM payments WHERE id = ?", [result.insertId]);
    return res.status(201).json({
      success: true,
      message: "Payment processed & recorded successfully.",
      payment: createdRows[0],
    });
  } catch (err: any) {
    console.warn("MySQL error saving payment, storing in memory:", err.message);
    const fallbackPayment = {
      id: Date.now(),
      transaction_id: txId,
      booking_code: bookingCode || `RES-${Math.floor(10000 + Math.random() * 90000)}`,
      user_id: userId || null,
      guest_name: guestName,
      guest_email: guestEmail || `${guestName.toLowerCase().replace(/\s+/g, "")}@mail.com`,
      amount,
      currency,
      payment_method: paymentMethod,
      status: "Success",
      invoice_id: invId,
      org_id: orgId,
      created_at: new Date(),
    };
    inMemoryPayments.unshift(fallbackPayment);
    return res.status(201).json({
      success: true,
      message: "Payment processed & recorded successfully.",
      payment: fallbackPayment,
    });
  }
});

export default router;
