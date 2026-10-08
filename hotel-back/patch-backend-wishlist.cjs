
const fs = require("fs");
const path = require("path");
const fullPath = path.join(__dirname, "src/routes/wishlist.ts");
let content = fs.readFileSync(fullPath, "utf8");

content = content.replace(
  `room_id     INT UNSIGNED NOT NULL,`,
  `room_id     INT UNSIGNED NOT NULL,\n        branch_id   VARCHAR(255),`
);

fs.writeFileSync(fullPath, content, "utf8");
console.log("Patched wishlist schema");

