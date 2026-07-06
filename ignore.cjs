const fs = require('fs');

let content = fs.readFileSync('src/pages/Order.tsx', 'utf8');
if (!content.startsWith('// prettier-ignore')) {
  content = '// prettier-ignore\n' + content;
  fs.writeFileSync('src/pages/Order.tsx', content, 'utf8');
}
