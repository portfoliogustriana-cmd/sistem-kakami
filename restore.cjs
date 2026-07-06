const { execSync } = require('child_process');
try {
  execSync('git checkout -- src', { stdio: 'inherit' });
  console.log('Restored src directory');
} catch (e) {
  console.error(e);
}
