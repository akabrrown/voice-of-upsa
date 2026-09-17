const fs = require('fs');
const files = [
  "app/auth/forgot-password/page.tsx",
  "app/auth/update-password/page.tsx",
  "app/auth/register/page.tsx",
  "app/auth/login/page.tsx",
  "components/layout/Footer.tsx",
  "components/layout/Navbar.tsx"
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/src="\/logo\.jpg"[\s\S]*?fill/g, '$& sizes="120px"');
  fs.writeFileSync(file, content);
}
console.log('Fixed sizes!');
