const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const pkgPath = path.join(rootDir, 'package.json');
const updaterPath = path.join(rootDir, 'src', 'utils', 'updater.ts');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const ref = process.env.GITHUB_REF || '';
const refName = process.env.GITHUB_REF_NAME || '';
const runNumber = process.env.GITHUB_RUN_NUMBER || '';

let cleanVer = pkg.version;

if (ref.startsWith('refs/tags/') && refName) {
  cleanVer = refName.replace(/^v/i, '');
} else if (runNumber) {
  const parts = pkg.version.split('.');
  const major = parts[0] || '1';
  const minor = parts[1] || '0';
  cleanVer = `${major}.${minor}.${runNumber}`;
}

const relTag = `v${cleanVer}`;

// 1. Update package.json
pkg.version = cleanVer;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

// 2. Update src/utils/updater.ts if it exists
if (fs.existsSync(updaterPath)) {
  let updaterContent = fs.readFileSync(updaterPath, 'utf8');
  updaterContent = updaterContent.replace(
    /export const APP_VERSION = '[^']+';/,
    `export const APP_VERSION = '${cleanVer}';`
  );
  fs.writeFileSync(updaterPath, updaterContent);
}

// 3. Update android/app/build.gradle if it exists
const gradlePath = path.join(rootDir, 'android', 'app', 'build.gradle');
if (fs.existsSync(gradlePath)) {
  let gradleContent = fs.readFileSync(gradlePath, 'utf8');
  gradleContent = gradleContent.replace(
    /versionName "[^"]+"/,
    `versionName "${cleanVer}"`
  );
  fs.writeFileSync(gradlePath, gradleContent);
}

// 4. Export to GitHub Actions step outputs if running in CI
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `tag=${relTag}\nversion=${cleanVer}\n`
  );
}

console.log(`[sync-version] Synchronized version to ${cleanVer} (${relTag})`);
