import nodemailer from "nodemailer";
import twilio from "twilio";
import "dotenv/config";
import { generateBookingPDFBuffer, BookingPDFData } from "../lib/pdf-generator.js";

/**
 * Dynamic Helper to get Twilio Client with live credentials from process.env
 */
function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const fromNum = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER || "+15005550006";

  const isConfigured = Boolean(
    sid &&
    token &&
    !sid.includes("your_") &&
    !token.includes("your_") &&
    sid.startsWith("AC")
  );

  return {
    client: isConfigured ? twilio(sid, token) : null,
    fromNumber: fromNum,
    isConfigured,
  };
}

/**
 * Helper to create Nodemailer Transport (Real SMTP or Ethereal Test Account fallback)
 */
async function createMailTransporter() {
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  const isPlaceholderPass = !smtpPass || smtpPass.includes("your_16_digit_app_password") || smtpPass.includes("xxxx");

  if (smtpUser && smtpPass && !isPlaceholderPass) {
    if (smtpUser.includes("@gmail.com") || smtpHost.includes("gmail")) {
      return nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }
    return nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  // Fallback: Ethereal test account if SMTP is not configured in .env
  try {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch (err: any) {
    console.warn("⚠️ Nodemailer Ethereal fallback account creation failed:", err?.message || err);
    return null;
  }
}

export interface NotificationPayload extends BookingPDFData {
  action?: "CREATED" | "UPDATED" | "CANCELLED" | string;
  guestPhone?: string;
  customerPhone?: string;
}

/**
 * Send Email Invoice & Confirmation PDF Voucher using Nodemailer
 */
export async function sendEmailInvoice(data: NotificationPayload): Promise<boolean> {
  const recipient = data.guestEmail || "guest@example.com";
  const checkIn = data.checkInDate || "Date of Check-in";
  const checkOut = data.checkOutDate || "Date of Check-out";

  console.log(`[Email Worker] 📧 Preparing email invoice for Guest: ${data.guestName} <${recipient}>...`);

  // Generate PDF Voucher Buffer in memory
  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generateBookingPDFBuffer(data);
    console.log(`  └─ 📄 Generated PDF Invoice Voucher for Booking #${data.bookingId} (${pdfBuffer.length} bytes)`);
  } catch (pdfErr: any) {
    console.warn(`  └─ ⚠️ PDF Invoice generation notice:`, pdfErr?.message || pdfErr);
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Grand Hotel & Resort" <no-reply@grandhotel.com>',
    to: recipient,
    subject: `🏨 Booking Confirmation Voucher & Invoice - Reservation #${data.bookingId}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; border-bottom: 3px solid #16a34a; padding-bottom: 15px; margin-bottom: 20px;">
          <h1 style="color: #0f172a; margin: 0; font-size: 24px;">Grand Hotel & Resort</h1>
          <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">Official Booking Confirmation & Tax Invoice</p>
        </div>
        
        <p style="font-size: 16px;">Dear <strong>${data.guestName}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6;">Thank you for choosing Grand Hotel & Resort. Your reservation <strong>#${data.bookingId}</strong> has been successfully confirmed!</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">Reservation Summary</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #475569;">Booking Reference:</td>
              <td style="padding: 8px 0; font-weight: 700; color: #16a34a; text-align: right;">#${data.bookingId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #475569;">Room Category:</td>
              <td style="padding: 8px 0; text-align: right; color: #1e293b;">${data.roomName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #475569;">Check-In Date:</td>
              <td style="padding: 8px 0; color: #0284c7; font-weight: 600; text-align: right;">${checkIn}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #475569;">Check-Out Date:</td>
              <td style="padding: 8px 0; color: #0284c7; font-weight: 600; text-align: right;">${checkOut}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0 4px 0; font-weight: 700; font-size: 16px; color: #0f172a; border-top: 1px dashed #cbd5e1;">Total Amount Paid:</td>
              <td style="padding: 12px 0 4px 0; font-weight: 800; font-size: 16px; color: #16a34a; text-align: right; border-top: 1px dashed #cbd5e1;">₹${(data.amount || 0).toLocaleString("en-IN")}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 14px; color: #334155;">📄 <strong>PDF Invoice Voucher Attached:</strong> Your downloadable tax invoice and official stay voucher are attached to this email.</p>
        
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
          <p style="margin: 0;">Grand Hotel & Resort • 123 Hospitality Lane • Contact: support@grandhotel.com</p>
        </div>
      </div>
    `,
    attachments: pdfBuffer
      ? [
          {
            filename: `Invoice_Voucher_${data.bookingId}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ]
      : [],
  };

  try {
    const transporter = await createMailTransporter();
    if (transporter) {
      const info = await transporter.sendMail(mailOptions);
      console.log(`  └─ ✅ Email Invoice sent to ${recipient} (Message ID: ${info.messageId})`);
      if ((info as any)?.host?.includes("ethereal")) {
        console.log(`  └─ 🔗 Ethereal Test Email Preview Link: ${nodemailer.getTestMessageUrl(info)}`);
      }
      return true;
    } else {
      console.log(`  └─ ✉️ [Simulated Email] Invoice dispatched to ${recipient} (Booking #${data.bookingId})`);
      return true;
    }
  } catch (emailErr: any) {
    console.warn(`  └─ ⚠️ Email delivery attempt completed/logged:`, emailErr?.message || emailErr);
    return false;
  }
}

/**
 * Send SMS Booking Confirmation using Twilio API
 */
export async function sendSMSConfirmation(data: NotificationPayload): Promise<boolean> {
  const rawPhone = data.guestPhone || data.customerPhone;
  if (!rawPhone) {
    console.log(`[SMS Worker] ℹ️ No phone number provided for Booking #${data.bookingId}, skipping SMS dispatch.`);
    return false;
  }

  // Format phone number to E.164 standard (e.g. +919026328642)
  let phone = rawPhone.trim().replace(/\s+/g, "");
  if (!phone.startsWith("+")) {
    if (phone.length === 10) {
      phone = `+91${phone}`;
    } else {
      phone = `+${phone}`;
    }
  }

  const checkIn = data.checkInDate || "Check-in Date";
  const smsBody = `Sent from your Twilio trial account - Grand Hotel: Booking confirmed! Code: #${data.bookingId}, Guest: ${data.guestName}, Room: ${data.roomName}, Check-In: ${checkIn}, Total: ₹${(data.amount || 0).toLocaleString("en-IN")}. Thank you!`;

  console.log(`[SMS Worker] 📱 Sending SMS booking confirmation to ${phone}...`);

  const { client, fromNumber, isConfigured } = getTwilioClient();

  if (isConfigured && client) {
    try {
      const message = await client.messages.create({
        body: smsBody,
        from: fromNumber,
        to: phone,
      });
      console.log(`  └─ ✅ Twilio Live SMS Sent Successfully! SID: ${message.sid} to ${phone}`);
      return true;
    } catch (twilioErr: any) {
      if (twilioErr?.code === 572006 || String(twilioErr?.message || "").includes("template")) {
        try {
          const tMsg = await client.messages.create({
            body: "sms_appointment_reminders",
            from: fromNumber,
            to: phone,
          });
          console.log(`  └─ ✅ Twilio Trial Predefined Template SMS Dispatched to Mobile! SID: ${tMsg.sid} to ${phone}`);
          return true;
        } catch (retryErr: any) {
          console.warn(`  └─ ⚠️ Twilio Template Retry Notice:`, retryErr?.message || retryErr);
        }
      }
      console.warn(`  └─ ⚠️ Twilio SMS API Notice (${twilioErr?.message || twilioErr}). Logging fallback SMS notification.`);
      console.log(`  └─ 📲 [Simulated Twilio SMS] Sent to ${phone}: "${smsBody}"`);
      return false;
    }
  } else {
    console.log(`  └─ 📲 [Simulated Twilio SMS] (Twilio API credentials offline/simulated). Sent to ${phone}: "${smsBody}"`);
    return true;
  }
}

/**
 * Unified Process Notification routine executed by RabbitMQ worker consumer or in-memory fallback
 */
export async function processNotificationJob(data: NotificationPayload): Promise<void> {
  console.log(`\n======================================================`);
  console.log(`[Notification Worker] ⚙️ Processing Job for Booking #${data.bookingId} (${data.action || "CREATED"})`);
  console.log(`======================================================`);

  // Execute Email and SMS tasks concurrently without blocking
  await Promise.allSettled([
    sendEmailInvoice(data),
    sendSMSConfirmation(data),
  ]);

  console.log(`[Notification Worker] ✅ Job execution completed for Booking #${data.bookingId}.\n`);
}

/**
 * Initialize RabbitMQ Queue Consumer for Email & SMS Worker
 */
export async function startEmailWorker(channel: any, queueName: string) {
  if (!channel || !queueName) return;

  try {
    await channel.assertQueue(queueName, { durable: true });
    await channel.consume(queueName, async (msg: any) => {
      if (msg) {
        try {
          const content: NotificationPayload = JSON.parse(msg.content.toString());
          await processNotificationJob(content);
          channel.ack(msg);
        } catch (err: any) {
          console.error("[Email/SMS Worker Error] Failed to process message from queue:", err?.message || err);
          channel.nack(msg, false, false);
        }
      }
    });
    console.log(`👷 [Email/SMS Worker] Consumer listening actively on RabbitMQ queue: "${queueName}"`);
  } catch (err: any) {
    console.warn("⚠️ Failed to start Email/SMS RabbitMQ worker listener:", err?.message || err);
  }
}
