
const fs = require("fs");
const path = require("path");
const fullPath = path.join(__dirname, "src/routes/bookings.ts");
let content = fs.readFileSync(fullPath, "utf8");

// Change router.post("/", async (req, res) => { to router.post("/", requireAuth, async (req: AuthedRequest, res) => {
content = content.replace(
  /router\.post\(\"\/\".+?async\s*\(req,\s*res\)\s*=>\s*\{/,
  `router.post("/", requireAuth, async (req: AuthedRequest, res) => {`
);

// Remove the manual extraction of userId since requireAuth provides req.userId
content = content.replace(
  /\/\/ Try to extract userId[\s\S]+?\} catch \{\}/,
  `const userId = req.userId;`
);

fs.writeFileSync(fullPath, content, "utf8");
console.log("Done");

