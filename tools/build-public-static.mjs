/**
 * JANTA BOL soft-launch artifact firewall.
 *
 * Only deliberately public static website asset types from the established
 * JANTA_BOL_PHASE_3C_WORKING web folder are copied into Vercel's output.
 * Source backups, SQL migrations, runbooks, CI evidence and repository docs
 * NEVER enter the deployment, even when they exist in the Git checkout.
 *
 * No credentials, database changes, renames or source deletion.
 */
import {
  copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, rmSync, writeFileSync
} from 'node:fs';
import { extname, join, resolve } from 'node:path';

const repoRoot = process.cwd();
const sourceName = 'JANTA_BOL_PHASE_3C_WORKING';
const webSource = resolve(repoRoot, sourceName);
const webOutput = resolve(repoRoot, 'public-launch');
const assetOutput = join(webOutput, sourceName);

const publicAssetTypes = new Set([
  '.html', '.js', '.css', '.png', '.jpg', '.jpeg',
  '.svg', '.webp', '.gif', '.ico', '.woff', '.woff2', '.ttf'
]);
const legacyRootAssets = ['index.html', 'style.css', 'script.js'];
const mustExist = [
  'index.html', 'article.html', 'admin-login.html', 'admin.html',
  'b9-search.html', 'grievance-submit.html', 'advertise-request.html',
  'script.js', 'website-v3.js', 'style.css', 'supabase-config.js',
  'backend-client.js', 'public-c1-projection.js'
];

if (!existsSync(webSource) || !lstatSync(webSource).isDirectory()) {
  throw new Error('Missing expected website directory: ' + sourceName);
}
for (const required of mustExist) {
  const file = join(webSource, required);
  if (!existsSync(file) || !lstatSync(file).isFile()) {
    throw new Error('Required public website file is missing: ' + required);
  }
}

rmSync(webOutput, { recursive: true, force: true });
mkdirSync(assetOutput, { recursive: true });

let copied = 0;
let excluded = 0;
for (const entry of readdirSync(webSource, { withFileTypes: true })) {
  const file = join(webSource, entry.name);
  const suffix = extname(entry.name).toLowerCase();
  // No directories, symlinks, backup archives, SQL, test evidence or documents.
  if (!entry.isFile() || !publicAssetTypes.has(suffix)) {
    excluded++;
    continue;
  }
  if (!lstatSync(file).isFile()) {
    throw new Error('Non-regular file refused: ' + entry.name);
  }
  copyFileSync(file, join(assetOutput, entry.name));
  copied++;
}

// Preserve the three pre-existing legacy root static URLs (and old asset paths).
for (const name of legacyRootAssets) {
  const src = join(repoRoot, name);
  if (!existsSync(src) || !lstatSync(src).isFile()) {
    throw new Error('Missing legacy public asset: ' + name);
  }
  copyFileSync(src, join(webOutput, name));
}

// Root robots.txt makes the live public sitemap discoverable without blocking news.
writeFileSync(join(webOutput, 'robots.txt'),
  'User-agent: *\nAllow: /\nSitemap: https://jantabol.in/sitemap.xml\n',
  'utf8');

// Regression guards: the output must never contain internal project artifacts.
const forbidden = [
  'JANTA-BOL v1 BACKUP.zip', 'vercel.json',
  'START_HERE_JANTA_BOL_MASTER_B0_TO_B8.md',
  sourceName + '/SECURITY-RUNBOOK.md',
  sourceName + '/phase2-migration.sql',
  sourceName + '/TEST-REGISTER.md'
];
for (const name of forbidden) {
  if (existsSync(join(webOutput, name))) {
    throw new Error('SECURITY BUILD FAILED: internal artifact copied: ' + name);
  }
}
if (copied < mustExist.length) {
  throw new Error('Unexpectedly small public website build');
}
console.log('JANTA BOL static output ready: ' + copied +
  ' public website assets; ' + excluded + ' non-public items excluded.');
