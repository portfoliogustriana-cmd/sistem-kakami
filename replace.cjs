const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      // Light mode text
      content = content.replace(/text-(slate|gray|zinc|neutral|stone|indigo|blue|emerald|green|rose|red|amber|yellow)-[56789]00/g, 'text-black');
      content = content.replace(/text-(slate|gray|zinc|neutral|stone|indigo|blue|emerald|green|rose|red|amber|yellow)-[1234]00/g, 'text-black');
      
      // Dark mode text
      content = content.replace(/dark:text-(slate|gray|zinc|neutral|stone|indigo|blue|emerald|green|rose|red|amber|yellow)-[1234]00/g, 'dark:text-white');
      content = content.replace(/dark:text-(slate|gray|zinc|neutral|stone|indigo|blue|emerald|green|rose|red|amber|yellow)-[56789]00/g, 'dark:text-white');
      
      // Light mode backgrounds
      content = content.replace(/bg-(slate|gray|zinc|neutral|stone)-[5]0/g, 'bg-white');
      content = content.replace(/bg-(slate|gray|zinc|neutral|stone)-100/g, 'bg-white');
      // For cards/borders we might want a slight distinction or just use border
      content = content.replace(/bg-(indigo|blue|emerald|green|rose|red|amber|yellow)-[56789]00/g, 'bg-black');
      content = content.replace(/bg-(indigo|blue|emerald|green|rose|red|amber|yellow)-[1234]00/g, 'bg-white');
      content = content.replace(/bg-(indigo|blue|emerald|green|rose|red|amber|yellow)-50/g, 'bg-white');
      
      // Background with opacity (like bg-indigo-500/10)
      content = content.replace(/bg-[a-z]+-[0-9]+\/[0-9]+/g, 'bg-white');
      
      // Hover states
      content = content.replace(/hover:bg-[a-z]+-[56789]00/g, 'hover:bg-black');
      content = content.replace(/hover:bg-[a-z]+-[1234]00/g, 'hover:bg-gray-100');
      content = content.replace(/hover:bg-[a-z]+-50/g, 'hover:bg-gray-100');
      
      // Dark mode backgrounds
      content = content.replace(/dark:bg-[a-z]+-[789]00/g, 'dark:bg-black');
      content = content.replace(/dark:bg-[a-z]+-950/g, 'dark:bg-black');
      content = content.replace(/dark:bg-[a-z]+-[0-9]+\/[0-9]+/g, 'dark:bg-black');
      
      content = content.replace(/dark:hover:bg-[a-z]+-[0-9]+\/[0-9]*/g, 'dark:hover:bg-white/10');
      content = content.replace(/dark:hover:bg-[a-z]+-[789]00/g, 'dark:hover:bg-white/10');
      
      // Borders
      content = content.replace(/border-[a-z]+-[123]00/g, 'border-black');
      content = content.replace(/border-[a-z]+-[456789]00/g, 'border-black');
      content = content.replace(/border-[a-z]+-[0-9]+\/[0-9]+/g, 'border-black');
      
      // Dark mode borders
      content = content.replace(/dark:border-[a-z]+-[0-9]+/g, 'dark:border-white');
      content = content.replace(/dark:border-[a-z]+-[0-9]+\/[0-9]+/g, 'dark:border-white');
      
      // Rings/Focus
      content = content.replace(/focus:border-[a-z]+-[0-9]+/g, 'focus:border-black');
      content = content.replace(/dark:focus:border-[a-z]+-[0-9]+/g, 'dark:focus:border-white');
      content = content.replace(/focus:ring-[a-z]+-[0-9]+/g, 'focus:ring-black');
      
      // Gradients (remove them to keep monochrome)
      content = content.replace(/from-[a-z]+-[0-9]+/g, 'from-black');
      content = content.replace(/to-[a-z]+-[0-9]+/g, 'to-black');
      
      // Shadows (remove colored shadows)
      content = content.replace(/shadow-[a-z]+-[0-9]+\/?[0-9]*/g, 'shadow-sm');
      content = content.replace(/dark:shadow-[a-z]+-[0-9]+\/?[0-9]*/g, '');
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}

processDirectory('./src');
