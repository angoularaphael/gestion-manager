import sharp from "sharp";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const logoPath = join(publicDir, "logo.png");
const iconsDir = join(publicDir, "icons");
const bg = { r: 15, g: 23, b: 42, alpha: 1 };

async function circularIcon(size, { maskable = false } = {}) {
  const inset = maskable ? Math.round(size * 0.12) : 0;
  const inner = size - inset * 2;
  const logoW = Math.round(inner * 0.72);

  const logo = await sharp(logoPath)
    .resize(logoW, Math.round(logoW * 0.47), { fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();

  const mask = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
    </svg>`
  );

  const base = await sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toBuffer();

  return sharp(base)
    .composite([{ input: await sharp(mask).png().toBuffer(), blend: "dest-in" }])
    .png()
    .toBuffer();
}

const outputs = [
  { name: "icons/icon-192.png", size: 192 },
  { name: "icons/icon-512.png", size: 512 },
  { name: "icons/icon-maskable-512.png", size: 512, maskable: true },
  { name: "icons/apple-touch-icon.png", size: 180 },
  { name: "favicon.png", size: 32 },
];

for (const { name, size, maskable } of outputs) {
  const buf = await circularIcon(size, { maskable });
  await sharp(buf).toFile(join(publicDir, name));
  console.log(`Wrote ${name} (${size}x${size})`);
}
