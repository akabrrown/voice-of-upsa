const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const allFiles = [...walk('app'), ...walk('components')];

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Find <Image ... fill ... /> without sizes and add sizes.
  // Regex is tricky, but generally `fill` inside `<Image ... />` can be matched and we add sizes next to it.
  // But we only want to add it if sizes doesn't already exist on that element.
  content = content.replace(/<Image([^>]+)fill(?!.*sizes)([^>]*)>/g, '<Image$1fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"$2>');
  
  // If it didn't catch multiline ones properly, we can try to find all 'fill' and see if 'sizes' is around.
  // Let's do a simpler regex: replace `fill` with `fill sizes="..."` but only if it's an image component.
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}
console.log('Done!');
