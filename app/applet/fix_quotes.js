const fs = require('fs');

const files = ['src/pages/Penggajian.tsx', 'src/pages/Spk.tsx', 'src/pages/Keuangan.tsx', 'src/pages/Tracking.tsx'];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    
    // Look for patterns like: ? 'something something : 'something something`
    // which should be: ? 'something something' : 'something something'`
    // The issue is a missing quote before the colon!
    // But wait, the missing quote might be because they were like:
    // ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-white...'
    // And when I removed the dark classes, maybe I stripped a quote?
    // Let's just find and fix `? '... : '...\``
    
    // Regex: find ? ' (words/spaces) : ' (words/spaces) `
    // and replace with ? ' (words/spaces) ' : ' (words/spaces) `
    const fixed = content.replace(/\? '([^']+) : '([^`]+)`/g, (match, p1, p2) => {
      console.log(`Fixed in ${f}: ${match}`);
      return `? '${p1}' : '${p2}'\``;
    });
    
    if (fixed !== content) {
      fs.writeFileSync(f, fixed);
    }
  }
});
