import { Router } from "express";
import { query } from "../db.js";

const router = Router();


// =====================================================
// GET CUSTOMER SEGMENTATION
// =====================================================

router.get("/", async (_req, res) => {
  try {

    const totalResult: any = await query(`
      SELECT COUNT(*) AS total
      FROM bookings
    `);

    const total =
      Number(totalResult[0]?.total || 0);


    let segment1 = 0;
    let segment2 = 0;
    let segment3 = 0;

    try {
      const segmentResult: any = await query(`
        SELECT
          customer_segment,
          COUNT(*) AS count
        FROM bookings
        WHERE customer_segment IS NOT NULL
        GROUP BY customer_segment
        ORDER BY customer_segment
      `);

      for (const row of segmentResult) {
        const segment = Number(row.customer_segment);
        const count = Number(row.count || 0);

        if (segment === 0) segment1 = count;
        if (segment === 1) segment2 = count;
        if (segment === 2) segment3 = count;
      }
    } catch {
      // Fallback: try counting tiers from customers table
      try {
        const tierResult: any = await query(`
          SELECT tier, COUNT(*) AS count
          FROM customers
          GROUP BY tier
        `);
        for (const row of tierResult) {
          const t = String(row.tier || "").toLowerCase();
          const count = Number(row.count || 0);
          if (t.includes("bronze") || t.includes("standard")) segment1 += count;
          else if (t.includes("silver") || t.includes("premium")) segment2 += count;
          else segment3 += count;
        }
      } catch {
        segment1 = 0;
        segment2 = 0;
        segment3 = 0;
      }
    }


    let customers: any[] = [];
    try {
      customers = await query(`
        SELECT
          id AS booking_id,
          name AS full_name,
          tier AS customer_segment
        FROM customers
        ORDER BY id DESC
        LIMIT 20
      `);
    } catch {
      try {
        customers = await query(`
          SELECT
            id AS booking_id,
            guest_name AS full_name,
            type AS customer_segment
          FROM bookings
          ORDER BY id DESC
          LIMIT 20
        `);
      } catch {
        customers = [];
      }
    }

    const topCustomers = customers.map((customer: any) => ({
      id: customer.booking_id,
      booking_id: customer.booking_id,
      name: customer.full_name || "Customer",
      segment: customer.customer_segment || "Standard",
    }));


    return res.json({

      total,

      segments: {

        segment1,

        segment2,

        segment3,

      },

      topCustomers,

    });


  } catch (error) {

    console.error(
      "❌ Customer segmentation dashboard error:",
      error
    );

    return res.status(500).json({

      message:
        "Failed to fetch customer segmentation data.",

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
      "🗑️ All booking/segmentation data cleared successfully"
    );


    return res.status(200).json({

      success: true,

      message:
        "All booking and customer segmentation data cleared successfully.",

    });


  } catch (error) {

    console.error(
      "❌ Clear customer segmentation error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Failed to clear booking and segmentation data.",

    });

  }

});


export default router;