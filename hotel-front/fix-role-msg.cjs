
const fs = require("fs");
const path = require("path");
const fullPath = path.join(__dirname, "src/pages/RoleManagement.jsx");
let content = fs.readFileSync(fullPath, "utf8");

content = content.replace(
  /setMessage\("Permission Matrix saved successfully!"\);\s*setTimeout\(\(\) => setMessage\(null\), 3000\);/g,
  "showSuccess(\"Permission Matrix saved successfully!\");"
);

content = content.replace(
  /setError\("Some permissions failed to save\. Please try again\."\);/g,
  "showError(\"Some permissions failed to save. Please try again.\");"
);

content = content.replace(
  /setError\("Failed to save permission matrix\."\);/g,
  "showError(\"Failed to save permission matrix.\");"
);

fs.writeFileSync(fullPath, content, "utf8");
console.log("Done");

