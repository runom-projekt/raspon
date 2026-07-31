const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const SRC = path.join(__dirname, "..", "ChatGPT Image 29 lip 2026, 14_11_17 (1).png");
const OUT = path.join(__dirname, "..", "public");

const NAVY_HEX = "#000e27";
const CROP = { left: 85, top: 85, width: 1084, height: 1084 };
const CORNER_R = 192; // ~17.7% of 1084, matches source art

async function main() {
  // 1. crop out the outer white canvas margin, leaving the navy rounded square
  const squareBadge = await sharp(SRC).extract(CROP).png().toBuffer();

  // 2. rounded-rect alpha mask to drop the tiny white corner slivers
  const mask = Buffer.from(
    `<svg width="${CROP.width}" height="${CROP.height}"><rect width="${CROP.width}" height="${CROP.height}" rx="${CORNER_R}" fill="#fff"/></svg>`
  );
  const roundedBadge = await sharp(squareBadge)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();

  // full-bleed flattened square (for apple-touch-icon: no alpha, no pre-rounding, iOS masks it itself)
  const flatSquare = await sharp(squareBadge)
    .flatten({ background: NAVY_HEX })
    .png()
    .toBuffer();

  async function writeAny(file, size) {
    await sharp(roundedBadge).resize(size, size).png().toBuffer().then((b) => fs.writeFileSync(path.join(OUT, file), b));
  }

  async function writeMaskable(file, size) {
    // shrink the whole (already-inset) badge further so its content sits inside the maskable safe zone;
    // badge's own navy fill matches the canvas fill, so the seam is invisible
    const badgeTarget = Math.round(size * 0.8);
    const badgeResized = await sharp(roundedBadge)
      .resize(badgeTarget, badgeTarget)
      .png()
      .toBuffer();
    const offset = Math.round((size - badgeTarget) / 2);
    const canvas = sharp({
      create: { width: size, height: size, channels: 4, background: NAVY_HEX },
    })
      .composite([{ input: badgeResized, left: offset, top: offset }])
      .png();
    await canvas.toBuffer().then((b) => fs.writeFileSync(path.join(OUT, file), b));
  }

  await writeAny("favicon-16.png", 16);
  await writeAny("favicon-32.png", 32);
  await writeAny("icon-192.png", 192);
  await writeAny("icon-512.png", 512);
  await writeMaskable("icon-maskable-192.png", 192);
  await writeMaskable("icon-maskable-512.png", 512);
  await sharp(flatSquare).resize(180, 180).png().toBuffer().then((b) => fs.writeFileSync(path.join(OUT, "apple-touch-icon.png"), b));

  // icon.svg: embed the rounded badge as a data URI so the vector slot still renders the new logo crisply
  const roundedBase64 = roundedBadge.toString("base64");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CROP.width} ${CROP.height}">
  <image width="${CROP.width}" height="${CROP.height}" href="data:image/png;base64,${roundedBase64}"/>
</svg>
`;
  fs.writeFileSync(path.join(OUT, "icon.svg"), svg);

  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
