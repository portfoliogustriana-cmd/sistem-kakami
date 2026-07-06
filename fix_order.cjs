const fs = require('fs');
let c = fs.readFileSync('src/pages/Order.tsx', 'utf8');

const missingCode = `\n\${specsLine.join('\\n')}\n- Tambahan Total: Rp \${totalSurcharge.toLocaleString('id-ID')}\n- Charge per Pcs: Rp \${avgSurcharge.toLocaleString('id-ID')}\nHarga Dasar Pokok: Rp \${base.toLocaleString('id-ID')}\nNego/Diskon: -Rp \${nego.toLocaleString('id-ID')}\n========================\`;
      setDetail(cleanDetail ? cleanDetail + '\\n\\n' + specBlock : specBlock);
    } else {
      setDetail(cleanDetail);
    }
  };
`;

c = c.replace('const specBlock = `*Rincian Variasi Harga:*', 'const specBlock = `*Rincian Variasi Harga:*' + missingCode);
fs.writeFileSync('src/pages/Order.tsx', c);
