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
      
      // We want to force a strict black and white theme.
      // Light Mode: backgrounds are mostly white, elements/buttons are black, text is black.
      // Dark Mode: backgrounds are mostly black, elements/buttons are white, text is white.

      // First, strip all color classes that we might have missed or messed up.
      // We will match patterns like: text-slate-800, dark:text-emerald-450, bg-indigo-500/10, etc.
      
      const colors = ['slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];

      colors.forEach(color => {
        // Text
        content = content.replace(new RegExp(`dark:text-${color}-[0-9]+(\\/[0-9]+)?`, 'g'), 'dark:text-white');
        content = content.replace(new RegExp(`text-${color}-[0-9]+(\\/[0-9]+)?`, 'g'), 'text-black');
        
        // Background
        content = content.replace(new RegExp(`dark:hover:bg-${color}-[0-9]+(\\/[0-9]+)?`, 'g'), 'dark:hover:bg-white/20');
        content = content.replace(new RegExp(`hover:bg-${color}-[0-9]+(\\/[0-9]+)?`, 'g'), 'hover:bg-black/10');
        
        content = content.replace(new RegExp(`dark:bg-${color}-[0-9]+(\\/[0-9]+)?`, 'g'), 'dark:bg-black');
        content = content.replace(new RegExp(`bg-${color}-[0-9]+(\\/[0-9]+)?`, 'g'), 'bg-white');
        
        // Borders
        content = content.replace(new RegExp(`dark:border-${color}-[0-9]+(\\/[0-9]+)?`, 'g'), 'dark:border-white');
        content = content.replace(new RegExp(`border-${color}-[0-9]+(\\/[0-9]+)?`, 'g'), 'border-black');
        
        // Focus rings
        content = content.replace(new RegExp(`dark:focus:border-${color}-[0-9]+(\\/[0-9]+)?`, 'g'), 'dark:focus:border-white');
        content = content.replace(new RegExp(`focus:border-${color}-[0-9]+(\\/[0-9]+)?`, 'g'), 'focus:border-black');
        content = content.replace(new RegExp(`dark:focus:ring-${color}-[0-9]+(\\/[0-9]+)?`, 'g'), 'dark:focus:ring-white');
        content = content.replace(new RegExp(`focus:ring-${color}-[0-9]+(\\/[0-9]+)?`, 'g'), 'focus:ring-black');
        
        // Shadows
        content = content.replace(new RegExp(`shadow-${color}-[0-9]+(\\/[0-9]+)?`, 'g'), 'shadow-none');
        
        // Gradients
        content = content.replace(new RegExp(`from-${color}-[0-9]+(\\/[0-9]+)?`, 'g'), 'from-black dark:from-black');
        content = content.replace(new RegExp(`to-${color}-[0-9]+(\\/[0-9]+)?`, 'g'), 'to-black dark:to-black');
        content = content.replace(new RegExp(`via-${color}-[0-9]+(\\/[0-9]+)?`, 'g'), 'via-black dark:via-black');
      });

      // Special cases for buttons where bg is dark and text is light
      // In our naive replacement, `bg-indigo-600 text-white` became `bg-white text-white` (invisible!)
      // Let's fix buttons! Buttons usually have `text-white`. We want them to have `bg-black text-white dark:bg-white dark:text-black`.
      content = content.replace(/bg-white\s+text-white/g, 'bg-black text-white dark:bg-white dark:text-black');
      content = content.replace(/bg-black\s+text-white/g, 'bg-black text-white dark:bg-white dark:text-black');
      
      // For any `bg-white text-black` that should be standard:
      // Leave as is, but ensure dark mode is `dark:bg-black dark:text-white`
      content = content.replace(/bg-white\s+text-black/g, 'bg-white text-black dark:bg-black dark:text-white');
      
      // Add missing dark mode borders
      content = content.replace(/border-black(?![\w-]|(\s+dark:border-white))/g, 'border-black dark:border-white');
      
      // Clean up multiple spaces
      content = content.replace(/\s{2,}/g, ' ');

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

processDirectory('./src');
