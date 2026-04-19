import { io } from 'socket.io-client';
import { SERVER_BASE_URL } from '../services/runtimeConfig';

let socket = null;

export const connectSocket = (userId, area) => {
  if (socket && socket.connected) return socket;

  socket = io(SERVER_BASE_URL, {
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
