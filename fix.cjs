const fs = require('fs');

let content = fs.readFileSync('src/pages/Order.tsx', 'utf8');
// Prettier is failing because of an "Unterminated template". Let's find it.
// Actually, let's just replace the whole specBlock template literal with a clean one.

const fix = content.replace(/const specBlock = `\*Rincian Variasi Harga:\*[\s\S]*?========================`;/m, 
`const specBlock = \`*Rincian Variasi Harga:*
\${specsLine.join('\\n')}
----------------------------------------
Harga Dasar: Rp \${base.toLocaleString('id-ID')}/pcs
Variasi Tambahan: +Rp \${totalSurcharge.toLocaleString('id-ID')} (Rata-rata: +Rp \${avgSurcharge.toLocaleString('id-ID')}/pcs)
\${nego > 0 ? \`Nego/Diskon: -Rp \${nego.toLocaleString('id-ID')}/pcs\\n\` : ''}Harga Satuan Rata-rata: Rp \${finalUnit.toLocaleString('id-ID')}/pcs
========================\`;`);

fs.writeFileSync('src/pages/Order.tsx', fix, 'utf8');
