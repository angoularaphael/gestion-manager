import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const logoPath = join(publicDir, "favicon-brand.png");
const bg = { r: 255, g: 255, b: 255, alpha: 1 };

async function circularIcon(size, { maskable = false } = {}) {
  const inset = maskable ? Math.round(size * 0.1) : Math.round(size * 0.06);
  const inner = size - inset * 2;
  const logoW = Math.round(inner * 0.96);

  const logo = await sharp(logoPath)
    .resize(logoW, Math.round(logoW * 0.58), { fit: "inside", withoutEnlargement: false })
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

const fav32 = await circularIcon(32);
const b64 = (await sharp(fav32).png().toBuffer()).toString("base64");
writeFileSync(
  join(publicDir, "favicon.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="Boxing Center">
  <image href="data:image/png;base64,${b64}" width="32" height="32"/>
</svg>`
);
console.log("Wrote favicon.svg");
