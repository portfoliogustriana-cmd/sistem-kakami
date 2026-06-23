const fs = require('fs');

function fix(filename) {
    let content = fs.readFileSync(filename, 'utf8');
    // Replace <option value="...">[svg...] Tahap 5 with <option value="...">Tahap 5
    content = content.replace(/(<option[^>]*>)<svg[^>]*>.*?<\/svg>\s*/g, '$1');
    fs.writeFileSync(filename, content);
}

fix('tracking.php');
fix('tracking-1.php');
