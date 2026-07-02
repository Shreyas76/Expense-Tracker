// Rasterizes SVG sources into the PNG icons referenced by the PWA manifest.
// Run: node scripts/gen-icons.mjs
import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../public/icons')
mkdirSync(OUT, { recursive: true })

const anyIcon = readFileSync(join(__dirname, '../public/favicon.svg'), 'utf8')

// Maskable: simplified donut + rupee on solid indigo (safe zone ~80%).
const maskableIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop stop-color="#6366f1"/>
      <stop offset="1" stop-color="#4338ca"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(256 256) rotate(-90)">
    <circle r="118" fill="none" stroke="#ffffff" stroke-width="44" stroke-linecap="round"
      stroke-dasharray="260 480" stroke-opacity="0.95"/>
    <circle r="118" fill="none" stroke="#fecaca" stroke-width="44" stroke-linecap="round"
      stroke-dasharray="140 480" stroke-dashoffset="-275" stroke-opacity="0.85"/>
    <circle r="118" fill="none" stroke="#fde68a" stroke-width="44" stroke-linecap="round"
      stroke-dasharray="70 480" stroke-dashoffset="-430" stroke-opacity="0.85"/>
  </g>
  <circle cx="256" cy="256" r="68" fill="#ffffff" fill-opacity="0.12"/>
  <text x="256" y="288" font-family="Arial, Helvetica, sans-serif" font-size="120" font-weight="800"
    fill="#ffffff" text-anchor="middle">₹</text>
</svg>`

async function render(svg, size, name) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(OUT, name))
  console.log('wrote', name)
}

await render(anyIcon, 192, 'icon-192.png')
await render(anyIcon, 512, 'icon-512.png')
await render(maskableIcon, 192, 'icon-maskable-192.png')
await render(maskableIcon, 512, 'icon-maskable-512.png')
console.log('done')
