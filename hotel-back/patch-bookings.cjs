
const fs = require("fs");
const path = require("path");
const fullPath = path.join(__dirname, "src/routes/bookings.ts");
let content = fs.readFileSync(fullPath, "utf8");

content = content.replace(
  `router.get("/", async (req, res) => {
  try {
    const orgIdParam = (req.query.orgId as string) || (req.query.org_id as string) || (req.headers["x-org-id"] as string);
    const where: string[] = [];
    const params: unknown[] = [];
    if (orgIdParam) {
      where.push("org_id = ?");
      params.push(orgIdParam);
    }
    const whereSql = where.length ? \`WHERE \${where.join(" AND ")}\` : "";
    const bookings = await query<any>(
      \`SELECT \${BOOKING_COLUMNS}
         FROM bookings \${whereSql}
        ORDER BY bookings.id DESC\`,
      params
    );`,
  `router.get("/", async (req, res) => {
  try {
    const orgIdParam = (req.query.orgId as string) || (req.query.org_id as string) || (req.headers["x-org-id"] as string);
    const statusParam = req.query.status as string;
    const roomIdParam = req.query.roomId as string;
    const sourceParam = req.query.source as string;

    const where: string[] = [];
    const params: unknown[] = [];
    if (orgIdParam) {
      where.push("org_id = ?");
      params.push(orgIdParam);
    }
    if (statusParam) {
      where.push("status = ?");
      params.push(statusParam);
    }
    if (roomIdParam) {
      where.push("room_id = ?");
      params.push(roomIdParam);
    }
    if (sourceParam) {
      where.push("source = ?");
      params.push(sourceParam);
    }

    const whereSql = where.length ? \`WHERE \${where.join(" AND ")}\` : "";
    const bookings = await query<any>(
      \`SELECT \${BOOKING_COLUMNS}
         FROM bookings \${whereSql}
        ORDER BY bookings.id DESC\`,
      params
    );`
);

fs.writeFileSync(fullPath, content, "utf8");
console.log("Patched bookings GET API successfully");

