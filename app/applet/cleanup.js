const fs = require('fs');
const path = require('path');

function removeDarkClasses(cls) {
  return cls.split(/\s+/).filter(c => !c.startsWith('dark:')).join(' ');
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const p = path.join(dir, file);
    if(fs.statSync(p).isDirectory()) {
      walkDir(p);
    } else if(p.endsWith('.tsx') || p.endsWith('.ts')) {
      let c = fs.readFileSync(p, 'utf8');
      
      // Regex to handle className="..."
      let newC = c.replace(/className="([^"]+)"/g, (match, p1) => {
        return 'className="' + removeDarkClasses(p1) + '"';
      });
      
      // Regex to handle className={`...`}
      newC = newC.replace(/className=\{`([^`]+)`\}/g, (match, p1) => {
        return 'className={`' + removeDarkClasses(p1) + '`}';
      });

      if(c !== newC) {
        fs.writeFileSync(p, newC);
      }
    }
  });
}

walkDir('src');
