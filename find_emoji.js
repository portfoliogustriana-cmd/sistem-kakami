const fs = require('fs');
const path = require('path');
const dir = '.';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.php'));
let emojis = new Set();
// regex for emoji
const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let match;
    while ((match = emojiRegex.exec(content)) !== null) {
        emojis.add(match[0]);
    }
});
console.log(Array.from(emojis).join(' '));
