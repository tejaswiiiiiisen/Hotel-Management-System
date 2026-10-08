import { Router, Request, Response } from "express";
import { query } from "../db.js";
import { requireAuth, AuthedRequest } from "../lib/auth.js";
import { parseBookingDate } from "./bookings.js";

console.log("🔥 DASHBOARD ROUTE FILE LOADED");

const router = Router();

router.get("/", async (_req, res) => {
  try {

    // =====================================================
    // TOTAL CUSTOMERS / BOOKINGS
    // =====================================================

    let totalCustomers = 0;
    try {
      const totalCustomersResult: any = await query(`
        SELECT COUNT(*) AS total
        FROM bookings
      `);
      totalCustomers = Number(totalCustomersResult[0]?.total || 0);
    } catch (e) {
      console.warn("totalCustomers query warning:", e);
    }

    // =====================================================
    // TOTAL CONFIRMED RESERVATIONS
    // =====================================================

    let totalReservations = 0;
    try {
      const reservationsResult: any = await query(`
        SELECT COUNT(*) AS total
        FROM bookings
        WHERE status = 'Confirmed' OR status = 'confirmed'
      `);
      totalReservations = Number(reservationsResult[0]?.total || 0);
    } catch (e) {
      console.warn("reservations query warning:", e);
    }

    // =====================================================
    // TOTAL CANCELLATIONS
    // =====================================================

    let totalCancellations = 0;
    try {
      const cancellationsResult: any = await query(`
        SELECT COUNT(*) AS total
        FROM bookings
        WHERE status = 'Cancelled' OR status = 'cancelled'
      `);
      totalCancellations = Number(cancellationsResult[0]?.total || 0);
    } catch (e) {
      console.warn("cancellations query warning:", e);
    }

    // =====================================================
    // TOTAL GUESTS / ADULTS
    // =====================================================

    let totalAdults = 0;
    let totalChildren = 0;
    let totalBabies = 0;

    try {
      const adultsResult: any = await query(`
        SELECT COALESCE(SUM(guests), 0) AS total
        FROM bookings
      `);
      totalAdults = Number(adultsResult[0]?.total || 0);
    } catch (e) {
      console.warn("guests query warning:", e);
    }

    // =====================================================
    // PARKING & SPECIAL REQUESTS
    // =====================================================

    const parkingRequests = 0;
    const specialRequests = 0;

    // =====================================================
    // CUSTOMER SEGMENTS
    // =====================================================

    let segment1 = 0;
    let segment2 = 0;
    let segment3 = 0;

    try {
      const segmentsResult: any = await query(`
        SELECT
          customer_segment,
          COUNT(*) AS total
        FROM bookings
        WHERE customer_segment IS NOT NULL
        GROUP BY customer_segment
        ORDER BY customer_segment
      `);

      for (const row of segmentsResult) {
        const segment = Number(row.customer_segment);
        const count = Number(row.total || 0);
        if (segment === 0) segment1 = count;
        if (segment === 1) segment2 = count;
        if (segment === 2) segment3 = count;
      }
    } catch {
      // customer_segment optional column
    }

    // =====================================================
    // TOTAL REVIEWS
    // =====================================================

    let totalReviews = 0;
    try {
      const reviewsResult: any = await query(`
        SELECT COUNT(*) AS total
        FROM reviews
      `);
      totalReviews = Number(reviewsResult[0]?.total || 0);
    } catch {
      totalReviews = 0;
    }

    // =====================================================
    // TOMORROW'S PREDICTED REVENUE
    // =====================================================

    let tomorrowPredictedRevenue = 0;
    let previousPredictedRevenue = 0;

    try {
      const tomorrowRevenueResult: any = await query(`
        SELECT
          COALESCE(SUM(predicted_revenue), 0) AS total
        FROM revenue_predictions
        WHERE prediction_date = CURRENT_DATE
      `);
      tomorrowPredictedRevenue = Number(tomorrowRevenueResult[0]?.total || 0);

      const previousRevenueResult: any = await query(`
        SELECT
          COALESCE(SUM(predicted_revenue), 0) AS total
        FROM revenue_predictions
        WHERE prediction_date = CURRENT_DATE - INTERVAL 1 DAY
      `);
      previousPredictedRevenue = Number(previousRevenueResult[0]?.total || 0);
    } catch {
      tomorrowPredictedRevenue = 0;
      previousPredictedRevenue = 0;
    }

    // =====================================================
    // REVENUE INCREASE
    // =====================================================

    const revenueIncrease = tomorrowPredictedRevenue - previousPredictedRevenue;
    const revenueIncreasePercentage =
      previousPredictedRevenue > 0
        ? (revenueIncrease / previousPredictedRevenue) * 100
        : 0;

    // =====================================================
    // BOOKING CANCELLATION PREDICTIONS
    // =====================================================

    let totalBookingCancellations = 0;
    let predictedCancellation = 0;
    let predictedNonCancellation = 0;

    try {
      const bookingCancellationResult: any = await query(`
        SELECT
          COUNT(*) AS totalBookings,
          COALESCE(SUM(CASE WHEN booking_cancellation_prediction = 1 THEN 1 ELSE 0 END), 0) AS predictedCancellation,
          COALESCE(SUM(CASE WHEN booking_cancellation_prediction = 0 THEN 1 ELSE 0 END), 0) AS predictedNonCancellation
        FROM bookings
        WHERE booking_cancellation_prediction IS NOT NULL
      `);

      totalBookingCancellations = Number(bookingCancellationResult[0]?.totalBookings || 0);
      predictedCancellation = Number(bookingCancellationResult[0]?.predictedCancellation || 0);
      predictedNonCancellation = Number(bookingCancellationResult[0]?.predictedNonCancellation || 0);
    } catch {
      totalBookingCancellations = 0;
      predictedCancellation = 0;
      predictedNonCancellation = 0;
    }

    // =====================================================
    // RECENT BOOKINGS
    // =====================================================

    let recentBookings: any[] = [];
    try {
      const recentBookingsResult: any = await query(`
        SELECT
          id AS bookingId,
          guest_name AS name,
          created_at AS bookingDate
        FROM bookings
        ORDER BY id DESC
        LIMIT 20
      `);

      recentBookings = recentBookingsResult.map((row: any) => ({
        bookingId: Number(row.bookingId),
        name: row.name || "Guest",
        prediction: 0,
        bookingDate: row.bookingDate ? new Date(row.bookingDate).toISOString().split("T")[0] : "",
      }));
    } catch {
      recentBookings = [];
    }


    // =====================================================
    // FINAL RESPONSE
    // =====================================================

    return res.json({

      totalCustomers,

      totalReservations,

      totalCancellations,

      totalReviews,


      // Guests
      guests: {

        adults:
          totalAdults,

        children:
          totalChildren,

        babies:
          totalBabies

      },


      // Requests
      requests: {

        parking:
          parkingRequests,

        special:
          specialRequests

      },


      // Customer segmentation
      segments: {

        segment1,

        segment2,

        segment3

      },


      // Revenue
      revenue: {

        tomorrowPredictedRevenue,

        revenueIncrease,

        revenueIncreasePercentage

      },


      // Booking cancellation
      bookingCancellation: {

        totalBookings:
          totalBookingCancellations,

        predictedCancellation:
          predictedCancellation,

        predictedNonCancellation:
          predictedNonCancellation,

        recentBookings:
          recentBookings

      }

    });


  } catch (error) {

    console.error(
      "❌ Dashboard API error:",
      error
    );

    return res.status(500).json({

      message:
        "Failed to load dashboard data."

    });

  }
});


// =====================================================
// CLEAR ALL BOOKINGS
// =====================================================

router.delete("/bookings", async (_req, res) => {

  try {

    await query(`
      TRUNCATE TABLE bookings
    `);

    await query(`
      TRUNCATE TABLE revenue_predictions
    `);

    console.log(
      "🗑️ All booking and revenue prediction data cleared successfully"
    );

    return res.json({

      success: true,

      message:
        "All booking and revenue prediction data cleared successfully."

    });

  } catch (error) {

    console.error(
      "❌ Clear bookings error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Failed to clear booking data."

    });

  }

});


// =====================================================
// ANNUAL REPORT
// =====================================================

router.get("/annual-report", async (req, res) => {
  try {
    const orgId = req.query.org_id as string;
    const yearStr = req.query.year as string;

    if (!orgId || !yearStr) {
      return res.status(400).json({ success: false, message: "org_id and year are required" });
    }

    const year = parseInt(yearStr, 10);
    if (isNaN(year)) {
      return res.status(400).json({ success: false, message: "invalid year" });
    }

    // Get total rooms for the branch
    const roomsResult: any = await query(`
      SELECT COUNT(*) as total
      FROM rooms
      WHERE org_id = ? AND is_deleted = FALSE
    `, [orgId]);
    const totalRooms = Number(roomsResult[0]?.total || 0);

    const reportData = [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 1; i <= 12; i++) {
      // Calculate revenue (sum of amount_paid where check_in date is in this month and year)
      // Exclude cancelled bookings
      const revenueResult: any = await query(`
        SELECT COALESCE(SUM(amount_paid), 0) as total_revenue,
               COUNT(*) as total_checkins
        FROM bookings
        WHERE org_id = ?
          AND LOWER(status) != 'cancelled'
          AND YEAR(STR_TO_DATE(check_in_date, '%d %b %Y')) = ?
          AND MONTH(STR_TO_DATE(check_in_date, '%d %b %Y')) = ?
      `, [orgId, year, i]);

      const checkOutResult: any = await query(`
        SELECT COUNT(*) as total_checkouts
        FROM bookings
        WHERE org_id = ?
          AND LOWER(status) != 'cancelled'
          AND YEAR(STR_TO_DATE(check_out_date, '%d %b %Y')) = ?
          AND MONTH(STR_TO_DATE(check_out_date, '%d %b %Y')) = ?
      `, [orgId, year, i]);

      // Calculate occupancy: total nights occupied in this month
      const nightsResult: any = await query(`
        SELECT COALESCE(SUM(nights), 0) as total_nights
        FROM bookings
        WHERE org_id = ?
          AND LOWER(status) != 'cancelled'
          AND YEAR(STR_TO_DATE(check_in_date, '%d %b %Y')) = ?
          AND MONTH(STR_TO_DATE(check_in_date, '%d %b %Y')) = ?
      `, [orgId, year, i]);

      const revenue = Number(revenueResult[0]?.total_revenue || 0);
      const checkIn = Number(revenueResult[0]?.total_checkins || 0);
      const checkOut = Number(checkOutResult[0]?.total_checkouts || 0);
      const bookedNights = Number(nightsResult[0]?.total_nights || 0);

      let occupancyRate = 0;
      const daysInMonth = new Date(year, i, 0).getDate();
      const totalAvailableNights = totalRooms * daysInMonth;

      if (totalAvailableNights > 0) {
        occupancyRate = Math.min(100, Math.round((bookedNights / totalAvailableNights) * 100));
      }

      reportData.push({
        timeframe: `${months[i - 1]} ${year}`,
        checkIn,
        checkOut,
        revenue,
        occupancyRate: `${occupancyRate}%`
      });
    }

    return res.json({ success: true, data: reportData });
  } catch (error: any) {
    console.error("❌ Annual report error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate report: " + error.message });
  }
});
router.get("/financial-audit", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const orgId = req.query.org_id as string;
    if (!orgId) {
      return res.status(400).json({ success: false, message: "org_id is required" });
    }

    const userRole = String(req.userRole || "user").trim().toLowerCase().replace(/\s+/g, "_");
    const isGlobalAccess = (
      userRole === "super_admin" ||
      userRole === "admin" ||
      userRole === "manager" ||
      userRole === "owner" ||
      /admin|super|manager|owner|receptionist|staff|front_desk/i.test(userRole)
    );

    // If not global access, ensure requested orgId matches their token's orgId
    if (!isGlobalAccess && req.userOrgCode !== orgId) {
      return res.status(403).json({ success: false, message: "Access denied. You are not authorized to view financial data for this branch." });
    }

    // Count paid bookings
    const result: any = await query(`
      SELECT COUNT(*) as room_transactions 
      FROM bookings 
      WHERE org_id = ? 
        AND (amount_paid > 0 OR payment_status = 'Paid') 
        AND LOWER(status) != 'cancelled'
    `, [orgId]);

    const roomBookings = Number(result[0]?.room_transactions || 0);
    const posOrders = 0; // F&B/POS not yet supported in DB
    const amenitiesLaundry = 0; // Amenities/Laundry billing not yet supported in DB
    const totalTransactions = roomBookings + posOrders + amenitiesLaundry;

    return res.json({
      success: true,
      data: {
        totalTransactions,
        roomBookings,
        posOrders,
        amenitiesLaundry
      }
    });

  } catch (error: any) {
    console.error("❌ Financial audit error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate financial audit: " + error.message });
  }
});

// =====================================================
// CHECK-IN & CHECK-OUT ACTIVITY / REVENUE REPORT
// =====================================================
router.get(["/activity-report", "/revenue-report"], async (req: Request, res: Response) => {
  try {
    const orgId = (req.query.org_id as string) || (req.query.orgId as string) || (req.headers["x-org-id"] as string);
    const timeframe = (req.query.timeframe as string) || "Weekly";

    // 1. Fetch total rooms for branch / org (for occupancy calculation)
    let roomsQuery = "SELECT COUNT(*) as total FROM rooms WHERE is_deleted = FALSE";
    const roomsParams: any[] = [];
    if (orgId && orgId !== "all") {
      roomsQuery += " AND org_id = ?";
      roomsParams.push(orgId);
    }
    const roomsResult: any = await query(roomsQuery, roomsParams);
    const totalRooms = Number(roomsResult[0]?.total || 0);

    // 2. Fetch bookings for branch / org excluding cancelled
    let bookingsQuery = `
      SELECT id, booking_code, room_id, room_number, org_id, status, type,
             check_in_date, check_out_date, amount_paid, final_amount, nights, created_at
      FROM bookings
      WHERE LOWER(status) != 'cancelled' AND (type != 'Cancelled' OR type IS NULL)
    `;
    const bookingsParams: any[] = [];
    if (orgId && orgId !== "all") {
      bookingsQuery += " AND org_id = ?";
      bookingsParams.push(orgId);
    }
    const bookings: any[] = await query(bookingsQuery, bookingsParams);

    const now = new Date();

    if (timeframe.toLowerCase() === "monthly") {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : now.getFullYear();
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthlyData = [];

      let totalCheckIn = 0;
      let totalCheckOut = 0;

      for (let m = 0; m < 12; m++) {
        let checkInCount = 0;
        let checkOutCount = 0;
        let monthRevenue = 0;
        let totalNightsOccupied = 0;

        for (const b of bookings) {
          const ci = parseBookingDate(b.check_in_date);
          const co = parseBookingDate(b.check_out_date);

          const isCheckedInStatus =
            b.status === "Active Stay" ||
            b.status === "Active" ||
            b.status === "Occupied" ||
            b.status === "Completed" ||
            b.status === "Checked Out" ||
            b.type === "Previous";

          const isCheckedOutStatus =
            b.status === "Completed" ||
            b.status === "Checked Out" ||
            b.type === "Previous";

          if (ci && isCheckedInStatus) {
            if (ci.getFullYear() === year && ci.getMonth() === m) {
              checkInCount++;
              monthRevenue += Number(b.final_amount || b.amount_paid || 0);
            }
          }

          if (co && isCheckedOutStatus) {
            if (co.getFullYear() === year && co.getMonth() === m) {
              checkOutCount++;
            }
          }

          if (ci && isCheckedInStatus) {
            if (ci.getFullYear() === year && ci.getMonth() === m) {
              totalNightsOccupied += Number(b.nights || 1);
            }
          }
        }

        const daysInMonth = new Date(year, m + 1, 0).getDate();
        const totalAvailableNights = totalRooms * daysInMonth;
        const occupancyRate = totalAvailableNights > 0
          ? `${Math.min(100, Math.round((totalNightsOccupied / totalAvailableNights) * 100))}%`
          : "0%";

        totalCheckIn += checkInCount;
        totalCheckOut += checkOutCount;

        monthlyData.push({
          label: months[m],
          month: m + 1,
          year,
          checkIn: checkInCount,
          checkOut: checkOutCount,
          checkOutNeg: -checkOutCount,
          revenue: monthRevenue,
          occupancyRate,
        });
      }

      return res.json({
        success: true,
        timeframe: "Monthly",
        orgId: orgId || "all",
        totalCheckIn,
        totalCheckOut,
        data: monthlyData,
      });
    }

    // Default: Weekly (Sun → Sat)
    const currentDayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - currentDayOfWeek, 0, 0, 0, 0);

    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyData = [];
    let totalCheckIn = 0;
    let totalCheckOut = 0;

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i);
      const dayYear = dayDate.getFullYear();
      const dayMonth = dayDate.getMonth();
      const dayDay = dayDate.getDate();

      const dateStr = `${dayYear}-${String(dayMonth + 1).padStart(2, "0")}-${String(dayDay).padStart(2, "0")}`;

      let checkInCount = 0;
      let checkOutCount = 0;
      let dayRevenue = 0;
      let occupiedCount = 0;

      for (const b of bookings) {
        const ci = parseBookingDate(b.check_in_date);
        const co = parseBookingDate(b.check_out_date);

        const isCheckedInStatus =
          b.status === "Active Stay" ||
          b.status === "Active" ||
          b.status === "Occupied" ||
          b.status === "Completed" ||
          b.status === "Checked Out" ||
          b.type === "Previous";

        const isCheckedOutStatus =
          b.status === "Completed" ||
          b.status === "Checked Out" ||
          b.type === "Previous";

        if (ci && isCheckedInStatus) {
          if (ci.getFullYear() === dayYear && ci.getMonth() === dayMonth && ci.getDate() === dayDay) {
            checkInCount++;
            dayRevenue += Number(b.final_amount || b.amount_paid || 0);
          }
        }

        if (co && isCheckedOutStatus) {
          if (co.getFullYear() === dayYear && co.getMonth() === dayMonth && co.getDate() === dayDay) {
            checkOutCount++;
          }
        }

        if (ci && co && isCheckedInStatus) {
          const startOfDay = new Date(dayYear, dayMonth, dayDay, 0, 0, 0).getTime();
          const ciTime = new Date(ci.getFullYear(), ci.getMonth(), ci.getDate(), 0, 0, 0).getTime();
          const coTime = new Date(co.getFullYear(), co.getMonth(), co.getDate(), 0, 0, 0).getTime();
          if (ciTime <= startOfDay && coTime > startOfDay) {
            occupiedCount++;
          }
        }
      }

      const occupancyRate = totalRooms > 0
        ? `${Math.min(100, Math.round((occupiedCount / totalRooms) * 100))}%`
        : "0%";

      totalCheckIn += checkInCount;
      totalCheckOut += checkOutCount;

      weeklyData.push({
        label: dayLabels[i],
        date: dateStr,
        checkIn: checkInCount,
        checkOut: checkOutCount,
        checkOutNeg: -checkOutCount,
        revenue: dayRevenue,
        occupancyRate,
      });
    }

    return res.json({
      success: true,
      timeframe: "Weekly",
      orgId: orgId || "all",
      totalCheckIn,
      totalCheckOut,
      data: weeklyData,
    });
  } catch (error: any) {
    console.error("❌ Activity report error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate report: " + error.message });
  }
});

export default router;