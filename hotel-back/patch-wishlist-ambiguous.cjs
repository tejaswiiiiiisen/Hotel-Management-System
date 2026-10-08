
const fs = require("fs");
const path = require("path");
const fullPath = path.join(__dirname, "src/routes/wishlist.ts");
let content = fs.readFileSync(fullPath, "utf8");

content = content.replace(
  `const rooms = await query(
      \`SELECT \${ROOM_COLUMNS}
         FROM wishlists w
         JOIN rooms r ON r.id = w.room_id`,
  `const aliasedColumns = ROOM_COLUMNS.split(",").map(c => c.trim() ? "r." + c.trim() : "").filter(Boolean).join(", ");
    const rooms = await query(
      \`SELECT \${aliasedColumns}
         FROM wishlists w
         JOIN rooms r ON r.id = w.room_id`
);

fs.writeFileSync(fullPath, content, "utf8");
console.log("Patched wishlist ambiguous columns");

