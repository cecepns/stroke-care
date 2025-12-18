import { io } from 'socket.io-client';

const SOCKET_URL = "https://api-inventory.isavralabel.com";

let socket = null;

export const initSocket = (token = null) => {
  if (socket) {
    socket.disconnect();
  }
  
  socket = io(SOCKET_URL, {
    path: '/api/atira/socket.io',
    auth: {
      token: token || localStorage.getItem('token')
    }
  });
  
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};