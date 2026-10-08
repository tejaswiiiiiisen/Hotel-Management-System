import { Router } from "express";
import { query } from "../db.js";

const router = Router();


// =====================================================
// REVENUE PREDICTION
// =====================================================

router.post("/predict", async (req, res) => {
  try {

    // ---------------------------------------------
    // 1. Send booking data to FastAPI model
    // ---------------------------------------------

    const response = await fetch(
      "http://127.0.0.1:8000/api/revenue-prediction/predict",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(req.body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res
        .status(response.status)
        .json(data);
    }


    // ---------------------------------------------
    // 2. Get predicted revenue
    // ---------------------------------------------

    const predictedRevenue = Number(
      data.predicted_revenue || 0
    );


    // ---------------------------------------------
    // 3. Store prediction in database
    // ---------------------------------------------

    const bookingId = req.body.booking_id || null;

    await query(
      `
      INSERT INTO revenue_predictions
      (
        booking_id,
        predicted_revenue,
        prediction_date
      )
      VALUES (?, ?, CURDATE())
      `,
      [
        bookingId,
        predictedRevenue,
      ]
    );


    // ---------------------------------------------
    // 4. Return prediction
    // ---------------------------------------------

    return res.json({
      success: true,
      predicted_revenue: predictedRevenue,
    });

  } catch (error) {

    console.error(
      "Revenue prediction API error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Revenue prediction service unavailable",
    });

  }
});


// =====================================================
// CLEAR REVENUE / BOOKING DATA
// =====================================================

router.delete("/", async (_req, res) => {

  try {

    await query(`
      TRUNCATE TABLE bookings
    `);

    await query(`
      TRUNCATE TABLE revenue_predictions
    `);

    console.log(
      "🗑️ Revenue and booking data cleared successfully"
    );

    return res.status(200).json({

      success: true,

      message:
        "All booking and revenue data cleared successfully.",

    });

  } catch (error) {

    console.error(
      "❌ Clear revenue data error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Failed to clear revenue data.",

    });

  }

});


export default router;