// Socket.io는 Vercel Serverless와 호환되지 않아 제거됨.
// 실시간 알림은 프론트엔드 폴링(/api/notifications) 방식으로 대체.

export function emitToProject(_projectId: number, _event: string, _data: unknown): void {}
export function emitToUser(_userId: number, _event: string, _data: unknown): void {}
