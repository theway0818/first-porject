"use client";

import Image from "next/image";

type LogoVariant = "horizontal" | "icon" | "wordmark";
type LogoTheme = "light" | "dark";

interface OneFlowLogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  height?: number;
  className?: string;
}

// 심볼 이미지 (user-provided PNG)
function Symbol({ size }: { size: number }) {
  return (
    <Image
      src="/logos/oneflow-symbol.png"
      alt="ONE FLOW"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "contain" }}
      priority
    />
  );
}

// 가로형: 심볼 + ONE FLOW 텍스트
function HorizontalLogo({ height, theme = "light" }: { height: number; theme: LogoTheme }) {
  const symbolSize = height;
  const textColor = theme === "dark" ? "#F8FAFC" : "#0F172A";
  const flowColor = theme === "dark" ? "#60A5FA" : "#2563EB";

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, height }}>
      <Symbol size={symbolSize} />
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <span style={{
          fontFamily: "'Segoe UI', 'Inter', sans-serif",
          fontSize: height * 0.55,
          fontWeight: 800,
          color: textColor,
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}>
          ONE
        </span>
        <span style={{
          fontFamily: "'Segoe UI', 'Inter', sans-serif",
          fontSize: height * 0.55,
          fontWeight: 300,
          color: flowColor,
          letterSpacing: "0.06em",
          lineHeight: 1,
        }}>
          FLOW
        </span>
      </div>
    </div>
  );
}

// 아이콘형: 심볼만
function IconLogo({ height }: { height: number }) {
  return <Symbol size={height} />;
}

// 워드마크형: 심볼 + 텍스트 (세로 배치)
function WordmarkLogo({ height, theme = "light" }: { height: number; theme: LogoTheme }) {
  const symbolSize = height * 0.65;
  const textColor = theme === "dark" ? "#F8FAFC" : "#0F172A";
  const flowColor = theme === "dark" ? "#60A5FA" : "#2563EB";

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 6, height }}>
      <Symbol size={symbolSize} />
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <span style={{
          fontFamily: "'Segoe UI', 'Inter', sans-serif",
          fontSize: height * 0.18,
          fontWeight: 800,
          color: textColor,
          letterSpacing: "0.05em",
          lineHeight: 1,
        }}>
          ONE
        </span>
        <span style={{
          fontFamily: "'Segoe UI', 'Inter', sans-serif",
          fontSize: height * 0.18,
          fontWeight: 300,
          color: flowColor,
          letterSpacing: "0.1em",
          lineHeight: 1,
        }}>
          FLOW
        </span>
      </div>
    </div>
  );
}

export default function OneFlowLogo({
  variant = "horizontal",
  theme = "light",
  height = 48,
  className = "",
}: OneFlowLogoProps) {
  const render = () => {
    switch (variant) {
      case "icon":
        return <IconLogo height={height} />;
      case "wordmark":
        return <WordmarkLogo height={height} theme={theme} />;
      case "horizontal":
      default:
        return <HorizontalLogo height={height} theme={theme} />;
    }
  };

  return (
    <div className={className} style={{ display: "inline-flex", alignItems: "center" }}>
      {render()}
    </div>
  );
}
