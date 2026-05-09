// Socket.io는 Vercel Serverless와 호환되지 않아 제거됨.
// 알림은 Header 컴포넌트에서 30초 폴링으로 자동 갱신됨.
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

const SocketContext = createContext<null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  return <SocketContext.Provider value={null}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);
