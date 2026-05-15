import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ONE FLOW — 모든 업무, 하나의 흐름으로",
  description: "지금 우리 팀 업무, 한눈에 파악하고 있나요? ONE FLOW는 협업툴·팀 대시보드·업무관리를 하나로 통합해 정보 파편화를 끝냅니다.",
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
