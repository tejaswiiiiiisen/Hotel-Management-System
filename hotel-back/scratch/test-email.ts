import { processBookingNotification } from "../src/lib/rabbitmq.js";

async function testEmailWorker() {
  console.log("🧪 Sending real email to wei2606wei@gmail.com with PDF Voucher...");
  await processBookingNotification({
    bookingId: "RES-99881",
    guestName: "Raj Sharma",
    guestEmail: "wei2606wei@gmail.com",
    roomName: "Penthouse Standard Twin",
    amount: 16000,
    checkInDate: "20 Sept 2026",
    checkOutDate: "22 Sept 2026",
    action: "CREATED"
  });
  console.log("✅ Live Email sent successfully!");
}

testEmailWorker();
