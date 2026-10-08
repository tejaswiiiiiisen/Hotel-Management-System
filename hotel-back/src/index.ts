import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { globalRbacGuard } from "./lib/auth.js";
import { query } from "./db.js";

import authRouter from "./routes/auth.js";
import roomsRouter from "./routes/rooms.js";
import bookingsRouter from "./routes/bookings.js";
import customerSegmentationRouter
  from "./routes/customerSegmentation.js";
import bookingCancellationRouter
  from "./routes/bookingCancellation.js";
import revenuePredictionRouter from "./routes/revenuePrediction.js";
import wishlistRouter from "./routes/wishlist.js";
import organizationsRouter from "./routes/organizations.js";
import inventoryRouter from "./routes/inventory.js";
import purchaseOrdersRouter from "./routes/purchase-orders.js";
import payrollRouter from "./routes/payroll.js";
import maintenanceRouter from "./routes/maintenance.js";
import employeesRouter from "./routes/employees.js";

import staffRouter from "./routes/staff.js";
import customersRouter from "./routes/customers.js";
import housekeepingRouter from "./routes/housekeeping.js";
import paymentsRouter from "./routes/payments.js";
import visitorsRouter from "./routes/visitors.js";
import siteSettingsRouter from "./routes/siteSettings.js";

import rbacRouter from "./routes/rbac.js";
import { initAdminAndOrgs } from "./scripts/init-admin-orgs.js";
import { migrateRoomsSchema } from "./scripts/migrate-rooms-schema.js";
import { initBookingsSchema } from "./scripts/init-bookings-schema.js";
import { initInventorySchema } from "./scripts/init-inventory-schema.js";
import { initPurchaseOrdersSchema } from "./scripts/init-purchase-orders-schema.js";
import { initPayrollSchema } from "./scripts/init-payroll-schema.js";
import { initMaintenanceSchema } from "./scripts/init-maintenance-schema.js";
import { initCustomersSchema } from "./scripts/init-customers-schema.js";
import { initAuditLogsSchema } from "./scripts/init-audit-logs-schema.js";
import auditRouter from "./routes/audit.js";
import { initHousekeepingSchema } from "./scripts/init-housekeeping-schema.js";

import { initPaymentsSchema } from "./scripts/init-payments-schema.js";

import { initWishlistsSchema } from "./routes/wishlist.js";
import { initRbacSchema } from "./scripts/init-rbac-schema.js";
import { initOffersSchema } from "./scripts/init-offers-schema.js";
import { initReviewsSchema } from "./scripts/init-reviews-schema.js";


import chatbotRouter from "./routes/chatbot.js";
import dashboardRouter from "./routes/dashboard.js";
import reviewsRouter from "./routes/reviews.js";
import guestsRouter from "./routes/guests.js";
import serpRouter from "./routes/serp.js";
import otaRouter, { initOtaTables } from "./routes/ota.js";
import queryRouter, { initQuerySchema } from "./routes/query.js";
import { initRabbitMQWorkers } from "./lib/rabbitmq.js";
import {
  authRateLimiter,
  bookingRateLimiter,
  chatbotRateLimiter,
  apiRateLimiter,
} from "./middleware/rateLimiter.js";

const app = express();

// Safe async initialization of DB tables and schemas on server startup
async function initDatabase() {
  try {
    // Ensure document columns exist in bookings table
    const docCols = [
      "ALTER TABLE bookings ADD COLUMN document_name VARCHAR(255) DEFAULT NULL",
      "ALTER TABLE bookings ADD COLUMN document_type VARCHAR(255) DEFAULT NULL",
      "ALTER TABLE bookings ADD COLUMN document_status VARCHAR(255) DEFAULT NULL",
    ];
    for (const q of docCols) {
      try {
        await query(q);
      } catch { }
    }

    await initAdminAndOrgs();
    await initRbacSchema();
    await migrateRoomsSchema();
    await initBookingsSchema();
    await initOffersSchema();
    await initReviewsSchema();
    await initCustomersSchema();
    await initWishlistsSchema();
    await initInventorySchema();
    await initPurchaseOrdersSchema();
    await initPayrollSchema();
    await initMaintenanceSchema();
    await initHousekeepingSchema();
    await initPaymentsSchema();

    await initAuditLogsSchema();
    await initOtaTables();
    await initQuerySchema();

    // Initialize RabbitMQ Queue workers & fallback connection
    await initRabbitMQWorkers();

  } catch (err: any) {
    console.warn("⚠️ Warning: Could not initialize database schema on startup:", err?.message || err);
  }
}
initDatabase();

app.use("/api/audit-logs", auditRouter);
// Ensure static Uploads directory exists and serve files at /uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/uploads", express.static(uploadDir));

// Allow the React frontend to call the API with cookies (credentials).
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin.includes("localhost") || origin.includes("127.0.0.1")) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-org-id", "x-org-name"],
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ ok: true, status: "OK" }));

// Mount Global RBAC Guard for API routes
app.use("/api", globalRbacGuard);

app.use("/api/auth", authRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/bookings", bookingsRouter);
app.use(
  "/api/customer-segmentation",
  customerSegmentationRouter
);
app.use(
  "/api/revenue-prediction",
  revenuePredictionRouter
);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/organizations", organizationsRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/purchase-orders", purchaseOrdersRouter);
app.use("/api/payroll", payrollRouter);
app.use("/api/maintenance", maintenanceRouter);

app.use("/api/employees", employeesRouter);
app.use("/api/rbac", rbacRouter);

app.use("/api/staff", staffRouter);
app.use("/api/customers", customersRouter);
app.use("/api/housekeeping", housekeepingRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/visitors", visitorsRouter);
app.use("/api/site-settings", siteSettingsRouter);
app.use("/api/guests", guestsRouter);

app.use("/api/booking-cancellation", bookingCancellationRouter);
app.use("/api/serp", serpRouter);
app.use("/api/ota", otaRouter);
app.use("/api", chatbotRouter);
app.use("/api", reviewsRouter);
import offersRouter from "./routes/offers.js";
app.use("/api/offers", offersRouter);
app.use("/api/query", queryRouter);
app.use("/api/queries", queryRouter);

// Global Error Handling Middleware (catches malformed JSON / bodyParser errors and runtime errors)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid request payload format (malformed JSON or unexpected multipart data).",
    });
  }
  console.error("Unhandled Server Error:", err?.message || err);
  return res.status(err.status || 500).json({
    success: false,
    message: err?.message || "Internal Server Error",
  });
});

import { initWebSocketServer } from "./lib/websocket.js";

const PORT = Number(process.env.PORT || 4000);
const server = app.listen(PORT, () => {
  console.log(`🚀 API & WebSockets listening on http://localhost:${PORT}`);
});
initWebSocketServer(server);

