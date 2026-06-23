const fs = require('fs');

function fixTracking(filename) {
    let content = fs.readFileSync(filename, 'utf8');
    content = content.replace(/w-3\.5 h-3\.5 inline-block mr-1/g, 'w-[1em] h-[1em] inline-block mb-1');
    fs.writeFileSync(filename, content);
}
fixTracking('tracking.php');
fixTracking('tracking-1.php');
