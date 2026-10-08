import "dotenv/config";
import mysql from "mysql2/promise";

// Single shared MySQL connection pool for local database.
// `decimalNumbers: true` makes mysql2 return DECIMAL columns as JS numbers.
const poolConfig: mysql.PoolOptions = {
  host: process.env.MYSQL_HOST || "127.0.0.1",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "hotel_website",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
};

export const db = mysql.createPool(poolConfig);

// Thin helper: run a parameterised query and return just the rows.
export async function query<T = any>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const [rows] = await db.query(sql, params);
  return rows as T[];
}

// Column list used everywhere a room is read, aliasing snake_case DB columns to
// the camelCase shape the API and React components expect. mysql2 parses JSON
// columns (images / amenities / policies) back into real arrays for us.
export const ROOM_COLUMNS = `
  id,
  room_uid           AS roomUid,
  org_id             AS orgId,
  org_name           AS orgName,
  name,
  slug,
  type,
  room_number        AS roomNumber,
  floor,
  room_view          AS roomView,
  badge,
  is_popular         AS isPopular,
  short_description  AS shortDescription,
  description,
  price_per_night    AS pricePerNight,
  capacity,
  size_sqm           AS sizeSqm,
  beds,
  images,
  amenities,
  policies,
  rating,
  reviews_count      AS reviewsCount,
  available,
  status,
  is_deleted         AS isDeleted,
  created_at         AS createdAt,
  updated_at         AS updatedAt
`;
