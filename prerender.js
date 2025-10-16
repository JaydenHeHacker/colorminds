import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

// Resolve paths relative to this module (ESM-safe __dirname)
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const toAbsolute = (p) => path.resolve(__dirname, p);

// Load .env values manually when running under Node
const envFile = toAbsolute('.env');
if (fs.existsSync(envFile)) {
  const envLines = fs.readFileSync(envFile, 'utf-8').split(/\r?\n/);
  for (const line of envLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (!key || rest.length === 0) continue;
    const value = rest.join('=').trim().replace(/^"|"$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

// HTML shell from the client build
const template = fs.readFileSync(toAbsolute('dist/index.html'), 'utf-8');

// SSR entry point
const { render } = await import('./dist/server/entry-server.js');

// Static routes to always pre-render
const staticRoutes = ['/', '/about', '/series', '/popular'];

// Load category routes straight from Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
let dynamicCategoryRoutes = [];

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase env vars missing, skip dynamic categories.');
} else {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(
      `${supabaseUrl}/rest/v1/categories?select=path,slug`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        signal: controller.signal,
      },
    );
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Supabase categories request failed: ${res.status}`);
    }

    const cats = await res.json();
    dynamicCategoryRoutes = (cats || [])
      .map((cat) => (cat?.path ? `/category/${cat.path}` : null))
      .filter(Boolean);
  } catch (error) {
    console.warn('⚠️ Failed to fetch categories from Supabase, skip dynamic categories.');
    console.warn(error);
  }
}

const routesToPrerender = Array.from(new Set([...staticRoutes, ...dynamicCategoryRoutes]));

for (const route of routesToPrerender) {
  const appHtml = render(route);
  const html = template.replace('<!--app-html-->', appHtml);

  const isRoot = route === '/';
  const looksLikeFile = /\.[a-zA-Z0-9]+$/.test(route);

  const outPath = isRoot
    ? 'dist/index.html'
    : looksLikeFile
      ? `dist${route}`
      : `dist${route.endsWith('/') ? route : `${route}/`}index.html`;

  fs.mkdirSync(path.dirname(toAbsolute(outPath)), { recursive: true });
  fs.writeFileSync(toAbsolute(outPath), html);
  console.log('✨ Pre-rendered:', outPath);
}
