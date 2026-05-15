type LogLevel = "info" | "warn" | "error";

type LogEntry = {
  level: LogLevel;
  route: string;
  message: string;
  detail?: string;
  stack?: string;
  timestamp: string;
};

export function log(level: LogLevel, route: string, message: string, err?: unknown) {
  const entry: LogEntry = {
    level,
    route,
    message,
    timestamp: new Date().toISOString(),
  };

  if (err instanceof Error) {
    entry.detail = err.message;
    entry.stack  = err.stack;
  } else if (err !== undefined) {
    entry.detail = String(err);
  }

  // Vercel 로그에 JSON으로 출력 → Vercel 대시보드 Logs 탭에서 검색 가능
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

// API 라우트용 편의 함수
export const apiLogger = (route: string) => ({
  info:  (msg: string)              => log("info",  route, msg),
  warn:  (msg: string)              => log("warn",  route, msg),
  error: (msg: string, err: unknown) => log("error", route, msg, err),
});
