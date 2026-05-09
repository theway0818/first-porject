import { Server } from 'socket.io';

let io: Server;

export function initSocket(server: Server): void {
  io = server;
  io.on('connection', (socket) => {
    socket.on('join_project', (projectId: number) => {
      socket.join(`project:${projectId}`);
    });
    socket.on('leave_project', (projectId: number) => {
      socket.leave(`project:${projectId}`);
    });
  });
}

export function emitToProject(projectId: number, event: string, data: unknown): void {
  if (io) io.to(`project:${projectId}`).emit(event, data);
}

export function emitToUser(userId: number, event: string, data: unknown): void {
  if (io) io.to(`user:${userId}`).emit(event, data);
}

export function joinUserRoom(socket: { join: (room: string) => void }, userId: number): void {
  socket.join(`user:${userId}`);
}

export { io };
