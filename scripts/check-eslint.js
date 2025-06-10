import { existsSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

try {
  const eslintPath = require.resolve('@eslint/js/package.json');
  if (!existsSync(eslintPath)) {
    throw new Error('Not found');
  }
  console.log('@eslint/js detected at', eslintPath);
} catch (err) {
  console.error('Error: @eslint/js is not installed. Please run "npm install" or "bun install".');
  process.exit(1);
}
