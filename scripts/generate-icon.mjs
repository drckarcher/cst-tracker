import sharp from 'sharp'

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="180" height="180" fill="url(#bg)" rx="22"/>

  <!-- Cabinet body -->
  <rect x="52" y="28" width="76" height="96" rx="5" fill="white" fill-opacity="0.95"/>

  <!-- Drawer 1 -->
  <rect x="58" y="34" width="64" height="27" rx="3" fill="#dbeafe"/>
  <rect x="80" y="46" width="20" height="4" rx="2" fill="#1e40af"/>

  <!-- Drawer 2 -->
  <rect x="58" y="65" width="64" height="27" rx="3" fill="#dbeafe"/>
  <rect x="80" y="77" width="20" height="4" rx="2" fill="#1e40af"/>

  <!-- Drawer 3 -->
  <rect x="58" y="96" width="64" height="24" rx="3" fill="#dbeafe"/>
  <rect x="80" y="107" width="20" height="4" rx="2" fill="#1e40af"/>

  <!-- CST label -->
  <text x="90" y="152" font-family="Arial Black, Arial, sans-serif" font-size="26" font-weight="900" fill="white" text-anchor="middle" letter-spacing="2">CST</text>
</svg>`

await sharp(Buffer.from(svg))
  .png()
  .toFile('public/apple-touch-icon.png')

console.log('Icon generated: public/apple-touch-icon.png')
