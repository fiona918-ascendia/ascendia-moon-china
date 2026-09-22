import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "中秋 × 国庆特别企划｜你的海外布局“圆”了吗？",
  description: "6个问题，60秒生成你的企业出海月相报告",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://ascendia-moon.vercel.app"),
  openGraph: {
    title: "中秋 × 国庆特别企划｜你的海外布局“圆”了吗？",
    description: "6个问题，60秒生成你的企业出海月相报告",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Ascendia Partners 企业出海月相测试" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "中秋 × 国庆特别企划｜你的海外布局“圆”了吗？",
    description: "6个问题，60秒生成你的企业出海月相报告"
  },
  robots: { index: true, follow: true }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0a2639"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
