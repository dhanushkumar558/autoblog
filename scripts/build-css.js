import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const root = join(import.meta.dirname, '..');
const tmpDir = join(root, 'tmp');

try {
  mkdirSync(tmpDir, { recursive: true });
} catch {
  // directory exists
}

execSync('npx tailwindcss -i ./src/styles.css -o ./tmp/out.css --minify', {
  cwd: root,
  stdio: 'inherit',
});

const css = readFileSync(join(tmpDir, 'out.css'), 'utf-8');
writeFileSync(join(root, 'src', 'constants.ts'), `export const GLOBAL_CSS = ${JSON.stringify(css)};\n`);

console.log('CSS built successfully');
