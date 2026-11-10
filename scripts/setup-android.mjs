// Ajusta o projeto Android gerado pelo Capacitor:
// 1) copia o som da missão para res/raw
// 2) adiciona as permissões no AndroidManifest.xml
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appMain = path.join(root, 'android', 'app', 'src', 'main');

if (!fs.existsSync(appMain)) {
  console.error('Pasta android/ não encontrada. Rode primeiro: npx cap add android');
  process.exit(1);
}

// som
const raw = path.join(appMain, 'res', 'raw');
fs.mkdirSync(raw, { recursive: true });
fs.copyFileSync(path.join(root, 'android-res', 'missao.wav'), path.join(raw, 'missao.wav'));
console.log('✔ Som da missão copiado para res/raw/missao.wav');

// permissões
const manifestPath = path.join(appMain, 'AndroidManifest.xml');
let xml = fs.readFileSync(manifestPath, 'utf8');
const perms = [
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.SCHEDULE_EXACT_ALARM',
  'android.permission.USE_EXACT_ALARM',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.WAKE_LOCK',
  'android.permission.VIBRATE',
  'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION'
];
let added = 0;
for (const p of perms) {
  if (!xml.includes(`"${p}"`)) {
    xml = xml.replace('</manifest>', `    <uses-permission android:name="${p}" />\n</manifest>`);
    added++;
  }
}
fs.writeFileSync(manifestPath, xml);
console.log(`✔ ${added} permissão(ões) adicionada(s) ao AndroidManifest.xml`);
console.log('Pronto! Agora rode: npx cap sync android && npx cap open android');
