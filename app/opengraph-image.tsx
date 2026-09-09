import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Ollieen — the digital foundation for a network of high-autonomy communities.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const iconBuffer = await readFile(join(process.cwd(), "app/icon.png"));
  const iconSrc = `data:image/png;base64,${iconBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: "#08090d",
        }}
      >
        <img src={iconSrc} alt="Ollieen" width={168} height={168} style={{ borderRadius: 36 }} />
        <div style={{ display: "flex", fontSize: 92, fontWeight: 700, color: "#f4f5f7", letterSpacing: -2 }}>
          Ollieen
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#9aa1ae" }}>
          The digital foundation for a network of high-autonomy communities.
        </div>
      </div>
    ),
    { ...size }
  );
}
