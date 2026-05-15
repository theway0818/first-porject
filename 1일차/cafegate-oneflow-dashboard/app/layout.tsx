import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ONE FLOW — 모든 업무, 하나의 흐름으로",
  description: "흐름이 이어지면, 팀이 이어진다.",
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
      <body className="antialiased bg-white" style={{ fontFamily: "'Pretendard', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
