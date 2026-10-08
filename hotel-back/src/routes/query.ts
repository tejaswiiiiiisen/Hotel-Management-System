import { Router, Request, Response } from "express";
import { query } from "../db.js";

const router = Router();

export interface QueryItem {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  created_at: Date;
}

// In-memory fallback array for queries if MySQL is offline
let inMemoryQueries: QueryItem[] = [];

// Initialize `query` table in MySQL
export async function initQuerySchema() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS query (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'New',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    try {
      await query("ALTER TABLE query ADD COLUMN status VARCHAR(50) DEFAULT 'New'");
    } catch {}

    console.log("✅ Query table initialized");
  } catch (err: any) {
    console.warn("⚠️ MySQL query table init fallback:", err.message);
  }
}

// POST /api/query or /api/queries
router.post("/", async (req: Request, res: Response) => {
  const {
    first_name,
    firstName,
    last_name,
    lastName,
    email,
    phone,
    phoneNumber,
    phone_number,
    subject,
    message
  } = req.body ?? {};

  const fn = (first_name || firstName || "").trim();
  const ln = (last_name || lastName || "").trim();
  const em = (email || "").trim();
  const ph = (phone || phoneNumber || phone_number || "").trim();
  const sb = (subject || "").trim();
  const msg = (message || "").trim();

  // Validate all required fields
  if (!fn || !ln || !em || !ph || !sb || !msg) {
    return res.status(400).json({
      success: false,
      message: "All fields are required: First Name, Last Name, Email, Phone Number, Subject, and Message."
    });
  }

  try {
    const result: any = await query(
      "INSERT INTO query (first_name, last_name, email, phone, subject, message, status) VALUES (?, ?, ?, ?, ?, ?, 'New')",
      [fn, ln, em, ph, sb, msg]
    );

    const insertedId = result.insertId || Date.now();
    const newRecord: QueryItem & { status: string } = {
      id: insertedId,
      first_name: fn,
      last_name: ln,
      email: em,
      phone: ph,
      subject: sb,
      message: msg,
      status: "New",
      created_at: new Date()
    };

    return res.status(201).json({
      success: true,
      message: "Query saved successfully.",
      query: newRecord
    });
  } catch (err: any) {
    console.warn("MySQL connection error, saving query to local memory fallback:", err.message);
    const newRecord: QueryItem & { status: string } = {
      id: Date.now(),
      first_name: fn,
      last_name: ln,
      email: em,
      phone: ph,
      subject: sb,
      message: msg,
      status: "New",
      created_at: new Date()
    };
    inMemoryQueries.unshift(newRecord);

    return res.status(201).json({
      success: true,
      message: "Query saved successfully.",
      query: newRecord
    });
  }
});

// GET /api/query
router.get("/", async (_req: Request, res: Response) => {
  try {
    const rows = await query<any>("SELECT * FROM query ORDER BY id DESC");
    return res.json({ success: true, queries: rows });
  } catch (err: any) {
    return res.json({ success: true, queries: inMemoryQueries });
  }
});

// PUT /api/query/:id/status
router.put("/:id/status", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body ?? {};
  const newStatus = status || "Read";

  try {
    await query("UPDATE query SET status = ? WHERE id = ?", [newStatus, id]);
    return res.json({ success: true, message: `Query #${id} status updated to ${newStatus}` });
  } catch (err: any) {
    const item = inMemoryQueries.find((q) => q.id === Number(id));
    if (item) (item as any).status = newStatus;
    return res.json({ success: true, message: `Query #${id} status updated to ${newStatus}` });
  }
});

// DELETE /api/query/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await query("DELETE FROM query WHERE id = ?", [id]);
    return res.json({ success: true, message: `Query #${id} deleted` });
  } catch (err: any) {
    inMemoryQueries = inMemoryQueries.filter((q) => q.id !== Number(id));
    return res.json({ success: true, message: `Query #${id} deleted` });
  }
});

export default router;
