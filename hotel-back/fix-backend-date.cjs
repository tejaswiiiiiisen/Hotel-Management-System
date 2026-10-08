
const fs = require("fs");
const path = require("path");
const fullPath = path.join(__dirname, "src/routes/bookings.ts");
let content = fs.readFileSync(fullPath, "utf8");

content = content.replace(
  /const newOut = new Date\(newCheckOutStr\)\.getTime\(\);\s+const \[existingBookings\] = await conn\.query\(/g,
  `const newOut = new Date(newCheckOutStr).getTime();\n\n        if (newOut <= newIn) {\n          await conn.rollback();\n          conn.release();\n          return res.status(400).json({ error: "Check-out date must be after check-in date." });\n        }\n\n        const [existingBookings] = await conn.query(`
);

fs.writeFileSync(fullPath, content, "utf8");
console.log("Done");

