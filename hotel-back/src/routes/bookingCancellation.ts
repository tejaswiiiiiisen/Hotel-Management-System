import { Router } from "express";
import { query } from "../db.js";

const router = Router();


// =====================================================
// GET BOOKING CANCELLATION DATA
// =====================================================

router.get("/", async (_req, res) => {
  try {
    let totalBookings = 0;
    try {
      const totalResult: any = await query(`SELECT COUNT(*) AS total FROM bookings`);
      totalBookings = Number(totalResult[0]?.total || 0);
    } catch {
      totalBookings = 0;
    }

    let predictedCancellation = 0;
    try {
      const cancellationResult: any = await query(`
        SELECT COUNT(*) AS total
        FROM bookings
        WHERE booking_cancellation_prediction = 1
      `);
      predictedCancellation = Number(cancellationResult[0]?.total || 0);
    } catch {
      predictedCancellation = 0;
    }

    const predictedNonCancellation = Math.max(totalBookings - predictedCancellation, 0);

    // =================================================
    // RECENT BOOKINGS
    // =================================================

    let formattedBookings: any[] = [];
    try {
      const recentBookings: any = await query(`
        SELECT
          id AS booking_id,
          guest_name AS full_name,
          created_at AS booking_date
        FROM bookings
        ORDER BY id DESC
        LIMIT 20
      `);

      formattedBookings = recentBookings.map((booking: any) => ({
        bookingId: booking.booking_id,
        name: booking.full_name || "Guest",
        bookingDate: booking.booking_date ? new Date(booking.booking_date).toISOString().split("T")[0] : "",
        prediction: 0,
      }));
    } catch {
      formattedBookings = [];
    }


    // =================================================
    // CANCELLATION RATE
    // =================================================

    const cancellationRate =
      totalBookings > 0
        ? (
            (predictedCancellation /
              totalBookings) *
            100
          ).toFixed(1)
        : "0.0";





    return res.json({

      totalBookings,

      predictedCancellation,

      predictedNonCancellation,

      cancellationRate,

      recentBookings:
        formattedBookings,

    });

  } catch (error) {

    console.error(
      "❌ Booking cancellation dashboard error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to load booking cancellation data.",
    });

  }
});


// =====================================================
// CLEAR ALL BOOKING DATA
// =====================================================

router.delete("/", async (_req, res) => {

  try {

    await query(`
      TRUNCATE TABLE bookings
    `);

    console.log(
      "🗑️ All booking data cleared successfully"
    );

    return res.status(200).json({

      success: true,

      message:
        "All booking data cleared successfully.",

    });

  } catch (error) {

    console.error(
      "❌ Clear booking data error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Failed to clear booking data.",

    });

  }

});


export default router;