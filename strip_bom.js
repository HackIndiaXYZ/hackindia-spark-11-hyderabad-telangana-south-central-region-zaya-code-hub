const fs = require('fs');
const filePath = 'app/globals.css';
let content = fs.readFileSync(filePath, 'utf8');

// Strip BOM if present
if (content.charCodeAt(0) === 0xFEFF) {
  console.log("Found BOM, stripping it...");
  content = content.slice(1);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully rewrote app/globals.css without BOM!");
