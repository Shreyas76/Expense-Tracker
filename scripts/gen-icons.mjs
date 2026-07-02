// Rasterizes SVG sources into the PNG icons referenced by the PWA manifest.
// Run: node scripts/gen-icons.mjs
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const OUT = new URL('../public/icons/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

// Standard "any" icon — full-bleed rounded square.
const anyIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#0f1117"/>
  <rect x="96" y="150" width="320" height="230" rx="40" fill="url(#g)"/>
  <circle cx="332" cy="265" r="26" fill="#0f1117" opacity="0.35"/>
  <text x="200" y="312" font-family="Arial, sans-serif" font-size="150" font-weight="800" fill="#ffffff" text-anchor="middle">₹</text>
  <defs>
    <linearGradient id="g" x1="96" y1="150" x2="416" y2="380" gradientUnits="userSpaceOnUse">
      <stop stop-color="#818cf8"/><stop offset="1" stop-color="#4f46e5"/>
    </linearGradient>
  </defs>
</svg>`

// Maskable icon — content kept within the safe zone (~80%) with solid bg.
const maskableIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#4f46e5"/>
  <rect x="146" y="176" width="220" height="160" rx="28" fill="#ffffff" opacity="0.12"/>
  <text x="256" y="322" font-family="Arial, sans-serif" font-size="200" font-weight="800" fill="#ffffff" text-anchor="middle">₹</text>
</svg>`

async function render(svg, size, name) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(OUT + name)
  console.log('wrote', name)
}

await render(anyIcon, 192, 'icon-192.png')
await render(anyIcon, 512, 'icon-512.png')
await render(maskableIcon, 192, 'icon-maskable-192.png')
await render(maskableIcon, 512, 'icon-maskable-512.png')
console.log('done')
