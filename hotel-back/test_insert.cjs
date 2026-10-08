const mysql = require('mysql2/promise');

async function testInsert() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Sunil2004',
    database: 'hotel_website'
  });

  const effectiveOrgId = "PR984";
  const effectiveOrgName = "Pratap Mahal";
  const customerCode = "C-12345";
  const guestDisplayName = "yamini";
  const guestPhoneVal = "+91 1234567890";
  const guestEmailVal = "yamini@mail.com";
  const checkInDate = "21 Sept 2026";
  const roomNumber = "46";
  const checkOutDate = "22 Sept 2026";
  const nights = 1;
  const amountPaid = 2500;
  const invoiceId = "INV-PR984-1234";
  const docName = "Aadhaar_Document.pdf";

  try {
    const [result] = await conn.query(
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
        checkInDate,
        `Room ${roomNumber}`,
        checkInDate,
        checkOutDate,
        nights,
        amountPaid,
        amountPaid,
        invoiceId,
        docName,
      ]
    );
    console.log("Insert success:", result);
  } catch (err) {
    console.error("Insert failed:", err);
  }

  await conn.end();
}

testInsert().catch(console.error);
