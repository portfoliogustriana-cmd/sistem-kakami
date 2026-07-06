const http = require('http');
const https = require('https');
const fs = require('fs');

const files = [
  'src/pages/Dashboard.tsx',
  'src/pages/Order.tsx',
  'src/pages/Keuangan.tsx',
  'src/pages/Penggajian.tsx',
  'src/pages/Spk.tsx',
  'src/pages/Tracking.tsx',
  'src/App.tsx'
];

const baseUrl = 'https://ais-dev-ogac435qbz7jhfyp4cepox-951435493309.asia-east1.run.app/';

files.forEach(file => {
  https.get(baseUrl + file, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`Fetched ${file}, size: ${data.length}`);
      if (data.includes('import ') || data.includes('React')) {
         fs.writeFileSync(file + '.bak', data, 'utf8');
      }
    });
  }).on('error', console.error);
});
