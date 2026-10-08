import { Router, Request, Response } from "express";
import { query } from "../db.js";

const router = Router();

/* =========================================================
   HELPERS
========================================================= */

function normalize(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[?!.:,;]/g, "")
    .replace(/\s+/g, " ");
}

function hasAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function formatNumber(value: any) {
  const number = Number(value || 0);

  return new Intl.NumberFormat("en-IN").format(
    Number.isFinite(number) ? number : 0
  );
}

function formatCurrency(value: any) {
  const number = Number(value || 0);

  return `₹${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0)}`;
}

function formatDate(value: any) {
  if (!value) return "Not available";

  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  return String(value);
}

function numberedList(
  rows: any[],
  formatter: (row: any, index: number) => string
) {
  return rows
    .map((row, index) => {
      return `${index + 1}. ${formatter(row, index)}`;
    })
    .join("\n\n");
}

function bullet(label: string, value: any) {
  return `   • ${label}: ${value ?? "Not available"}`;
}

function section(title: string, content: string) {
  return `${title}\n\n${content}`;
}

/* =========================================================
   ROOM NUMBER EXTRACTOR
========================================================= */

function extractRoomNumber(question: string) {
  const match = question.match(
    /\broom\s*(?:number|no\.?|#)?\s*(\d{3,4})\b/i
  );

  return match ? match[1] : null;
}

/* =========================================================
   STAFF NAME MATCHING
========================================================= */

function staffNameMatches(question: string, staffName: string) {
  const normalizedQuestion = normalize(question);
  const normalizedName = normalize(staffName);

  if (normalizedQuestion.includes(normalizedName)) {
    return true;
  }

  const parts = normalizedName.split(" ");

  return parts.some(
    (part) =>
      part.length >= 4 &&
      normalizedQuestion.includes(part)
  );
}

/* =========================================================
   SEGMENT NAME
========================================================= */

function getSegmentName(segment: any) {
  const value = Number(segment);

  if (value === 0) return "Premium";
  if (value === 1) return "Budget";
  if (value === 2) return "Regular";

  return `Segment ${segment}`;
}

/* =========================================================
   CHATBOT
========================================================= */

router.post(
  "/chatbot",
  async (req: Request, res: Response) => {
    try {
      const question = req.body?.message;

      if (
        !question ||
        typeof question !== "string" ||
        !question.trim()
      ) {
        return res.status(400).json({
          message: "Please provide a valid question.",
        });
      }

      const q = normalize(question);

      /* =====================================================
         CUSTOMER / GUEST INFORMATION
      ===================================================== */

      const asksCustomer =
        hasAny(q, [
          "customer",
          "customers",
          "guest",
          "guests",
          "client",
          "clients",
          "visitor",
          "visitors",
        ]);

      const asksHowMany =
        hasAny(q, [
          "how many",
          "how much",
          "number of",
          "count",
          "total",
          "number",
        ]);

      /* -----------------------------------------------------
         TOTAL CUSTOMERS
      ----------------------------------------------------- */

      if (
        asksCustomer &&
        asksHowMany &&
        !hasAny(q, [
          "adult",
          "child",
          "children",
          "baby",
          "babies",
          "segment",
          "repeat",
        ])
      ) {
        let rows: any = [];
        try {
          rows = await query(`
            SELECT COUNT(DISTINCT email) AS total
            FROM customers
            WHERE email IS NOT NULL AND TRIM(email) != ''
          `);
        } catch {
          rows = await query(`
            SELECT COUNT(DISTINCT guest_email) AS total
            FROM bookings
            WHERE guest_email IS NOT NULL AND TRIM(guest_email) != ''
          `);
        }

        return res.json({
          message: section(
            "👤 Customer Information",
            [
              bullet(
                "Total customers",
                formatNumber(rows[0]?.total || 0)
              ),
            ].join("\n")
          ),
        });
      }

      /* -----------------------------------------------------
         TOTAL ADULTS / GUESTS
      ----------------------------------------------------- */

      if (
        hasAny(q, [
          "how many adults",
          "total adults",
          "adult count",
          "number of adults",
          "adult guests",
          "adult guest",
          "how many adult",
        ])
      ) {
        const rows: any = await query(`
          SELECT COALESCE(SUM(guests), 0) AS total
          FROM bookings
        `);

        return res.json({
          message: section(
            "👨 Adult Guests",
            bullet(
              "Total adults",
              formatNumber(rows[0]?.total)
            )
          ),
        });
      }

      /* -----------------------------------------------------
         TOTAL CHILDREN
      ----------------------------------------------------- */

      if (
        hasAny(q, [
          "how many children",
          "total children",
          "child count",
          "children count",
          "number of children",
          "child guests",
          "child guest",
          "how many child",
        ])
      ) {
        return res.json({
          message: section(
            "🧒 Child Guests",
            bullet("Total children", "0")
          ),
        });
      }

      /* -----------------------------------------------------
         TOTAL BABIES
      ----------------------------------------------------- */

      if (
        hasAny(q, [
          "how many babies",
          "total babies",
          "baby count",
          "babies count",
          "number of babies",
          "baby guests",
          "baby guest",
          "how many baby",
          "infants",
          "how many infants",
        ])
      ) {
        return res.json({
          message: section(
            "👶 Baby Guests",
            bullet("Total babies", "0")
          ),
        });
      }

      /* -----------------------------------------------------
         TOTAL GUESTS
      ----------------------------------------------------- */

      if (
        hasAny(q, [
          "how many guests",
          "total guests",
          "guest count",
          "number of guests",
          "total guest",
          "guest total",
        ])
      ) {
        const rows: any = await query(`
          SELECT COALESCE(SUM(guests), 0) AS total
          FROM bookings
        `);

        return res.json({
          message: section(
            "👥 Guest Information",
            bullet(
              "Total guests",
              formatNumber(rows[0]?.total)
            )
          ),
        });
      }

      /* -----------------------------------------------------
         CUSTOMER LIST
      ----------------------------------------------------- */

      if (
        asksCustomer &&
        hasAny(q, [
          "list",
          "show",
          "all",
          "names",
          "customers list",
          "customer list",
          "guest list",
          "guest names",
        ])
      ) {
        let rows: any = [];
        try {
          rows = await query(`
            SELECT
              name AS full_name,
              email,
              phone,
              bookings AS total_bookings
            FROM customers
            ORDER BY name
            LIMIT 50
          `);
        } catch {
          rows = await query(`
            SELECT
              guest_name AS full_name,
              guest_email AS email,
              guest_phone AS phone,
              COUNT(*) AS total_bookings
            FROM bookings
            GROUP BY guest_name, guest_email, guest_phone
            ORDER BY guest_name
            LIMIT 50
          `);
        }

        if (rows.length === 0) {
          return res.json({
            message:
              "👤 No customer information is available.",
          });
        }

        return res.json({
          message: section(
            "👤 Customer List",
            numberedList(rows, (row) => {
              return [
                `👤 ${row.full_name || "Unknown customer"}`,
                bullet("Email", row.email),
                bullet("Phone", row.phone),
                bullet(
                  "Bookings",
                  formatNumber(row.total_bookings)
                ),
              ].join("\n");
            })
          ),
        });
      }

      /* -----------------------------------------------------
         LATEST CUSTOMERS
      ----------------------------------------------------- */

      if (
        asksCustomer &&
        hasAny(q, [
          "latest customer",
          "recent customer",
          "new customer",
          "recent guests",
          "latest guests",
          "new guests",
        ])
      ) {
        let rows: any = [];
        try {
          rows = await query(`
            SELECT
              name AS full_name,
              email,
              phone,
              id AS booking_id,
              created_at AS booking_date
            FROM customers
            ORDER BY id DESC
            LIMIT 10
          `);
        } catch {
          rows = await query(`
            SELECT
              guest_name AS full_name,
              guest_email AS email,
              guest_phone AS phone,
              id AS booking_id,
              created_at AS booking_date
            FROM bookings
            ORDER BY id DESC
            LIMIT 10
          `);
        }

        if (rows.length === 0) {
          return res.json({
            message: "👤 No customers are available.",
          });
        }

        return res.json({
          message: section(
            "👤 Recent Customers",
            numberedList(rows, (row) => {
              return [
                `👤 ${row.full_name || "Unknown customer"}`,
                bullet("Email", row.email),
                bullet("Phone", row.phone),
                bullet(
                  "ID",
                  row.booking_id
                ),
                bullet(
                  "Date",
                  formatDate(row.booking_date)
                ),
              ].join("\n");
            })
          ),
        });
      }

      /* -----------------------------------------------------
         CUSTOMER SEARCH BY NAME / DETAILS
      ----------------------------------------------------- */

      if (
        asksCustomer &&
        !asksHowMany &&
        !hasAny(q, [
          "segment",
          "adult",
          "child",
          "baby",
          "guest count",
          "total guest",
        ])
      ) {
        let rows: any = [];
        try {
          rows = await query(`
            SELECT
              id AS booking_id,
              name AS full_name,
              email,
              phone,
              created_at AS booking_date,
              check_in AS check_in_date,
              check_out AS check_out_date,
              guests_count AS adults,
              room_booked AS room_type_reserved,
              status AS booking_status
            FROM customers
            ORDER BY id DESC
            LIMIT 100
          `);
        } catch {
          rows = await query(`
            SELECT
              id AS booking_id,
              guest_name AS full_name,
              guest_email AS email,
              guest_phone AS phone,
              created_at AS booking_date,
              check_in_date,
              check_out_date,
              guests AS adults,
              room_name AS room_type_reserved,
              status AS booking_status
            FROM bookings
            ORDER BY id DESC
            LIMIT 100
          `);
        }

        const matched = rows.filter((row: any) => {
          const name = normalize(row.full_name || "");
          const email = normalize(row.email || "");
          const phone = normalize(row.phone || "");

          return (
            (name && q.includes(name)) ||
            (email && q.includes(email)) ||
            (phone && q.includes(phone))
          );
        });

        const listToDisplay = matched.length > 0 ? matched : rows.slice(0, 5);

        if (listToDisplay.length > 0) {
          return res.json({
            message: section(
              "👤 Customer Information",
              numberedList(
                listToDisplay,
                (row) => {
                  return [
                    `👤 ${row.full_name || "Unknown customer"}`,
                    bullet("ID", row.booking_id),
                    bullet("Email", row.email),
                    bullet("Phone", row.phone),
                    bullet(
                      "Date",
                      formatDate(row.booking_date)
                    ),
                    bullet(
                      "Check-in",
                      formatDate(row.check_in_date)
                    ),
                    bullet(
                      "Check-out",
                      formatDate(row.check_out_date)
                    ),
                    bullet(
                      "Guests",
                      formatNumber(row.adults || 1)
                    ),
                    bullet(
                      "Room",
                      row.room_type_reserved
                    ),
                    bullet(
                      "Status",
                      row.booking_status
                    ),
                  ].join("\n");
                }
              )
            ),
          });
        }
      }

      /* =====================================================
         REVIEWS
      ===================================================== */

      if (
        hasAny(q, [
          "total review",
          "how many review",
          "reviews do we have",
          "review count",
          "number of reviews",
        ])
      ) {
        const rows: any = await query(`
          SELECT COUNT(*) AS total
          FROM reviews
        `);

        return res.json({
          message: section(
            "⭐ Review Information",
            bullet(
              "Total reviews",
              formatNumber(rows[0]?.total)
            )
          ),
        });
      }

      if (
        hasAny(q, [
          "positive review",
          "how many positive",
          "positive reviews count",
        ])
      ) {
        const rows: any = await query(`
          SELECT COUNT(*) AS total
          FROM reviews
          WHERE LOWER(sentiment) = 'positive'
        `);

        return res.json({
          message: section(
            "😊 Positive Reviews",
            bullet(
              "Total positive reviews",
              formatNumber(rows[0]?.total)
            )
          ),
        });
      }

      if (
        hasAny(q, [
          "negative review",
          "how many negative",
          "negative reviews count",
        ])
      ) {
        const rows: any = await query(`
          SELECT COUNT(*) AS total
          FROM reviews
          WHERE LOWER(sentiment) = 'negative'
        `);

        return res.json({
          message: section(
            "😞 Negative Reviews",
            bullet(
              "Total negative reviews",
              formatNumber(rows[0]?.total)
            )
          ),
        });
      }

      if (
        hasAny(q, [
          "neutral review",
          "how many neutral",
          "neutral reviews count",
        ])
      ) {
        const rows: any = await query(`
          SELECT COUNT(*) AS total
          FROM reviews
          WHERE LOWER(sentiment) = 'neutral'
        `);

        return res.json({
          message: section(
            "😐 Neutral Reviews",
            bullet(
              "Total neutral reviews",
              formatNumber(rows[0]?.total)
            )
          ),
        });
      }

      if (
        q.includes("sentiment") &&
        hasAny(q, [
          "distribution",
          "breakdown",
          "overall",
          "summary",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            LOWER(sentiment) AS sentiment,
            COUNT(*) AS total
          FROM reviews
          GROUP BY LOWER(sentiment)
        `);

        const result: Record<string, number> = {};

        rows.forEach((row: any) => {
          result[row.sentiment] = Number(row.total);
        });

        return res.json({
          message: section(
            "📊 Review Sentiment",
            [
              bullet(
                "Positive",
                formatNumber(result.positive || 0)
              ),
              bullet(
                "Negative",
                formatNumber(result.negative || 0)
              ),
              bullet(
                "Neutral",
                formatNumber(result.neutral || 0)
              ),
            ].join("\n")
          ),
        });
      }

      if (
        hasAny(q, [
          "review percentage",
          "percentage of reviews",
          "percent of reviews",
          "review percentages",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            COUNT(*) AS total,
            SUM(LOWER(sentiment) = 'positive') AS positive,
            SUM(LOWER(sentiment) = 'negative') AS negative,
            SUM(LOWER(sentiment) = 'neutral') AS neutral
          FROM reviews
        `);

        const total = Number(rows[0]?.total || 0);

        if (total === 0) {
          return res.json({
            message:
              "⭐ There are currently no reviews.",
          });
        }

        const positive =
          (
            (Number(rows[0]?.positive || 0) / total) *
            100
          ).toFixed(1);

        const negative =
          (
            (Number(rows[0]?.negative || 0) / total) *
            100
          ).toFixed(1);

        const neutral =
          (
            (Number(rows[0]?.neutral || 0) / total) *
            100
          ).toFixed(1);

        return res.json({
          message: section(
            "📊 Review Percentages",
            [
              bullet("Positive", `${positive}%`),
              bullet("Negative", `${negative}%`),
              bullet("Neutral", `${neutral}%`),
            ].join("\n")
          ),
        });
      }

      if (
        hasAny(q, [
          "latest review",
          "recent review",
          "latest reviews",
          "recent reviews",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            review_text,
            sentiment,
            created_at
          FROM reviews
          ORDER BY created_at DESC
          LIMIT 10
        `);

        if (rows.length === 0) {
          return res.json({
            message: "⭐ There are no reviews yet.",
          });
        }

        return res.json({
          message: section(
            "⭐ Recent Reviews",
            numberedList(rows, (row) => {
              return [
                `💬 ${row.review_text}`,
                bullet("Sentiment", row.sentiment),
                bullet(
                  "Created",
                  formatDate(row.created_at)
                ),
              ].join("\n");
            })
          ),
        });
      }

      /* =====================================================
         BOOKINGS
      ===================================================== */

      if (
        hasAny(q, [
          "total booking",
          "how many booking",
          "booking count",
          "bookings do we have",
          "number of bookings",
          "booking",
          "bookings"
        ]) &&
        !hasAny(q, [
          "today",
          "month",
          "year",
          "room",
        ])
      ) {
        const rows: any = await query(`
          SELECT COUNT(*) AS total
          FROM bookings
        `);

        return res.json({
          message: section(
            "📘 Booking Information",
            bullet(
              "Total bookings",
              formatNumber(rows[0]?.total)
            )
          ),
        });
      }

      if (
        hasAny(q, [
          "today booking",
          "bookings today",
          "today's bookings",
        ])
      ) {
        const rows: any = await query(`
          SELECT COUNT(*) AS total
          FROM bookings
          WHERE booking_date = CURDATE()
        `);

        return res.json({
          message: section(
            "📅 Today's Bookings",
            bullet(
              "Bookings today",
              formatNumber(rows[0]?.total)
            )
          ),
        });
      }

      if (
        hasAny(q, [
          "this month booking",
          "bookings this month",
          "monthly bookings",
        ])
      ) {
        const rows: any = await query(`
          SELECT COUNT(*) AS total
          FROM bookings
          WHERE YEAR(booking_date) = YEAR(CURDATE())
          AND MONTH(booking_date) = MONTH(CURDATE())
        `);

        return res.json({
          message: section(
            "📅 Monthly Bookings",
            bullet(
              "Bookings this month",
              formatNumber(rows[0]?.total)
            )
          ),
        });
      }

      if (
        hasAny(q, [
          "this year booking",
          "bookings this year",
          "yearly bookings",
        ])
      ) {
        const rows: any = await query(`
          SELECT COUNT(*) AS total
          FROM bookings
          WHERE YEAR(booking_date) = YEAR(CURDATE())
        `);

        return res.json({
          message: section(
            "📅 Yearly Bookings",
            bullet(
              "Bookings this year",
              formatNumber(rows[0]?.total)
            )
          ),
        });
      }

      if (
        hasAny(q, [
          "recent booking",
          "latest booking",
          "recent bookings",
          "latest bookings",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            booking_id,
            full_name,
            room_type_reserved,
            check_in_date,
            check_out_date,
            adults,
            children,
            babies,
            average_price_per_room,
            booking_status
          FROM bookings
          ORDER BY booking_id DESC
          LIMIT 10
        `);

        if (rows.length === 0) {
          return res.json({
            message: "📘 There are no bookings yet.",
          });
        }

        return res.json({
          message: section(
            "📘 Recent Bookings",
            numberedList(rows, (row) => {
              return [
                `🏨 Booking #${row.booking_id}`,
                bullet("Customer", row.full_name),
                bullet(
                  "Room",
                  row.room_type_reserved
                ),
                bullet(
                  "Check-in",
                  formatDate(row.check_in_date)
                ),
                bullet(
                  "Check-out",
                  formatDate(row.check_out_date)
                ),
                bullet(
                  "Adults",
                  formatNumber(row.adults)
                ),
                bullet(
                  "Children",
                  formatNumber(row.children)
                ),
                bullet(
                  "Babies",
                  formatNumber(row.babies)
                ),
                bullet(
                  "Price",
                  formatCurrency(
                    row.average_price_per_room
                  )
                ),
                bullet(
                  "Status",
                  row.booking_status
                ),
              ].join("\n");
            })
          ),
        });
      }

      /* -----------------------------------------------------
         AVERAGE ROOM PRICE
      ----------------------------------------------------- */

      if (
        hasAny(q, [
          "average room price",
          "average booking price",
          "average price",
          "average room cost",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            ROUND(
              AVG(average_price_per_room),
              2
            ) AS average_price
          FROM bookings
        `);

        return res.json({
          message: section(
            "💰 Room Price",
            bullet(
              "Average room price",
              formatCurrency(
                rows[0]?.average_price
              )
            )
          ),
        });
      }

      /* -----------------------------------------------------
         AVERAGE STAY
      ----------------------------------------------------- */

      if (
        hasAny(q, [
          "average stay",
          "average number of nights",
          "average nights",
          "average stay duration",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            ROUND(
              AVG(
                DATEDIFF(
                  check_out_date,
                  check_in_date
                )
              ),
              2
            ) AS average_stay
          FROM bookings
        `);

        return res.json({
          message: section(
            "🌙 Average Stay",
            bullet(
              "Average stay",
              `${rows[0]?.average_stay || 0} nights`
            )
          ),
        });
      }

      /* =====================================================
         ROOM TYPES FROM BOOKINGS
      ===================================================== */

      if (
        hasAny(q, [
          "most booked room",
          "popular room",
          "most popular room",
          "most booked room type",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            room_type_reserved,
            COUNT(*) AS total
          FROM bookings
          WHERE room_type_reserved IS NOT NULL
          AND room_type_reserved != ''
          GROUP BY room_type_reserved
          ORDER BY total DESC
          LIMIT 1
        `);

        if (rows.length === 0) {
          return res.json({
            message:
              "🏨 No room booking data is available.",
          });
        }

        return res.json({
          message: section(
            "🏨 Most Booked Room",
            [
              bullet(
                "Room type",
                rows[0].room_type_reserved
              ),
              bullet(
                "Bookings",
                formatNumber(rows[0].total)
              ),
            ].join("\n")
          ),
        });
      }

      if (
        hasAny(q, [
          "booking by room",
          "room type booking",
          "bookings by room",
          "room wise booking",
          "room-wise booking",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            room_type_reserved,
            COUNT(*) AS total
          FROM bookings
          WHERE room_type_reserved IS NOT NULL
          AND room_type_reserved != ''
          GROUP BY room_type_reserved
          ORDER BY total DESC
        `);

        return res.json({
          message: section(
            "🏨 Bookings by Room Type",
            numberedList(rows, (row) => {
              return [
                `🏨 ${row.room_type_reserved}`,
                bullet(
                  "Bookings",
                  formatNumber(row.total)
                ),
              ].join("\n");
            })
          ),
        });
      }

      /* =====================================================
         MEAL
      ===================================================== */

      if (
        q.includes("meal") &&
        hasAny(q, [
          "most",
          "popular",
          "booking",
          "breakdown",
          "distribution",
          "count",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            meal,
            COUNT(*) AS total
          FROM bookings
          WHERE meal IS NOT NULL
          AND meal != ''
          GROUP BY meal
          ORDER BY total DESC
        `);

        return res.json({
          message: section(
            "🍽️ Meal Information",
            numberedList(rows, (row) => {
              return [
                `🍽️ ${row.meal}`,
                bullet(
                  "Bookings",
                  formatNumber(row.total)
                ),
              ].join("\n");
            })
          ),
        });
      }

      /* =====================================================
         MARKET SEGMENT
      ===================================================== */

      if (
        hasAny(q, [
          "market segment",
          "bookings by market",
          "market wise booking",
          "market segment breakdown",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            market_segment,
            COUNT(*) AS total
          FROM bookings
          WHERE market_segment IS NOT NULL
          AND market_segment != ''
          GROUP BY market_segment
          ORDER BY total DESC
        `);

        return res.json({
          message: section(
            "📊 Market Segment",
            numberedList(rows, (row) => {
              return [
                `📊 ${row.market_segment}`,
                bullet(
                  "Bookings",
                  formatNumber(row.total)
                ),
              ].join("\n");
            })
          ),
        });
      }

      /* =====================================================
         DISTRIBUTION CHANNEL
      ===================================================== */

      if (
        hasAny(q, [
          "distribution channel",
          "booking channel",
          "distribution channels",
          "channel breakdown",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            distribution_channel,
            COUNT(*) AS total
          FROM bookings
          WHERE distribution_channel IS NOT NULL
          AND distribution_channel != ''
          GROUP BY distribution_channel
          ORDER BY total DESC
        `);

        return res.json({
          message: section(
            "📡 Distribution Channel",
            numberedList(rows, (row) => {
              return [
                `📡 ${row.distribution_channel}`,
                bullet(
                  "Bookings",
                  formatNumber(row.total)
                ),
              ].join("\n");
            })
          ),
        });
      }

      /* =====================================================
         REPEAT GUESTS
      ===================================================== */

      if (
        hasAny(q, [
          "repeat guest",
          "repeated guest",
          "repeat customers",
          "repeated customers",
          "returning customers",
          "returning guests",
        ])
      ) {
        const rows: any = await query(`
          SELECT COUNT(DISTINCT email) AS total
          FROM bookings
          WHERE repeated_guest = 1
        `);

        return res.json({
          message: section(
            "🔁 Repeat Guests",
            bullet(
              "Repeat guests",
              formatNumber(rows[0]?.total)
            )
          ),
        });
      }

      /* =====================================================
         PARKING
      ===================================================== */

      if (
        hasAny(q, [
          "parking",
          "car parking",
          "parking space",
          "parking required",
        ])
      ) {
        const rows: any = await query(`
          SELECT COUNT(*) AS total
          FROM bookings
          WHERE car_parking_space > 0
        `);

        return res.json({
          message: section(
            "🚗 Parking",
            bullet(
              "Bookings requiring parking",
              formatNumber(rows[0]?.total)
            )
          ),
        });
      }

      /* =====================================================
         SPECIAL REQUESTS
      ===================================================== */

      if (
        hasAny(q, [
          "special request",
          "special requests",
          "guest request",
          "guest requests",
        ])
      ) {
        const rows: any = await query(`
          SELECT COUNT(*) AS total
          FROM bookings
          WHERE special_requests IS NOT NULL
          AND TRIM(special_requests) != ''
        `);

        return res.json({
          message: section(
            "📝 Special Requests",
            bullet(
              "Bookings with special requests",
              formatNumber(rows[0]?.total)
            )
          ),
        });
      }

      /* =====================================================
         CUSTOMER SEGMENTATION
      ===================================================== */

      if (
        hasAny(q, [
          "customer segmentation",
          "customer segments",
          "customer segment",
          "segmentation",
          "budget customers",
          "regular customers",
          "premium customers",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            customer_segment,
            COUNT(DISTINCT email) AS total_customers
          FROM bookings
          WHERE customer_segment IS NOT NULL
          GROUP BY customer_segment
          ORDER BY customer_segment
        `);

        if (rows.length === 0) {
          return res.json({
            message:
              "🧠 No customer segmentation data is available.",
          });
        }

        return res.json({
          message: section(
            "🧠 Customer Segmentation",
            numberedList(rows, (row) => {
              return [
                `👤 ${getSegmentName(
                  row.customer_segment
                )}`,
                bullet(
                  "Customers",
                  formatNumber(
                    row.total_customers
                  )
                ),
              ].join("\n");
            })
          ),
        });
      }

      /* -----------------------------------------------------
         SPECIFIC SEGMENT
      ----------------------------------------------------- */

      const segmentMatch = q.match(
        /\bsegment\s*([012])\b/
      );

      if (
        segmentMatch &&
        hasAny(q, [
          "customer",
          "customers",
          "guest",
          "guests",
          "people",
        ])
      ) {
        const segment = Number(segmentMatch[1]);

        const rows: any = await query(
          `
          SELECT DISTINCT
            full_name,
            email,
            phone
          FROM bookings
          WHERE customer_segment = ?
          ORDER BY full_name
          `,
          [segment]
        );

        if (rows.length === 0) {
          return res.json({
            message: section(
              "🧠 Customer Segment",
              bullet(
                "Customers",
                `No customers found in ${getSegmentName(
                  segment
                )}`
              )
            ),
          });
        }

        return res.json({
          message: section(
            `🧠 ${getSegmentName(segment)} Customers`,
            numberedList(rows, (row) => {
              return [
                `👤 ${row.full_name || "Unknown customer"}`,
                bullet("Email", row.email),
                bullet("Phone", row.phone),
              ].join("\n");
            })
          ),
        });
      }

      /* =====================================================
         HOUSEKEEPING
      ===================================================== */

      const housekeepingTopic = hasAny(q, [
        "housekeeping",
        "cleaning",
        "cleaner",
        "cleaning staff",
        "housekeeping staff",
        "room cleaning",
        "cleaning task",
        "cleaning tasks",
      ]);

      /* -----------------------------------------------------
         ROOM NUMBER QUERY
      ----------------------------------------------------- */

      const roomNumber = extractRoomNumber(q);

      if (roomNumber) {
        const rows: any = await query(
          `
          SELECT
            org_id,
            org_name,
            task_code,
            room,
            floor,
            room_type,
            staff,
            staff_email,
            status,
            priority,
            task,
            last_cleaned,
            progress,
            assigned_time,
            notes,
            photo_uploaded_at,
            approval_status,
            approved_by,
            rejected_reason,
            status_action_at,
            status_action_by
          FROM housekeeping_tasks
          WHERE room = ?
          ORDER BY org_name
          `,
          [`Room ${roomNumber}`]
        );

        if (rows.length === 0) {
          const allRooms: any = await query(`
            SELECT
              org_name,
              room,
              floor,
              room_type,
              staff,
              status,
              priority,
              progress,
              task
            FROM housekeeping_tasks
            ORDER BY org_name, room
          `);

          if (allRooms.length === 0) {
            return res.json({
              message:
                "🧹 No housekeeping room information is available.",
            });
          }

          return res.json({
            message: section(
              `🧹 Room ${roomNumber} Not Found`,
              [
                "The requested room is not available in the housekeeping records.",
                "",
                "Available room information:",
                "",
                numberedList(allRooms, (row) => {
                  return [
                    `🏨 ${row.room} — ${row.org_name}`,
                    bullet("Floor", row.floor),
                    bullet(
                      "Room type",
                      row.room_type
                    ),
                    bullet("Staff", row.staff),
                    bullet("Status", row.status),
                    bullet(
                      "Priority",
                      row.priority
                    ),
                    bullet(
                      "Progress",
                      `${row.progress}%`
                    ),
                    bullet("Task", row.task),
                  ].join("\n");
                }),
              ].join("\n")
            ),
          });
        }

        return res.json({
          message: section(
            `🏨 Room ${roomNumber} Information`,
            numberedList(rows, (row) => {
              return [
                `🏨 ${row.org_name} — ${row.room}`,
                bullet("Organization ID", row.org_id),
                bullet(
                  "Task code",
                  row.task_code
                ),
                bullet("Floor", row.floor),
                bullet(
                  "Room type",
                  row.room_type
                ),
                bullet("Staff", row.staff),
                bullet(
                  "Staff email",
                  row.staff_email
                ),
                bullet("Status", row.status),
                bullet(
                  "Priority",
                  row.priority
                ),
                bullet("Task", row.task),
                bullet(
                  "Last cleaned",
                  row.last_cleaned
                ),
                bullet(
                  "Progress",
                  `${row.progress}%`
                ),
                bullet(
                  "Assigned time",
                  row.assigned_time
                ),
                bullet("Notes", row.notes),
                bullet(
                  "Photo uploaded",
                  row.photo_uploaded_at
                ),
                bullet(
                  "Approval status",
                  row.approval_status
                ),
                bullet(
                  "Approved by",
                  row.approved_by
                ),
                bullet(
                  "Rejected reason",
                  row.rejected_reason
                ),
                bullet(
                  "Status action time",
                  row.status_action_at
                ),
                bullet(
                  "Status action by",
                  row.status_action_by
                ),
              ].join("\n");
            })
          ),
        });
      }

      /* -----------------------------------------------------
         ROOM OCCUPANCY
      ----------------------------------------------------- */

      if (
        hasAny(q, [
          "occupied room",
          "occupied rooms",
          "empty room",
          "empty rooms",
          "vacant room",
          "vacant rooms",
          "room occupancy",
          "occupancy",
          "which rooms are occupied",
          "which rooms are empty",
        ])
      ) {
        return res.json({
          message: section(
            "🏨 Room Occupancy",
            [
              "Occupancy information is not stored in the current housekeeping table.",
              "",
              "The available room-related information is based on housekeeping records such as:",
              "",
              "   • Room number",
              "   • Organization",
              "   • Room type",
              "   • Housekeeping staff",
              "   • Cleaning status",
              "   • Cleaning progress",
            ].join("\n")
          ),
        });
      }

      /* -----------------------------------------------------
         ALL ROOMS
      ----------------------------------------------------- */

      if (
        hasAny(q, [
          "all rooms",
          "room list",
          "list rooms",
          "show rooms",
          "room information",
          "room details",
          "rooms information",
          "rooms details",
          "how many rooms",
          "number of rooms",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            org_name,
            room,
            floor,
            room_type,
            staff,
            status,
            priority,
            task,
            progress
          FROM housekeeping_tasks
          ORDER BY org_name, room
        `);

        if (rows.length === 0) {
          return res.json({
            message:
              "🏨 No housekeeping room information is available.",
          });
        }

        return res.json({
          message: section(
            "🏨 Housekeeping Rooms",
            numberedList(rows, (row) => {
              return [
                `🏨 ${row.room} — ${row.org_name}`,
                bullet("Floor", row.floor),
                bullet(
                  "Room type",
                  row.room_type
                ),
                bullet("Staff", row.staff),
                bullet("Status", row.status),
                bullet(
                  "Priority",
                  row.priority
                ),
                bullet("Task", row.task),
                bullet(
                  "Progress",
                  `${row.progress}%`
                ),
              ].join("\n");
            })
          ),
        });
      }

      /* -----------------------------------------------------
         STAFF SPECIFIC QUERY
      ----------------------------------------------------- */

      if (
        hasAny(q, [
          "staff",
          "employee",
          "housekeeper",
          "housekeepers",
          "cleaner",
          "cleaners",
        ])
      ) {
        const staffRows: any = await query(`
          SELECT DISTINCT staff
          FROM housekeeping_tasks
          WHERE staff IS NOT NULL
          AND TRIM(staff) != ''
          ORDER BY staff
        `);

        const matchedStaff = staffRows.find(
          (row: any) =>
            staffNameMatches(
              q,
              String(row.staff)
            )
        );

        if (matchedStaff) {
          const rows: any = await query(
            `
            SELECT
              org_name,
              room,
              floor,
              room_type,
              staff,
              staff_email,
              status,
              priority,
              task,
              last_cleaned,
              progress,
              assigned_time,
              notes,
              approval_status
            FROM housekeeping_tasks
            WHERE staff = ?
            ORDER BY org_name, room
            `,
            [matchedStaff.staff]
          );

          return res.json({
            message: section(
              `🧑‍💼 ${matchedStaff.staff}`,
              numberedList(rows, (row) => {
                return [
                  `🏨 ${row.room} — ${row.org_name}`,
                  bullet("Floor", row.floor),
                  bullet(
                    "Room type",
                    row.room_type
                  ),
                  bullet(
                    "Staff email",
                    row.staff_email
                  ),
                  bullet(
                    "Status",
                    row.status
                  ),
                  bullet(
                    "Priority",
                    row.priority
                  ),
                  bullet("Task", row.task),
                  bullet(
                    "Last cleaned",
                    row.last_cleaned
                  ),
                  bullet(
                    "Progress",
                    `${row.progress}%`
                  ),
                  bullet(
                    "Assigned time",
                    row.assigned_time
                  ),
                  bullet("Notes", row.notes),
                  bullet(
                    "Approval",
                    row.approval_status
                  ),
                ].join("\n");
              })
            ),
          });
        }
      }

      /* -----------------------------------------------------
         TOTAL HOUSEKEEPING STAFF
      ----------------------------------------------------- */

      if (
        hasAny(q, [
          "how many housekeeping staff",
          "total housekeeping staff",
          "housekeeping staff count",
          "number of housekeeping staff",
          "how many housekeepers",
          "total housekeepers",
          "number of housekeepers",
          "how many cleaners",
          "total cleaners",
        ])
      ) {
        const rows: any = await query(`
          SELECT COUNT(DISTINCT staff) AS total
          FROM housekeeping_tasks
          WHERE staff IS NOT NULL
          AND TRIM(staff) != ''
        `);

        return res.json({
          message: section(
            "🧑‍💼 Housekeeping Staff",
            bullet(
              "Total housekeeping staff",
              formatNumber(rows[0]?.total)
            )
          ),
        });
      }

      /* -----------------------------------------------------
         STAFF LIST
      ----------------------------------------------------- */

      if (
        hasAny(q, [
          "list housekeeping staff",
          "housekeeping staff list",
          "show housekeeping staff",
          "all housekeeping staff",
          "staff list",
          "list housekeepers",
          "all housekeepers",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            staff,
            staff_email,
            COUNT(*) AS assigned_tasks
          FROM housekeeping_tasks
          WHERE staff IS NOT NULL
          AND TRIM(staff) != ''
          GROUP BY staff, staff_email
          ORDER BY staff
        `);

        return res.json({
          message: section(
            "🧑‍💼 Housekeeping Staff List",
            numberedList(rows, (row) => {
              return [
                `🧑‍💼 ${row.staff}`,
                bullet(
                  "Email",
                  row.staff_email
                ),
                bullet(
                  "Assigned tasks",
                  formatNumber(row.assigned_tasks)
                ),
              ].join("\n");
            })
          ),
        });
      }

      /* -----------------------------------------------------
         HOUSEKEEPING STATUS
      ----------------------------------------------------- */

      if (
        housekeepingTopic &&
        hasAny(q, [
          "status",
          "statuses",
          "breakdown",
          "distribution",
          "how many",
          "count",
          "total",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            status,
            COUNT(*) AS total
          FROM housekeeping_tasks
          GROUP BY status
          ORDER BY total DESC
        `);

        return res.json({
          message: section(
            "🧹 Housekeeping Status",
            numberedList(rows, (row) => {
              return [
                `🧹 ${row.status}`,
                bullet(
                  "Tasks",
                  formatNumber(row.total)
                ),
              ].join("\n");
            })
          ),
        });
      }

      /* -----------------------------------------------------
         CURRENTLY CLEANING
      ----------------------------------------------------- */

      if (
        hasAny(q, [
          "currently cleaning",
          "rooms being cleaned",
          "rooms cleaning",
          "cleaning now",
          "currently being cleaned",
          "in cleaning",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            org_name,
            room,
            floor,
            room_type,
            staff,
            status,
            priority,
            task,
            progress
          FROM housekeeping_tasks
          WHERE LOWER(status) = 'cleaning'
          ORDER BY org_name, room
        `);

        if (rows.length === 0) {
          return res.json({
            message:
              "🧹 No rooms are currently marked as Cleaning.",
          });
        }

        return res.json({
          message: section(
            "🧹 Currently Cleaning",
            numberedList(rows, (row) => {
              return [
                `🏨 ${row.room} — ${row.org_name}`,
                bullet("Floor", row.floor),
                bullet(
                  "Room type",
                  row.room_type
                ),
                bullet("Staff", row.staff),
                bullet(
                  "Priority",
                  row.priority
                ),
                bullet("Task", row.task),
                bullet(
                  "Progress",
                  `${row.progress}%`
                ),
              ].join("\n");
            })
          ),
        });
      }

      /* -----------------------------------------------------
         COMPLETED / APPROVED
      ----------------------------------------------------- */

      if (
        hasAny(q, [
          "completed cleaning",
          "completed housekeeping",
          "cleaned rooms",
          "cleaned and approved",
          "completed tasks",
          "approved cleaning",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            org_name,
            room,
            room_type,
            staff,
            status,
            task,
            progress,
            approval_status
          FROM housekeeping_tasks
          WHERE LOWER(status) = 'cleaned & approved'
          ORDER BY org_name, room
        `);

        return res.json({
          message: section(
            "✅ Completed Housekeeping",
            numberedList(rows, (row) => {
              return [
                `🏨 ${row.room} — ${row.org_name}`,
                bullet(
                  "Room type",
                  row.room_type
                ),
                bullet("Staff", row.staff),
                bullet("Task", row.task),
                bullet(
                  "Progress",
                  `${row.progress}%`
                ),
                bullet(
                  "Approval",
                  row.approval_status
                ),
              ].join("\n");
            })
          ),
        });
      }

      /* -----------------------------------------------------
         PHOTO UPLOADED / PENDING APPROVAL
      ----------------------------------------------------- */

      if (
        hasAny(q, [
          "photo uploaded",
          "photos uploaded",
          "pending approval",
          "photo proof",
          "proof uploaded",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            org_name,
            room,
            room_type,
            staff,
            status,
            task,
            progress,
            photo_uploaded_at,
            approval_status
          FROM housekeeping_tasks
          WHERE
            LOWER(status) = 'photo uploaded'
            OR LOWER(approval_status) LIKE '%pending%'
          ORDER BY org_name, room
        `);

        return res.json({
          message: section(
            "📷 Housekeeping Photo / Approval",
            numberedList(rows, (row) => {
              return [
                `🏨 ${row.room} — ${row.org_name}`,
                bullet(
                  "Room type",
                  row.room_type
                ),
                bullet("Staff", row.staff),
                bullet("Status", row.status),
                bullet("Task", row.task),
                bullet(
                  "Progress",
                  `${row.progress}%`
                ),
                bullet(
                  "Photo uploaded",
                  row.photo_uploaded_at
                ),
                bullet(
                  "Approval",
                  row.approval_status
                ),
              ].join("\n");
            })
          ),
        });
      }

      /* -----------------------------------------------------
         RESCHEDULED / REJECTED
      ----------------------------------------------------- */

      if (
        hasAny(q, [
          "rescheduled",
          "rejected cleaning",
          "rejected housekeeping",
          "re-cleaning",
          "recleaning",
          "re cleaning",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            org_name,
            room,
            room_type,
            staff,
            status,
            priority,
            task,
            progress,
            notes,
            rejected_reason
          FROM housekeeping_tasks
          WHERE
            LOWER(status) = 'rescheduled'
            OR rejected_reason IS NOT NULL
            OR LOWER(approval_status) LIKE '%reject%'
          ORDER BY org_name, room
        `);

        return res.json({
          message: section(
            "🔄 Rescheduled / Rejected Housekeeping",
            numberedList(rows, (row) => {
              return [
                `🏨 ${row.room} — ${row.org_name}`,
                bullet(
                  "Room type",
                  row.room_type
                ),
                bullet("Staff", row.staff),
                bullet("Status", row.status),
                bullet(
                  "Priority",
                  row.priority
                ),
                bullet("Task", row.task),
                bullet(
                  "Progress",
                  `${row.progress}%`
                ),
                bullet("Notes", row.notes),
                bullet(
                  "Rejected reason",
                  row.rejected_reason
                ),
              ].join("\n");
            })
          ),
        });
      }

      /* -----------------------------------------------------
         HOUSEKEEPING PRIORITY
      ----------------------------------------------------- */

      if (
        housekeepingTopic &&
        hasAny(q, [
          "priority",
          "urgent",
          "vip",
          "normal",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            org_name,
            room,
            staff,
            priority,
            status,
            task,
            progress
          FROM housekeeping_tasks
          ORDER BY
            CASE
              WHEN priority = 'Urgent Checkout' THEN 1
              WHEN priority = 'VIP Reserved' THEN 2
              ELSE 3
            END,
            org_name,
            room
        `);

        return res.json({
          message: section(
            "⚡ Housekeeping Priorities",
            numberedList(rows, (row) => {
              return [
                `🏨 ${row.room} — ${row.org_name}`,
                bullet(
                  "Priority",
                  row.priority
                ),
                bullet("Staff", row.staff),
                bullet("Status", row.status),
                bullet("Task", row.task),
                bullet(
                  "Progress",
                  `${row.progress}%`
                ),
              ].join("\n");
            })
          ),
        });
      }

      /* -----------------------------------------------------
         HOUSEKEEPING FULL INFORMATION
      ----------------------------------------------------- */

      if (
        housekeepingTopic ||
        hasAny(q, [
          "housekeeping information",
          "housekeeping details",
          "cleaning information",
          "cleaning details",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            org_name,
            room,
            floor,
            room_type,
            staff,
            staff_email,
            status,
            priority,
            task,
            last_cleaned,
            progress,
            assigned_time,
            notes,
            photo_uploaded_at,
            approval_status
          FROM housekeeping_tasks
          ORDER BY org_name, room
        `);

        if (rows.length === 0) {
          return res.json({
            message:
              "🧹 No housekeeping information is available.",
          });
        }

        return res.json({
          message: section(
            "🧹 Housekeeping Information",
            numberedList(rows, (row) => {
              return [
                `🏨 ${row.room} — ${row.org_name}`,
                bullet("Floor", row.floor),
                bullet(
                  "Room type",
                  row.room_type
                ),
                bullet("Staff", row.staff),
                bullet(
                  "Staff email",
                  row.staff_email
                ),
                bullet("Status", row.status),
                bullet(
                  "Priority",
                  row.priority
                ),
                bullet("Task", row.task),
                bullet(
                  "Last cleaned",
                  row.last_cleaned
                ),
                bullet(
                  "Progress",
                  `${row.progress}%`
                ),
                bullet(
                  "Assigned time",
                  row.assigned_time
                ),
                bullet("Notes", row.notes),
                bullet(
                  "Photo uploaded",
                  row.photo_uploaded_at
                ),
                bullet(
                  "Approval",
                  row.approval_status
                ),
              ].join("\n");
            })
          ),
        });
      }

      /* =====================================================
         INVENTORY
      ===================================================== */

      const inventoryTopic = hasAny(q, [
        "inventory",
        "inventories",
        "stock",
        "stocks",
        "item",
        "items",
        "supplies",
        "supply",
        "supplier",
        "restock",
        "restocked",
        "reorder",
      ]);

      /* -----------------------------------------------------
         LOW STOCK
         IMPORTANT: THIS MUST COME BEFORE TOTAL INVENTORY
      ----------------------------------------------------- */

      if (
        hasAny(q, [
          "low stock",
          "low in stock",
          "low inventory",
          "running low",
          "below reorder",
          "below reorder level",
          "reorder",
          "need restock",
          "needs restock",
          "restock needed",
          "insufficient stock",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            org_name,
            sku,
            name,
            category,
            in_stock,
            reorder_at,
            unit_price,
            status,
            supplier,
            last_restocked
          FROM inventory_items
          WHERE
            LOWER(COALESCE(status, '')) LIKE '%low%'
            OR in_stock <= reorder_at
          ORDER BY
            (in_stock - reorder_at) ASC,
            org_name,
            name
        `);

        if (rows.length === 0) {
          const allItems: any = await query(`
            SELECT
              org_name,
              name,
              category,
              in_stock,
              reorder_at,
              status
            FROM inventory_items
            ORDER BY org_name, name
          `);

          return res.json({
            message: section(
              "📦 Low Stock",
              [
                "No items are currently below their reorder level.",
                "",
                "Current inventory:",
                "",
                numberedList(
                  allItems,
                  (row) => {
                    return [
                      `📦 ${row.name}`,
                      bullet(
                        "Organization",
                        row.org_name
                      ),
                      bullet(
                        "Category",
                        row.category
                      ),
                      bullet(
                        "Stock",
                        formatNumber(row.in_stock)
                      ),
                      bullet(
                        "Reorder level",
                        formatNumber(
                          row.reorder_at
                        )
                      ),
                      bullet(
                        "Status",
                        row.status
                      ),
                    ].join("\n");
                  }
                ),
              ].join("\n")
            ),
          });
        }

        return res.json({
          message: section(
            "⚠️ Low Stock Items",
            numberedList(rows, (row) => {
              return [
                `📦 ${row.name}`,
                bullet(
                  "Organization",
                  row.org_name
                ),
                bullet("SKU", row.sku),
                bullet(
                  "Category",
                  row.category
                ),
                bullet(
                  "Current stock",
                  formatNumber(row.in_stock)
                ),
                bullet(
                  "Reorder level",
                  formatNumber(row.reorder_at)
                ),
                bullet("Status", row.status),
                bullet(
                  "Supplier",
                  row.supplier
                ),
                bullet(
                  "Last restocked",
                  formatDate(row.last_restocked)
                ),
              ].join("\n");
            })
          ),
        });
      }

      /* -----------------------------------------------------
         OUT OF STOCK
      ----------------------------------------------------- */

      if (
        hasAny(q, [
          "out of stock",
          "out-of-stock",
          "zero stock",
          "no stock",
          "empty stock",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            org_name,
            sku,
            name,
            category,
            in_stock,
            reorder_at,
            status,
            supplier
          FROM inventory_items
          WHERE in_stock <= 0
          ORDER BY org_name, name
        `);

        if (rows.length === 0) {
          return res.json({
            message: section(
              "📦 Out of Stock",
              bullet(
                "Items",
                "No items are currently out of stock."
              )
            ),
          });
        }

        return res.json({
          message: section(
            "🚨 Out of Stock Items",
            numberedList(rows, (row) => {
              return [
                `📦 ${row.name}`,
                bullet(
                  "Organization",
                  row.org_name
                ),
                bullet("SKU", row.sku),
                bullet(
                  "Category",
                  row.category
                ),
                bullet(
                  "Current stock",
                  formatNumber(row.in_stock)
                ),
                bullet(
                  "Reorder level",
                  formatNumber(row.reorder_at)
                ),
                bullet("Status", row.status),
                bullet(
                  "Supplier",
                  row.supplier
                ),
              ].join("\n");
            })
          ),
        });
      }

      /* -----------------------------------------------------
         TOTAL INVENTORY ITEMS
      ----------------------------------------------------- */

      if (
        inventoryTopic &&
        asksHowMany &&
        !hasAny(q, [
          "low",
          "out",
          "reorder",
          "stock level",
        ])
      ) {
        const rows: any = await query(`
          SELECT COUNT(*) AS total
          FROM inventory_items
        `);

        return res.json({
          message: section(
            "📦 Inventory",
            bullet(
              "Total inventory items",
              formatNumber(rows[0]?.total)
            )
          ),
        });
      }

      /* -----------------------------------------------------
         TOTAL STOCK UNITS
      ----------------------------------------------------- */

      if (
        hasAny(q, [
          "total stock",
          "total stock units",
          "how many units in stock",
          "total inventory units",
          "stock quantity",
          "total quantity",
        ])
      ) {
        const rows: any = await query(`
          SELECT COALESCE(SUM(in_stock), 0) AS total
          FROM inventory_items
        `);

        return res.json({
          message: section(
            "📦 Stock Quantity",
            bullet(
              "Total stock units",
              formatNumber(rows[0]?.total)
            )
          ),
        });
      }

      /* -----------------------------------------------------
         INVENTORY VALUE
      ----------------------------------------------------- */

      if (
        hasAny(q, [
          "inventory value",
          "stock value",
          "total inventory worth",
          "worth of inventory",
          "value of inventory",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            COALESCE(
              SUM(in_stock * unit_price),
              0
            ) AS total_value
          FROM inventory_items
        `);

        return res.json({
          message: section(
            "💰 Inventory Value",
            bullet(
              "Total inventory value",
              formatCurrency(
                rows[0]?.total_value
              )
            )
          ),
        });
      }

      /* -----------------------------------------------------
         INVENTORY BY CATEGORY
      ----------------------------------------------------- */

      if (
        hasAny(q, [
          "inventory by category",
          "stock by category",
          "items by category",
          "category wise inventory",
          "category-wise inventory",
          "inventory categories",
          "stock categories",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            category,
            COUNT(*) AS items,
            COALESCE(SUM(in_stock), 0) AS units
          FROM inventory_items
          GROUP BY category
          ORDER BY category
        `);

        return res.json({
          message: section(
            "📦 Inventory by Category",
            numberedList(rows, (row) => {
              return [
                `📦 ${row.category}`,
                bullet(
                  "Items",
                  formatNumber(row.items)
                ),
                bullet(
                  "Stock units",
                  formatNumber(row.units)
                ),
              ].join("\n");
            })
          ),
        });
      }

      /* -----------------------------------------------------
         SUPPLIER
      ----------------------------------------------------- */

      if (
        hasAny(q, [
          "supplier",
          "suppliers",
          "vendor",
          "vendors",
          "who supplies",
          "supplied by",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            name,
            sku,
            org_name,
            supplier,
            category,
            in_stock,
            last_restocked
          FROM inventory_items
          ORDER BY supplier, name
        `);

        return res.json({
          message: section(
            "🚚 Inventory Suppliers",
            numberedList(rows, (row) => {
              return [
                `📦 ${row.name}`,
                bullet(
                  "Organization",
                  row.org_name
                ),
                bullet("SKU", row.sku),
                bullet(
                  "Category",
                  row.category
                ),
                bullet(
                  "Supplier",
                  row.supplier
                ),
                bullet(
                  "Current stock",
                  formatNumber(row.in_stock)
                ),
                bullet(
                  "Last restocked",
                  formatDate(
                    row.last_restocked
                  )
                ),
              ].join("\n");
            })
          ),
        });
      }

      /* -----------------------------------------------------
         LAST RESTOCKED
      ----------------------------------------------------- */

      if (
        hasAny(q, [
          "last restocked",
          "recently restocked",
          "recent restock",
          "restock history",
          "when was it restocked",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            name,
            sku,
            org_name,
            category,
            in_stock,
            supplier,
            last_restocked
          FROM inventory_items
          ORDER BY last_restocked DESC
        `);

        return res.json({
          message: section(
            "📦 Restock Information",
            numberedList(rows, (row) => {
              return [
                `📦 ${row.name}`,
                bullet(
                  "Organization",
                  row.org_name
                ),
                bullet("SKU", row.sku),
                bullet(
                  "Category",
                  row.category
                ),
                bullet(
                  "Current stock",
                  formatNumber(row.in_stock)
                ),
                bullet(
                  "Supplier",
                  row.supplier
                ),
                bullet(
                  "Last restocked",
                  formatDate(
                    row.last_restocked
                  )
                ),
              ].join("\n");
            })
          ),
        });
      }

      /* -----------------------------------------------------
         SPECIFIC INVENTORY ITEM
      ----------------------------------------------------- */

      if (inventoryTopic) {
        const rows: any = await query(`
          SELECT
            id,
            org_id,
            org_name,
            sku,
            name,
            category,
            in_stock,
            reorder_at,
            unit_price,
            status,
            supplier,
            last_restocked,
            description
          FROM inventory_items
          ORDER BY org_name, name
        `);

        const matched = rows.filter(
          (row: any) => {
            const name = normalize(
              row.name || ""
            );

            const sku = normalize(
              row.sku || ""
            );

            const category = normalize(
              row.category || ""
            );

            const supplier = normalize(
              row.supplier || ""
            );

            const org = normalize(
              row.org_name || ""
            );

            return (
              (name &&
                q.includes(name)) ||
              (sku &&
                q.includes(sku)) ||
              (category &&
                q.includes(category) &&
                hasAny(q, [
                  "category",
                  "items",
                  "inventory",
                  "stock",
                ])) ||
              (supplier &&
                q.includes(supplier)) ||
              (org &&
                q.includes(org))
            );
          }
        );

        if (matched.length > 0) {
          return res.json({
            message: section(
              "📦 Inventory Information",
              numberedList(
                matched,
                (row) => {
                  return [
                    `📦 ${row.name}`,
                    bullet(
                      "Organization",
                      row.org_name
                    ),
                    bullet(
                      "Organization ID",
                      row.org_id
                    ),
                    bullet("SKU", row.sku),
                    bullet(
                      "Category",
                      row.category
                    ),
                    bullet(
                      "Current stock",
                      formatNumber(
                        row.in_stock
                      )
                    ),
                    bullet(
                      "Reorder level",
                      formatNumber(
                        row.reorder_at
                      )
                    ),
                    bullet(
                      "Unit price",
                      formatCurrency(
                        row.unit_price
                      )
                    ),
                    bullet(
                      "Status",
                      row.status
                    ),
                    bullet(
                      "Supplier",
                      row.supplier
                    ),
                    bullet(
                      "Last restocked",
                      formatDate(
                        row.last_restocked
                      )
                    ),
                    bullet(
                      "Description",
                      row.description
                    ),
                  ].join("\n");
                }
              )
            ),
          });
        }

        /* ---------------------------------------------------
           INVENTORY FALLBACK
           If exact item isn't found, return all related data.
        --------------------------------------------------- */

        return res.json({
          message: section(
            "📦 Inventory Information",
            [
              "The exact inventory item was not found.",
              "",
              "Here is the available inventory information:",
              "",
              numberedList(rows, (row) => {
                return [
                  `📦 ${row.name}`,
                  bullet(
                    "Organization",
                    row.org_name
                  ),
                  bullet("SKU", row.sku),
                  bullet(
                    "Category",
                    row.category
                  ),
                  bullet(
                    "Current stock",
                    formatNumber(
                      row.in_stock
                    )
                  ),
                  bullet(
                    "Reorder level",
                    formatNumber(
                      row.reorder_at
                    )
                  ),
                  bullet(
                    "Unit price",
                    formatCurrency(
                      row.unit_price
                    )
                  ),
                  bullet(
                    "Status",
                    row.status
                  ),
                  bullet(
                    "Supplier",
                    row.supplier
                  ),
                  bullet(
                    "Last restocked",
                    formatDate(
                      row.last_restocked
                    )
                  ),
                ].join("\n");
              }),
            ].join("\n")
          ),
        });
      }

      /* =====================================================
         CUSTOMER FALLBACK
      ===================================================== */

      if (
        asksCustomer ||
        hasAny(q, [
          "adult",
          "adults",
          "child",
          "children",
          "baby",
          "babies",
          "infant",
          "infants",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            full_name,
            email,
            phone,
            COUNT(*) AS bookings,
            COALESCE(SUM(adults), 0) AS adults,
            COALESCE(SUM(children), 0) AS children,
            COALESCE(SUM(babies), 0) AS babies
          FROM bookings
          GROUP BY full_name, email, phone
          ORDER BY full_name
        `);

        if (rows.length === 0) {
          return res.json({
            message:
              "👤 No customer information is available.",
          });
        }

        return res.json({
          message: section(
            "👤 Customer Information",
            [
              "The exact customer information requested was not found.",
              "",
              "Available customer records:",
              "",
              numberedList(rows, (row) => {
                return [
                  `👤 ${row.full_name}`,
                  bullet("Email", row.email),
                  bullet("Phone", row.phone),
                  bullet(
                    "Bookings",
                    formatNumber(row.bookings)
                  ),
                  bullet(
                    "Adults",
                    formatNumber(row.adults)
                  ),
                  bullet(
                    "Children",
                    formatNumber(row.children)
                  ),
                  bullet(
                    "Babies",
                    formatNumber(row.babies)
                  ),
                ].join("\n");
              }),
            ].join("\n")
          ),
        });
      }

      /* =====================================================
         HOUSEKEEPING FALLBACK
      ===================================================== */

      if (
        housekeepingTopic ||
        hasAny(q, [
          "room",
          "rooms",
          "clean",
          "cleaning",
          "housekeeper",
          "staff",
        ])
      ) {
        const rows: any = await query(`
          SELECT
            org_name,
            room,
            floor,
            room_type,
            staff,
            status,
            priority,
            task,
            progress
          FROM housekeeping_tasks
          ORDER BY org_name, room
        `);

        if (rows.length === 0) {
          return res.json({
            message:
              "🧹 No housekeeping information is available.",
          });
        }

        return res.json({
          message: section(
            "🧹 Housekeeping Information",
            [
              "The exact housekeeping information requested was not found.",
              "",
              "Available housekeeping records:",
              "",
              numberedList(rows, (row) => {
                return [
                  `🏨 ${row.room} — ${row.org_name}`,
                  bullet("Floor", row.floor),
                  bullet(
                    "Room type",
                    row.room_type
                  ),
                  bullet("Staff", row.staff),
                  bullet("Status", row.status),
                  bullet(
                    "Priority",
                    row.priority
                  ),
                  bullet("Task", row.task),
                  bullet(
                    "Progress",
                    `${row.progress}%`
                  ),
                ].join("\n");
              }),
            ].join("\n")
          ),
        });
      }

      /* =====================================================
         DEFAULT
      ===================================================== */

      return res.json({
        message: [
          "🏨 Hotel Assistant",
          "",
          "I can provide information about:",
          "",
          "   • Customers and guests",
          "   • Adults, children and babies",
          "   • Total guests",
          "   • Customer segmentation",
          "   • Bookings",
          "   • Reviews and sentiment",
          "   • Room information",
          "   • Housekeeping",
          "   • Housekeeping staff",
          "   • Cleaning tasks",
          "   • Inventory and stock",
          "   • Low-stock items",
          "   • Suppliers and restocking",
        ].join("\n"),
      });
    } catch (error) {
      console.error(
        "Chatbot database error:",
        error
      );

      return res.status(500).json({
        message: [
          "⚠️ Unable to retrieve the requested information.",
          "",
          "Please try the question again.",
        ].join("\n"),
      });
    }
  }
);

export default router;