import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const iconSvg = await readFile(fileURLToPath(new URL('../public/favicon.svg', import.meta.url)))

const out = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url))

async function icon(size, target) {
    await sharp(iconSvg, { density: Math.max(72, size * 2) })
        .resize(size, size)
        .png()
        .toFile(out(target))
}

await Promise.all([
    icon(192, 'icon-192.png'),
    icon(512, 'icon-512.png'),
    icon(180, 'apple-touch-icon.png'),
    icon(32, 'favicon-32.png'),
])

const ogSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a0a0f"/>
      <stop offset="1" stop-color="#1a1a2e"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#667eea"/>
      <stop offset="0.5" stop-color="#764ba2"/>
      <stop offset="1" stop-color="#f093fb"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1050" cy="90" r="240" fill="#667eea" opacity="0.18"/>
  <circle cx="130" cy="590" r="220" fill="#f093fb" opacity="0.12"/>
  <g transform="translate(96 96)">
    <rect width="88" height="88" rx="20" fill="url(#accent)"/>
    <circle cx="60" cy="30" r="7" fill="#fff" opacity=".9"/>
    <path d="M16 68l18-22 12 14 10-11 20 19H16z" fill="#fff"/>
  </g>
  <text x="96" y="300" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="76" font-weight="800" fill="#ffffff">ImageKit Pro</text>
  <text x="96" y="372" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="34" fill="#b9bed1">20 private image tools, right in your browser</text>
  <text x="96" y="470" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="26" fill="#8b9dff">Compress - Resize - Remove Background - Convert - OCR</text>
  <rect x="96" y="520" width="330" height="56" rx="28" fill="url(#accent)"/>
  <text x="261" y="556" text-anchor="middle" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="24" font-weight="700" fill="#ffffff">Free - No uploads</text>
</svg>`

await sharp(Buffer.from(ogSvg)).png().toFile(out('og-image.png'))

console.log('Generated icons and og-image in public/')
