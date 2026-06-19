const fs = require('fs');
const path = require('path');

const ROOT_DIR = 'd:\\Projects\\Diu MicroJobs\\diu-microjobs';
const IGNORE_DIRS = ['node_modules', '.next', '.git'];

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (IGNORE_DIRS.includes(file)) continue;
      scanDir(fullPath);
    } else if (stat.isFile()) {
      const ext = path.extname(file);
      if (ext === '.css') {
        checkCSS(fullPath);
      }
    }
  }
}

function checkCSS(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const mediaQueries = [];
  const lines = content.split('\n');
  
  lines.forEach((line, idx) => {
    if (line.includes('@media')) {
      mediaQueries.push({ lineNum: idx + 1, text: line.trim() });
    }
  });

  const relativePath = path.relative(ROOT_DIR, filePath);
  console.log(`\nFile: ${relativePath}`);
  console.log(`- Total length: ${lines.length} lines`);
  if (mediaQueries.length > 0) {
    console.log(`- Found ${mediaQueries.length} @media query blocks:`);
    mediaQueries.forEach(mq => {
      console.log(`  L${mq.lineNum}: ${mq.text}`);
    });
  } else {
    console.log(`- ⚠️ NO @media query blocks found (May have responsiveness issues!)`);
  }
}

scanDir(ROOT_DIR);
