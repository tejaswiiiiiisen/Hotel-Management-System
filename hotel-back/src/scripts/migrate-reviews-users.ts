import { db } from "../db.js";

async function migrate() {
  console.log("🔄 Starting migration for users and reviews schema...");

  // 1. Migrate `users` table for password reset tokens
  try {
    const [userCols]: any = await db.query("DESCRIBE users");
    const colNames = userCols.map((c: any) => c.Field);

    if (!colNames.includes("reset_token_hash")) {
      console.log("Adding reset_token_hash to users table...");
      await db.query("ALTER TABLE users ADD COLUMN reset_token_hash VARCHAR(255) NULL");
    }
    if (!colNames.includes("reset_token_expiry")) {
      console.log("Adding reset_token_expiry to users table...");
      await db.query("ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME NULL");
    }
    console.log("✅ Users table reset token columns checked/added.");
  } catch (err) {
    console.error("❌ Error updating users table:", err);
  }

  // 2. Migrate `reviews` table
  try {
    const [tables]: any = await db.query("SHOW TABLES LIKE 'reviews'");
    if (tables.length === 0) {
      console.log("Creating reviews table from scratch...");
      await db.query(`
        CREATE TABLE reviews (
          id INT AUTO_INCREMENT PRIMARY KEY,
          room_id INT NULL,
          user_id INT NULL,
          author_name VARCHAR(255) NULL,
          rating DECIMAL(2,1) NOT NULL DEFAULT 5.0,
          comment TEXT NULL,
          review_id INT NULL,
          review_text TEXT NULL,
          sentiment VARCHAR(20) NOT NULL DEFAULT 'positive',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_room_id (room_id),
          INDEX idx_user_id (user_id)
        )
      `);
    } else {
      const [reviewCols]: any = await db.query("DESCRIBE reviews");
      const colNames = reviewCols.map((c: any) => c.Field);
      console.log("Current reviews columns:", colNames);

      if (!colNames.includes("id")) {
        // If review_id is primary key, we can add id column or rename/handle it
        if (colNames.includes("review_id")) {
          // If review_id is the PK, add id column or alter
          console.log("Adding id column to reviews table...");
          await db.query("ALTER TABLE reviews ADD COLUMN id INT NULL");
          await db.query("UPDATE reviews SET id = review_id WHERE id IS NULL");
        } else {
          await db.query("ALTER TABLE reviews ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY");
        }
      }

      if (!colNames.includes("room_id")) {
        console.log("Adding room_id column to reviews table...");
        await db.query("ALTER TABLE reviews ADD COLUMN room_id INT NULL");
      }
      if (!colNames.includes("user_id")) {
        console.log("Adding user_id column to reviews table...");
        await db.query("ALTER TABLE reviews ADD COLUMN user_id INT NULL");
      }
      if (!colNames.includes("author_name")) {
        console.log("Adding author_name column to reviews table...");
        await db.query("ALTER TABLE reviews ADD COLUMN author_name VARCHAR(255) NULL");
      }
      if (!colNames.includes("rating")) {
        console.log("Adding rating column to reviews table...");
        await db.query("ALTER TABLE reviews ADD COLUMN rating DECIMAL(2,1) NOT NULL DEFAULT 5.0");
      }
      if (!colNames.includes("comment")) {
        console.log("Adding comment column to reviews table...");
        await db.query("ALTER TABLE reviews ADD COLUMN comment TEXT NULL");
      }
      if (!colNames.includes("review_id")) {
        console.log("Adding review_id column to reviews table...");
        await db.query("ALTER TABLE reviews ADD COLUMN review_id INT NULL");
        await db.query("UPDATE reviews SET review_id = id WHERE review_id IS NULL");
      }
      if (!colNames.includes("review_text")) {
        console.log("Adding review_text column to reviews table...");
        await db.query("ALTER TABLE reviews ADD COLUMN review_text TEXT NULL");
      }
      if (!colNames.includes("sentiment")) {
        console.log("Adding sentiment column to reviews table...");
        await db.query("ALTER TABLE reviews ADD COLUMN sentiment VARCHAR(20) NOT NULL DEFAULT 'positive'");
      }
    }
    console.log("✅ Reviews table checked/migrated successfully.");
  } catch (err) {
    console.error("❌ Error migrating reviews table:", err);
  }

  // 3. Seed sample reviews if table is empty
  try {
    const [rows]: any = await db.query("SELECT COUNT(*) as count FROM reviews");
    if (rows[0]?.count === 0) {
      console.log("Seeding sample reviews...");
      await db.query(`
        INSERT INTO reviews (room_id, author_name, rating, comment, review_text, sentiment) VALUES
        (1, 'Ananya Sharma', 5.0, 'Absolutely breathtaking stay! The room view was divine, mattress super comfortable.', 'Absolutely breathtaking stay!', 'positive'),
        (1, 'Vikram Malhotra', 5.0, 'Spotless clean, high speed Wi-Fi for work, delicious room service breakfast.', 'Spotless clean and great service.', 'positive'),
        (2, 'Sophia Miller', 4.5, 'Great room design and amenities. The morning garden view from the balcony was the highlight.', 'Great room design and amenities.', 'positive'),
        (3, 'Rahul Verma', 5.0, 'Luxurious penthouse suite, amazing panoramic views and top notch butler service.', 'Luxurious suite with amazing views.', 'positive')
      `);
      console.log("✅ Sample reviews seeded.");
    }
  } catch (err) {
    console.error("❌ Error seeding reviews:", err);
  }

  await db.end();
  console.log("🎉 Migration complete.");
}

migrate();
