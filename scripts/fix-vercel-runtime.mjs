// Vercel adapter, lokal Node 24'i tanimadigi icin runtime'i nodejs18.x'e
// dusuruyor. Bu script build sonrasi tum function config'lerini nodejs22.x'e
// guncelleyip Vercel'in modern bir runtime kullanmasini sagliyor.
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const fnDir = path.join(root, '.vercel', 'output', 'functions');
const TARGET = 'nodejs22.x';

if (!fs.existsSync(fnDir)) {
  console.warn('[fix-vercel-runtime] functions dizini bulunamadi, atlaniyor.');
  process.exit(0);
}

let patched = 0;
for (const entry of fs.readdirSync(fnDir, { withFileTypes: true })) {
  if (!entry.isDirectory() || !entry.name.endsWith('.func')) continue;
  const cfgPath = path.join(fnDir, entry.name, '.vc-config.json');
  if (!fs.existsSync(cfgPath)) continue;
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  if (cfg.runtime && cfg.runtime !== TARGET) {
    console.log(`[fix-vercel-runtime] ${entry.name}: ${cfg.runtime} -> ${TARGET}`);
    cfg.runtime = TARGET;
    fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
    patched++;
  }
}
console.log(`[fix-vercel-runtime] ${patched} function guncellendi.`);
