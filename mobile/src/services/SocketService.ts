import { io, Socket } from 'socket.io-client';
import { User, ChatMessage } from '../types';

const SOCKET_URL = 'https://api-inventory.isavralabel.com'; // For Android emulator
// const SOCKET_URL = 'http://localhost:3001'; // For iOS simulator

class SocketService {
  private socket: Socket | null = null;
  private messageCallbacks: ((message: ChatMessage) => void)[] = [];
  private connectionCallbacks: (() => void)[] = [];
  private disconnectionCallbacks: (() => void)[] = [];

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      path: '/api/atira/socket.io',
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.connectionCallbacks.forEach(callback => callback());
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.disconnectionCallbacks.forEach(callback => callback());
    });

    this.socket.on('message', (message: ChatMessage) => {
      this.messageCallbacks.forEach(callback => callback(message));
    });

    this.socket.on('loadMessages', (messages: ChatMessage[]) => {
      messages.forEach(message => {
        this.messageCallbacks.forEach(callback => callback(message));
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinChat(user: User): void {
    if (this.socket) {
      this.socket.emit('joinChat', { user });
    }
  }

  joinAnonymousChat(user: User): void {
    if (this.socket) {
      this.socket.emit('joinAnonymousChat', { user });
    }
  }

  sendMessage(content: string, sender: User, roomId?: string): void {
    if (this.socket) {
      this.socket.emit('sendMessage', {
        content,
        sender,
        roomId,
      });
    }
  }

  sendAnonymousMessage(content: string, sender: User): void {
    if (this.socket) {
      this.socket.emit('sendAnonymousMessage', {
        content,
        sender,
      });
    }
  }

  onMessage(callback: (message: ChatMessage) => void): void {
    this.messageCallbacks.push(callback);
  }

  onConnection(callback: () => void): void {
    this.connectionCallbacks.push(callback);
  }

  onDisconnection(callback: () => void): void {
    this.disconnectionCallbacks.push(callback);
  }

  removeMessageListener(callback: (message: ChatMessage) => void): void {
    this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
  }

  removeConnectionListener(callback: () => void): void {
    this.connectionCallbacks = this.connectionCallbacks.filter(cb => cb !== callback);
  }

  removeDisconnectionListener(callback: () => void): void {
    this.disconnectionCallbacks = this.disconnectionCallbacks.filter(cb => cb !== callback);
  }
}

export default new SocketService();
