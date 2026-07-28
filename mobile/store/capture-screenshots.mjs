/**
 * Captura las pantallas de la ficha de Play desde la app desplegada.
 * La web y la app RN comparten diseño 1:1, así que el render es representativo.
 *
 *   node mobile/store/capture-screenshots.mjs
 *
 * Salida: mobile/store/screenshots/*.png a 1080x1920 (9:16, formato recomendado).
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'screenshots');
mkdirSync(OUT, { recursive: true });

const BASE = 'https://zylen-beta.vercel.app';
const EMAIL = 'qa.claude@zylen.test';
const PASSWORD = 'ZylenQA-2026!';

// 540x960 con deviceScaleFactor 2 => PNG de 1080x1920
const VIEWPORT = { width: 540, height: 960 };

const SHOTS = [
  { name: '1-home', path: '/', wait: 3500 },
  { name: '2-habitos', path: '/habits', wait: 3000 },
  { name: '3-progreso', path: '/streaks', wait: 3000 },
  { name: '4-enfoque', path: '/focus', wait: 3000 },
  { name: '5-comunidad', path: '/leaderboard', wait: 3500 },
  { name: '6-reinos', path: '/realms', wait: 3000 },
];

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: 'es-ES',
});
const page = await context.newPage();

console.log('→ login');
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.getByRole('textbox', { name: /correo/i }).fill(EMAIL);
await page.getByRole('textbox', { name: /contrase/i }).fill(PASSWORD);
await page.getByRole('button', { name: /iniciar sesi/i }).click();
await page.waitForURL(`${BASE}/`, { timeout: 30000 });
await page.waitForTimeout(4000);

for (const shot of SHOTS) {
  console.log(`→ ${shot.name} (${shot.path})`);
  await page.goto(`${BASE}${shot.path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(shot.wait);
  await page.screenshot({ path: join(OUT, `${shot.name}.png`), type: 'png' });
}

await browser.close();
console.log(`\n✅ Capturas en ${OUT}`);
