const fs = require('fs');
const files = ['src/pages/Dashboard.tsx', 'src/pages/Order.tsx', 'src/pages/Keuangan.tsx', 'src/pages/Penggajian.tsx', 'src/pages/Spk.tsx', 'src/pages/Tracking.tsx', 'src/App.tsx'];

for (const f of files) {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    const parts = c.split('// ');
    let out = parts[0];
    for (let i = 1; i < parts.length; i++) {
        let p = parts[i];
        
        // Find where the code actually starts!
        // We look for common code starters that appear after a space.
        // E.g. " const ", " let ", " if ", " return ", " <div", " }; "
        // It's possible the comment contains " const " (e.g. "we use const here"), but it's rare.
        
        // We'll use a regex that looks for the LAST match of these before the end of the string?
        // No, the FIRST match of a valid code starter.
        const match = p.match(/(.*?)( (?:const |let |var |if |return |export |import React|useEffect\(|useState\(|<div|<span|<h[1-6]|<p|<button|<table|<thead|<tbody|<tr|<td|<th|<\/div|<\/span|};? ?const |};? ?let ))(.*)/);
        
        if (match) {
            // Check if it's a false positive like "import const" (Wait, "import " isn't in our list)
            out += '\n/* ' + match[1] + ' */\n' + match[2] + match[3];
        } else {
            // It might be a comment that didn't have code immediately after on the same flattened line?
            // E.g. the end of the file.
            out += '\n/* ' + p + ' */\n';
        }
    }
    fs.writeFileSync(f + '.fixed', out, 'utf8');
  }
}
