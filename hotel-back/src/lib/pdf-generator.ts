import PDFDocument from "pdfkit";

export interface BookingPDFData {
  bookingId: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  roomName: string;
  amount: number;
  checkInDate?: string;
  checkOutDate?: string;
  action?: string;
}

/**
 * Generate a PDF Booking Confirmation Voucher buffer in memory
 */
export function generateBookingPDFBuffer(data: BookingPDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      // ── Header Banner ──
      doc.rect(0, 0, 595.28, 100).fill("#1e293b"); // Slate 800 background
      
      doc.fillColor("#ffffff")
         .fontSize(24)
         .font("Helvetica-Bold")
         .text("GRAND HOTEL & RESORT", 40, 30);

      doc.fontSize(12)
         .font("Helvetica")
         .fillColor("#94a3b8")
         .text("Official Booking Confirmation Voucher", 40, 60);

      // ── Voucher Badge ──
      doc.rect(420, 35, 135, 30).fill("#16a34a");
      doc.fillColor("#ffffff")
         .fontSize(12)
         .font("Helvetica-Bold")
         .text("CONFIRMED", 435, 43, { width: 105, align: "center" });

      doc.moveDown(4);

      // ── Booking Metadata ──
      const startY = 130;
      doc.fillColor("#0f172a").fontSize(18).font("Helvetica-Bold").text(`Reservation #${data.bookingId}`, 40, startY);
      doc.fontSize(10).font("Helvetica").fillColor("#64748b").text(`Issued on: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`, 40, startY + 22);

      // ── Section Divider ──
      doc.moveTo(40, startY + 45).lineTo(555, startY + 45).strokeColor("#e2e8f0").stroke();

      // ── Booking & Stay Details Box ──
      const boxY = startY + 60;
      doc.rect(40, boxY, 515, 160).fillAndStroke("#f8fafc", "#cbd5e1");

      doc.fillColor("#334155").fontSize(12).font("Helvetica-Bold").text("GUEST & STAY INFORMATION", 55, boxY + 15);

      doc.fontSize(10).font("Helvetica-Bold").fillColor("#475569").text("Guest Name:", 55, boxY + 45);
      doc.font("Helvetica").fillColor("#0f172a").text(data.guestName || "Valued Guest", 150, boxY + 45);

      doc.font("Helvetica-Bold").fillColor("#475569").text("Guest Email:", 55, boxY + 65);
      doc.font("Helvetica").fillColor("#0f172a").text(data.guestEmail || "Not Provided", 150, boxY + 65);

      doc.font("Helvetica-Bold").fillColor("#475569").text("Guest Phone:", 55, boxY + 85);
      doc.font("Helvetica").fillColor("#0f172a").text(data.guestPhone || "+91 98765 00000", 150, boxY + 85);

      doc.font("Helvetica-Bold").fillColor("#475569").text("Room Type:", 55, boxY + 105);
      doc.font("Helvetica").fillColor("#0f172a").text(data.roomName || "Standard Deluxe", 150, boxY + 105);

      // ── Check-In / Check-Out Highlights Box ──
      const datesY = boxY + 130;
      doc.rect(55, datesY, 485, 20).fill("#e2e8f0");
      doc.fillColor("#0f172a")
         .font("Helvetica-Bold")
         .fontSize(10)
         .text(`📅 CHECK-IN: ${data.checkInDate || "Confirmed"}   ➔   📅 CHECK-OUT: ${data.checkOutDate || "Confirmed"}`, 65, datesY + 5);

      // ── Payment Details ──
      const payY = boxY + 180;
      doc.fillColor("#334155").fontSize(12).font("Helvetica-Bold").text("PAYMENT SUMMARY", 40, payY);

      doc.moveTo(40, payY + 20).lineTo(555, payY + 20).strokeColor("#e2e8f0").stroke();

      doc.fontSize(10).font("Helvetica").fillColor("#475569").text("Total Booking Amount:", 40, payY + 30);
      doc.font("Helvetica-Bold").fillColor("#16a34a").fontSize(14).text(`INR ₹${(data.amount || 0).toLocaleString("en-IN")}`, 400, payY + 27, { align: "right" });

      doc.fontSize(10).font("Helvetica").fillColor("#475569").text("Payment Status:", 40, payY + 50);
      doc.font("Helvetica-Bold").fillColor("#0f172a").text("Paid In Full", 470, payY + 50, { align: "right" });

      // ── Terms & Notes ──
      const termsY = payY + 90;
      doc.rect(40, termsY, 515, 80).fill("#f1f5f9");
      doc.fillColor("#475569").fontSize(9).font("Helvetica-Bold").text("Important Hotel Policies:", 50, termsY + 10);
      doc.font("Helvetica").fillColor("#64748b").text("1. Please present this confirmation voucher and a valid photo ID upon check-in.", 50, termsY + 25);
      doc.text("2. Check-in time starts at 02:00 PM. Check-out time is 11:00 AM.", 50, termsY + 40);
      doc.text("3. For any assistance or modifications, contact hotel support at support@grandhotel.com.", 50, termsY + 55);

      // ── Footer ──
      doc.fontSize(9).fillColor("#94a3b8").text("Thank you for choosing Grand Hotel. We look forward to hosting you!", 40, 780, { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
