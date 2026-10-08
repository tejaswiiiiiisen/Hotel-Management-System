
const fs = require("fs");
const path = require("path");
const fullPath = path.join(__dirname, "src/routes/wishlist.ts");
let content = fs.readFileSync(fullPath, "utf8");

content = content.replace(
  `} catch (err) {`,
  `    await query("ALTER TABLE wishlists ADD COLUMN branch_id VARCHAR(255)").catch(e => { /* ignore */ });\n  } catch (err) {`
);

fs.writeFileSync(fullPath, content, "utf8");
console.log("Patched wishlist schema ALTER");

