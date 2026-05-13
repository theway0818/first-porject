import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "카페게이트 ONE FLOW 대시보드",
  description: "카페게이트 구매물류팀 협업 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#FAF6F0]" style={{ fontFamily: "'Pretendard', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
