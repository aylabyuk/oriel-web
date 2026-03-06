import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CARDS_DIR = path.join(__dirname, '../src/assets/images/cards');
const PUBLIC_DIR = path.join(__dirname, '../public');

const WIDTH = 1200;
const HEIGHT = 630;
const CARD_W = 80;
const CARD_H = 112;

// Cards scattered around the edges with positions and rotations
const scatteredCards = [
  // Top-left area
  { file: 'red7.png', x: 60, y: 40, rotate: -20 },
  { file: 'blue3.png', x: 190, y: -10, rotate: 15 },
  { file: 'yellow5.png', x: 20, y: 180, rotate: 25 },

  // Top-right area
  { file: 'green6.png', x: 980, y: 20, rotate: 22 },
  { file: 'red2.png', x: 1080, y: 80, rotate: -18 },
  { file: 'yellow9.png', x: 1050, y: -20, rotate: 8 },

  // Bottom-left area
  { file: 'green4.png', x: 30, y: 440, rotate: -12 },
  { file: 'blue1.png', x: 150, y: 490, rotate: 18 },
  { file: 'redSkip.png', x: 100, y: 340, rotate: -28 },

  // Bottom-right area
  { file: 'yellow8.png', x: 1020, y: 420, rotate: 14 },
  { file: 'greenDrawTwo.png', x: 1100, y: 320, rotate: -22 },
  { file: 'blue0.png', x: 1060, y: 510, rotate: 30 },

  // Mid-left / mid-right scattered
  { file: 'yellow6.png', x: 240, y: 380, rotate: -8 },
  { file: 'red3.png', x: 920, y: 460, rotate: -16 },
  { file: 'green1.png', x: 280, y: 60, rotate: 10 },
  { file: 'drawFour.png', x: 880, y: 30, rotate: -14 },
];

// Foreground SVG (name badge, tagline, URL) — no background, transparent
const foregroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">
  <defs>
    <linearGradient id="rainbow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f87171"/>
      <stop offset="25%" stop-color="#facc15"/>
      <stop offset="50%" stop-color="#4ade80"/>
      <stop offset="75%" stop-color="#60a5fa"/>
      <stop offset="100%" stop-color="#a78bfa"/>
    </linearGradient>
  </defs>

  <!-- Centered rounded rectangle outline -->
  <rect x="370" y="120" width="460" height="260" rx="28" fill="none" stroke="url(#rainbow)" stroke-width="5" opacity="0.85"/>

  <!-- Name "ORIEL ABSIN" in two rows, per-letter UNO colors -->
  <text x="600" y="245" text-anchor="middle" font-family="'Arial Rounded MT Bold','Nunito','Quicksand',Arial,sans-serif" font-weight="800" font-size="86" letter-spacing="8">
    <tspan fill="#ef4444">O</tspan><tspan fill="#eab308">R</tspan><tspan fill="#22c55e">I</tspan><tspan fill="#3b82f6">E</tspan><tspan fill="#ef4444">L</tspan>
  </text>
  <text x="600" y="340" text-anchor="middle" font-family="'Arial Rounded MT Bold','Nunito','Quicksand',Arial,sans-serif" font-weight="800" font-size="86" letter-spacing="8">
    <tspan fill="#eab308">A</tspan><tspan fill="#22c55e">B</tspan><tspan fill="#3b82f6">S</tspan><tspan fill="#ef4444">I</tspan><tspan fill="#eab308">N</tspan>
  </text>

  <!-- Tagline -->
  <text x="600" y="460" text-anchor="middle" font-family="'Arial Rounded MT Bold','Nunito','Quicksand',Arial,sans-serif" font-weight="600" font-size="28" letter-spacing="4" fill="#9ca3af">A PORTFOLIO YOU CAN PLAY</text>

  <!-- Decorative dots -->
  <g fill="#9ca3af" opacity="0.4">
    <circle cx="470" cy="460" r="3"/>
    <circle cx="482" cy="460" r="3"/>
    <circle cx="494" cy="460" r="3"/>
    <circle cx="506" cy="460" r="3"/>
    <circle cx="694" cy="460" r="3"/>
    <circle cx="706" cy="460" r="3"/>
    <circle cx="718" cy="460" r="3"/>
    <circle cx="730" cy="460" r="3"/>
  </g>

  <!-- URL -->
  <text x="600" y="560" text-anchor="middle" font-family="'Arial Rounded MT Bold','Nunito','Quicksand',Arial,sans-serif" font-weight="400" font-size="22" letter-spacing="2" fill="#6b7280">orielvinci.com</text>
</svg>`;

async function generateOgImage() {
  // 1. Create background with gradient using SVG
  const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stop-color="#3a3f52"/>
        <stop offset="100%" stop-color="#282c3a"/>
      </linearGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  </svg>`;

  let base = sharp(Buffer.from(bgSvg)).png();
  let baseBuffer = await base.toBuffer();

  // 2. Prepare card composites
  const cardComposites = [];

  for (const card of scatteredCards) {
    const cardPath = path.join(CARDS_DIR, card.file);
    // Resize card, then rotate
    const rotated = await sharp(cardPath)
      .resize(CARD_W, CARD_H, { fit: 'fill' })
      .rotate(card.rotate, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    const metadata = await sharp(rotated).metadata();

    // Clamp position so it doesn't go negative (sharp requirement)
    const left = Math.max(0, Math.min(card.x, WIDTH - (metadata.width || CARD_W)));
    const top = Math.max(0, Math.min(card.y, HEIGHT - (metadata.height || CARD_H)));

    cardComposites.push({
      input: rotated,
      left: Math.round(left),
      top: Math.round(top),
    });
  }

  // 3. Composite cards onto background at reduced opacity
  // First composite all cards onto a transparent layer, then blend
  let cardsLayer = sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(cardComposites)
    .png();

  const cardsBuffer = await cardsLayer.toBuffer();

  // Apply opacity to cards layer by using a semi-transparent overlay approach
  // We'll composite the cards at lower opacity using sharp's blend
  const fadedCards = await sharp(cardsBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Manually reduce alpha to ~35%
  const { data, info } = fadedCards;
  for (let i = 3; i < data.length; i += 4) {
    data[i] = Math.round(data[i] * 0.35);
  }
  const fadedCardsBuffer = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();

  // 4. Composite faded cards onto background
  baseBuffer = await sharp(baseBuffer)
    .composite([{ input: fadedCardsBuffer, left: 0, top: 0 }])
    .png()
    .toBuffer();

  // 5. Add vignette overlay
  const vignetteSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
    <defs>
      <radialGradient id="v" cx="0.5" cy="0.5" r="0.7">
        <stop offset="0%" stop-color="transparent"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.3)"/>
      </radialGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#v)"/>
  </svg>`;

  baseBuffer = await sharp(baseBuffer)
    .composite([{ input: Buffer.from(vignetteSvg), left: 0, top: 0 }])
    .png()
    .toBuffer();

  // 6. Add foreground (text, border, tagline)
  baseBuffer = await sharp(baseBuffer)
    .composite([{ input: Buffer.from(foregroundSvg), left: 0, top: 0 }])
    .png()
    .toBuffer();

  // 7. Write final image
  await sharp(baseBuffer).toFile(path.join(PUBLIC_DIR, 'og-image.png'));

  console.log('Done! og-image.png generated with actual card textures.');
}

generateOgImage().catch(console.error);
