import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (userId, area) => {
  if (socket && socket.connected) return socket;

  socket = io('http://localhost:5000', {
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    socket.emit('join', { userId, area });
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
