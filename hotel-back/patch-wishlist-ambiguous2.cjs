
const fs = require("fs");
const path = require("path");
const fullPath = path.join(__dirname, "src/routes/wishlist.ts");
let content = fs.readFileSync(fullPath, "utf8");

content = content.replace(
  /const rooms = await query\(\s*\`SELECT \$\{ROOM_COLUMNS\}\s*FROM wishlists w\s*JOIN rooms r ON r\.id = w\.room_id/,
  `const aliasedColumns = ROOM_COLUMNS.split(",").map(c => c.trim() ? "r." + c.trim() : "").filter(Boolean).join(", ");\n    const rooms = await query(\n      \`SELECT \${aliasedColumns}\n         FROM wishlists w\n         JOIN rooms r ON r.id = w.room_id`
);

fs.writeFileSync(fullPath, content, "utf8");
console.log("Patched wishlist ambiguous columns robustly");

