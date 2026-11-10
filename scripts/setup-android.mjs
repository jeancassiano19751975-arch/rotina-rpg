// Ajusta o projeto Android gerado pelo Capacitor:
// 1) som da missão em res/raw
// 2) ícones do herói (6 fases), abertura, widget e recursos em res/
// 3) código nativo: ponte RpgNative, botão "Feito" sem abrir o app, widget
// 4) AndroidManifest: permissões, ícones que trocam (activity-alias), widget e receptor
// 5) botão "Feito" da notificação vira broadcast (não abre o app)
// 6) número da versão
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appMain = path.join(root, 'android', 'app', 'src', 'main');
const PKG = 'com.jean.rotinarpg';

if (!fs.existsSync(appMain)) {
  console.error('Pasta android/ não encontrada. Rode primeiro: npx cap add android');
  process.exit(1);
}
const copyDir = (from, to) => {
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) { fs.mkdirSync(b, { recursive: true }); copyDir(a, b); }
    else fs.copyFileSync(a, b);
  }
};

// 1) som
const raw = path.join(appMain, 'res', 'raw');
fs.mkdirSync(raw, { recursive: true });
fs.copyFileSync(path.join(root, 'android-res', 'missao.wav'), path.join(raw, 'missao.wav'));
console.log('✔ Som da missão');

// 2) recursos (ícones, abertura, widget)
copyDir(path.join(root, 'android-res', 'res'), path.join(appMain, 'res'));
// o ícone antigo em primeiro plano não é mais usado; o adaptativo novo aponta para o herói
console.log('✔ Ícones, abertura e widget');

// 3) código nativo
const javaDir = path.join(appMain, 'java', ...PKG.split('.'));
fs.mkdirSync(javaDir, { recursive: true });
copyDir(path.join(root, 'android-res', 'native'), javaDir);
console.log('✔ Código nativo em ' + path.relative(root, javaDir));

// 4) manifest
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
  'android.permission.REQUEST_INSTALL_PACKAGES'
];
for (const p of perms) if (!xml.includes(`"${p}"`)) xml = xml.replace('</manifest>', `    <uses-permission android:name="${p}" />\n</manifest>`);
// localização saiu do app
xml = xml.replace(/\s*<uses-permission android:name="android\.permission\.ACCESS_(COARSE|FINE|BACKGROUND)_LOCATION"\s*\/>/g, '');

// o ícone da tela inicial passa a ser um dos 6 "aliases" (só um ligado por vez)
if (!xml.includes('.Hero0')) {
  xml = xml.replace(/<intent-filter>\s*<action android:name="android\.intent\.action\.MAIN" \/>\s*<category android:name="android\.intent\.category\.LAUNCHER" \/>\s*<\/intent-filter>/, '');
  let aliases = '';
  for (let i = 0; i < 6; i++) {
    aliases += `
        <activity-alias
            android:name=".Hero${i}"
            android:targetActivity=".MainActivity"
            android:icon="@mipmap/ic_hero_${i}"
            android:roundIcon="@mipmap/ic_hero_${i}"
            android:label="@string/app_name"
            android:enabled="${i === 0 ? 'true' : 'false'}"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity-alias>`;
  }
  const extra = aliases + `

        <receiver android:name=".RpgActionReceiver" android:exported="false" />

        <receiver android:name=".RpgWidget" android:exported="true" android:label="Rotina RPG">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data android:name="android.appwidget.provider" android:resource="@xml/rpg_widget_info" />
        </receiver>
`;
  xml = xml.replace('</application>', extra + '    </application>');
}
fs.writeFileSync(manifestPath, xml);
if (xml.includes('android.intent.category.LAUNCHER') && xml.includes('.Hero0')) console.log('✔ Manifest: permissões, 6 ícones, widget');
else { console.error('✖ Não achei o lugar do ícone no AndroidManifest.xml'); process.exit(1); }

// 5) "Feito" na notificação: broadcast para o RpgActionReceiver em vez de abrir o app
const lnm = path.join(root, 'node_modules', '@capacitor', 'local-notifications', 'android', 'src', 'main', 'java',
  'com', 'capacitorjs', 'plugins', 'localnotifications', 'LocalNotificationManager.java');
let src = fs.readFileSync(lnm, 'utf8');
const ORIG = `                PendingIntent actionPendingIntent = PendingIntent.getActivity(
                    context,
                    localNotification.getId() + notificationAction.getId().hashCode(),
                    actionIntent,
                    flags
                );`;
if (src.includes('RpgActionReceiver')) console.log('✔ Botão Feito já ajustado');
else if (src.includes(ORIG)) {
  src = src.replace(ORIG, `                PendingIntent actionPendingIntent;
                if ("feito".equals(notificationAction.getId())) {
                    Intent bg = new Intent();
                    bg.setClassName(context, context.getPackageName() + ".RpgActionReceiver");
                    bg.putExtras(actionIntent);
                    actionPendingIntent = PendingIntent.getBroadcast(
                        context,
                        localNotification.getId() + notificationAction.getId().hashCode(),
                        bg,
                        flags
                    );
                } else {
                    actionPendingIntent = PendingIntent.getActivity(
                        context,
                        localNotification.getId() + notificationAction.getId().hashCode(),
                        actionIntent,
                        flags
                    );
                }`);
  fs.writeFileSync(lnm, src);
  console.log('✔ Botão Feito marca sem abrir o app');
} else console.warn('⚠ Não achei o código do botão da notificação; "Feito" vai abrir o app');

// 6) versão (o GitHub passa o número da compilação)
const run = Number(process.env.GITHUB_RUN_NUMBER || 0);
const gradle = path.join(root, 'android', 'app', 'build.gradle');
let g = fs.readFileSync(gradle, 'utf8');
g = g.replace(/versionCode \d+/, 'versionCode ' + (300 + run)).replace(/versionName "[^"]*"/, `versionName "3.0.${run}"`);
// assinatura fixa: o APK sempre sai com a chave do projeto (android-res/debug.keystore),
// assim toda versão nova instala por cima da anterior.
if (!g.includes('signingConfigs')) {
  g = g.replace(/android\s*\{/, `android {
    signingConfigs {
        fixa {
            storeFile file('../../android-res/debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    buildTypes {
        debug { signingConfig signingConfigs.fixa }
    }`);
}
fs.writeFileSync(gradle, g);
if (!g.includes('signingConfigs.fixa')) { console.error('✖ Não consegui fixar a assinatura no build.gradle'); process.exit(1); }
console.log('✔ Versão 3.0.' + run + ' com assinatura fixa');
console.log('Pronto! Agora rode: npx cap sync android');
