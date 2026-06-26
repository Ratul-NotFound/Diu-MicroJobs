const fs = require('fs');
const content = fs.readFileSync('app/page.module.css', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('uniShowcase') || line.includes('uniMarquee') || line.includes('uniPill')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
