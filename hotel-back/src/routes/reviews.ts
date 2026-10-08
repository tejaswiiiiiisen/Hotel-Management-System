import { Router } from "express";
import { query } from "../db.js";

const router = Router();


// =====================================================
// GET LATEST 20 REVIEWS
// =====================================================

router.get("/reviews", async (_req, res) => {
  try {

    const rows: any = await query(`
      SELECT
        review_id,
        review_text,
        sentiment,
        created_at
      FROM reviews
      ORDER BY review_id DESC
      LIMIT 20
    `);

    return res.status(200).json({
      reviews: rows,
    });

  } catch (error) {

    console.error(
      "❌ Fetch reviews error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch reviews from database.",
    });

  }
});


// =====================================================
// DELETE ALL REVIEWS
// =====================================================

router.delete("/reviews", async (_req, res) => {
  try {

    await query(`
      TRUNCATE TABLE reviews
    `);

    console.log(
      "🗑️ All reviews cleared successfully"
    );

    return res.status(200).json({
      success: true,
      message:
        "All customer reviews cleared successfully.",
    });

  } catch (error) {

    console.error(
      "❌ Clear reviews error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to clear reviews from database.",
    });

  }
});


export default router;