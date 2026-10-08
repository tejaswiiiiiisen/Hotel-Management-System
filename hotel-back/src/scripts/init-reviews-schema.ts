import { query } from "../db.js";

export async function initReviewsSchema() {
  try {
    // 1. Create reviews table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Ensure all columns exist in case the table was created previously with older schema
    const columns = [
      "ALTER TABLE reviews ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY",
      "ALTER TABLE reviews ADD COLUMN room_id INT NULL",
      "ALTER TABLE reviews ADD COLUMN user_id INT NULL",
      "ALTER TABLE reviews ADD COLUMN author_name VARCHAR(255) NULL",
      "ALTER TABLE reviews ADD COLUMN rating DECIMAL(2,1) NOT NULL DEFAULT 5.0",
      "ALTER TABLE reviews ADD COLUMN comment TEXT NULL",
      "ALTER TABLE reviews ADD COLUMN review_id INT NULL",
      "ALTER TABLE reviews ADD COLUMN review_text TEXT NULL",
      "ALTER TABLE reviews ADD COLUMN sentiment VARCHAR(20) NOT NULL DEFAULT 'positive'",
      "ALTER TABLE reviews ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    ];

    for (const sql of columns) {
      try {
        await query(sql);
      } catch {
        // Ignored if column or primary key already exists
      }
    }

    // 3. Seed default reviews if none exist
    try {
      const rows: any = await query("SELECT COUNT(*) as total FROM reviews");
      if (Number(rows[0]?.total || 0) === 0) {
        await query(`
          INSERT INTO reviews (room_id, author_name, rating, comment, review_text, sentiment) VALUES
          (1, 'Ananya Sharma', 5.0, 'Absolutely breathtaking stay! The room view was divine, mattress super comfortable.', 'Absolutely breathtaking stay!', 'positive'),
          (1, 'Vikram Malhotra', 5.0, 'Spotless clean, high speed Wi-Fi for work, delicious room service breakfast.', 'Spotless clean and great service.', 'positive'),
          (2, 'Sophia Miller', 4.5, 'Great room design and amenities. The morning garden view from the balcony was the highlight.', 'Great room design and amenities.', 'positive'),
          (3, 'Rahul Verma', 5.0, 'Luxurious penthouse suite, amazing panoramic views and top notch butler service.', 'Luxurious suite with amazing views.', 'positive')
        `);
      }
    } catch {}

    console.log("✅ Reviews schema verified & initialized successfully.");
  } catch (error) {
    console.warn("⚠️ Reviews schema warning:", error);
  }
}