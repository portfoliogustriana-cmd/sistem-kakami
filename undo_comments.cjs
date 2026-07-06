const fs = require('fs');
const files = ['src/pages/Dashboard.tsx', 'src/pages/Order.tsx', 'src/pages/Keuangan.tsx', 'src/pages/Penggajian.tsx', 'src/pages/Spk.tsx', 'src/pages/Tracking.tsx', 'src/App.tsx'];

for (const f of files) {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    c = c.replace(/\n\/\* (.*?) \*\/\n/g, '// $1');
    fs.writeFileSync(f, c, 'utf8');
  }
}
