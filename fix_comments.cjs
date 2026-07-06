const fs = require('fs');
const files = ['src/pages/Dashboard.tsx', 'src/pages/Order.tsx', 'src/pages/Keuangan.tsx', 'src/pages/Penggajian.tsx', 'src/pages/Spk.tsx', 'src/pages/Tracking.tsx', 'src/App.tsx'];

for (const f of files) {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    const parts = c.split('// ');
    let out = parts[0];
    for (let i = 1; i < parts.length; i++) {
        let p = parts[i];
        // find the first occurrence of a keyword that signifies the end of the comment
        const match = p.match(/(.*?)( (?:const|let|var|if|return|function|set|get|alert|console|e\.|syncData|saveStoredData|handle|setShow|setBulan|setOrders|setTransactions|setOrderItems|import|export|useEffect|useState|Object|Math|filtered|tracking|spk|customer|top|hari|piutang|masuk|keluar|margin|total|<div|<\/div>|\} else|\} return))(.*)/);
        if (match) {
            out += '\n/* ' + match[1] + ' */\n' + match[2] + match[3];
        } else {
            out += '\n/* ' + p + ' */\n';
        }
    }
    fs.writeFileSync(f, out, 'utf8');
  }
}
