import sharp from "sharp";
import { encode } from "blurhash";
const files = ["evidence-1","evidence-2","evidence-3","evidence-4"];
for (const f of files) {
  const { data, info } = await sharp(`public/videos/${f}.jpg`)
    .raw().ensureAlpha().resize(32, 32, { fit: "inside" }).toBuffer({ resolveWithObject: true });
  const hash = encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3);
  console.log(`${f}: ${hash} (${hash.length} chars)`);
}
