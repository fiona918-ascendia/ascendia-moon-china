import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Ascendia Partners 企业出海月相测试";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function imageDataUrl(bytes: ArrayBuffer) {
  const view = new Uint8Array(bytes);
  const chunkSize = 8192;
  let binary = "";
  for (let index = 0; index < view.length; index += chunkSize) {
    binary += String.fromCharCode(...view.subarray(index, index + chunkSize));
  }
  return "data:image/jpeg;base64," + btoa(binary);
}

export default async function OpenGraphImage() {
  const logoBytes = await fetch(new URL("../public/assets/ascendia-logo.jpg", import.meta.url)).then((response) => response.arrayBuffer());
  const logo = imageDataUrl(logoBytes);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #061a2a 0%, #184A63 58%, #09273a 100%)",
          color: "#f8f0de",
          fontFamily: "serif"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", padding: "64px 80px", width: "66%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, height: 72 }}>
            <div style={{ display: "flex", width: 210, height: 70, overflow: "hidden", background: "#ffffff" }}>
              <img src={logo} width="210" height="70" style={{ objectFit: "cover", objectPosition: "center" }} />
            </div>
            <span style={{ display: "flex", fontSize: 23, letterSpacing: 2, color: "#e4c47c" }}>信宏咨询</span>
          </div>
          <div style={{ display: "flex", marginTop: 82, fontSize: 31, letterSpacing: 4, color: "#f2d99c" }}>中秋 × 国庆特别企划</div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 58, lineHeight: 1.25, fontWeight: 600 }}>企业出海月相测试</div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 28, color: "#d8e3e1" }}>6 个问题 · 60 秒生成专属月相报告</div>
          <div style={{ display: "flex", marginTop: "auto", fontSize: 22, letterSpacing: 2, color: "#e4c47c" }}>立足亚洲，辐射全球</div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 80,
            top: 100,
            width: 350,
            height: 350,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 29%, #fff7da 0%, #f3d78f 37%, #c7954c 73%, #76502e 100%)",
            boxShadow: "0 0 76px 24px rgba(238, 199, 111, .32)"
          }}
        />
        <div style={{ position: "absolute", right: 114, top: 155, width: 74, height: 38, borderRadius: "50%", background: "rgba(132, 91, 48, .25)" }} />
        <div style={{ position: "absolute", right: 298, top: 310, width: 88, height: 55, borderRadius: "50%", background: "rgba(132, 91, 48, .22)" }} />
      </div>
    ),
    { ...size }
  );
}
