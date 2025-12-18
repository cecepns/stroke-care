import { useState, useEffect, useRef } from 'react';
import { getSocket, initSocket } from '../../utils/socket';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import AdminChat from './AdminChat';
import api from '../../utils/api';

const LiveChat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const messagesEndRef = useRef(null);
  const { user, isAuthenticated } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat history for authenticated users
  useEffect(() => {
    const loadChatHistory = async () => {
      if (user && user.role !== 'admin') {
        setLoadingHistory(true);
        try {
          const response = await api.get('/chat-history/user/recent?limit=50');
          setChatHistory(response.data);
          
          // If there are previous messages, show them in the current chat
          if (response.data.length > 0) {
            const formattedMessages = response.data.map(msg => ({
              id: msg.id,
              content: msg.content,
              sender: {
                id: msg.sender_id,
                name: msg.sender_name,
                role: msg.sender_role
              },
              timestamp: msg.created_at
            }));
            setMessages(formattedMessages);
          }
        } catch (error) {
          console.error('Failed to load chat history:', error);
        } finally {
          setLoadingHistory(false);
        }
      }
    };

    loadChatHistory();
  }, [user]);

  useEffect(() => {
    if (!user || user.role === 'admin') {
      return;
    }

    const socket = initSocket();

    const handleConnect = () => {
      console.log('User connected to chat');
      setConnectionStatus('connected');
    };

    const handleDisconnect = () => {
      setConnectionStatus('disconnected');
    };

    const handleMessage = (message) => {
      setMessages(prev => {
        // Prevent duplicate messages by checking if message already exists
        const exists = prev.find(m => m.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
    };

    const handleLoadMessages = (loadedMessages) => {
      // Only set messages if we don't have chat history loaded
      if (chatHistory.length === 0) {
        const formattedMessages = loadedMessages.map(msg => ({
          id: msg.id,
          content: msg.content,
          sender: {
            id: msg.sender_id,
            name: msg.sender_name,
            role: msg.sender_role || 'user'
          },
          timestamp: msg.created_at || msg.timestamp
        }));
        setMessages(formattedMessages);
      }
    };

    // Add event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('message', handleMessage);
    socket.on('loadMessages', handleLoadMessages);

    // Join chat room as authenticated user
    socket.emit('joinChat', { user });

    return () => {
      // Remove event listeners before disconnecting
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('message', handleMessage);
      socket.off('loadMessages', handleLoadMessages);
      socket.disconnect();
      setConnectionStatus('disconnected');
    };
  }, [user, chatHistory.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Show loading while authentication is being checked
  const { loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Redirect non-authenticated users to anonymous chat
  if (!isAuthenticated) {
    return <Navigate to="/chat/anonymous" replace />;
  }

  // Redirect admin users to admin chat
  if (user?.role === 'admin') {
    return <AdminChat />;
  }



  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && user && connectionStatus === 'connected') {
      const socket = getSocket();
      
      socket.emit('sendMessage', {
        content: newMessage.trim(),
        sender: user
      });
      
      setNewMessage('');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="bg-white shadow-sm border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-secondary-400 animate-pulse' : 'bg-red-400'}`}></div>
              <h1 className="text-xl font-semibold text-gray-900">
                Live Chat dengan Admin
              </h1>
            </div>
            {chatHistory.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {chatHistory.length} pesan sebelumnya
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">{user?.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Status:</span>
              <span className={`text-sm font-medium ${
                connectionStatus === 'connected' ? 'text-secondary-600' : 'text-red-600'
              }`}>
                {connectionStatus === 'connected' ? 'Terhubung' : 'Terputus'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Chat Messages */}
        <div className="flex-1 flex flex-col min-h-0">
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loadingHistory && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Memuat riwayat chat...</span>
              </div>
            )}
            
            {!loadingHistory && messages.length === 0 && (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <div className="text-gray-400 text-6xl mb-4">💬</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Selamat datang, {user?.name}!
                  </h3>
                  <p className="text-gray-600 max-w-md">
                    Anda sekarang terhubung dengan admin STROKE CARE. 
                    Silakan kirim pesan untuk memulai percakapan.
                  </p>
                </div>
              </div>
            )}
            
            {messages.map((message) => {
              const isOwnMessage = message.sender?.id === user?.id;
              const isAdminMessage = message.sender?.role === 'admin';
              
              return (
                <div key={message.id} className={`flex ${
                  isOwnMessage ? 'justify-end' : 'justify-start'
                }`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm ${
                    isOwnMessage
                      ? 'bg-blue-600 text-white'
                      : isAdminMessage
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${
                        isOwnMessage || isAdminMessage
                          ? 'text-white/80'
                          : 'text-gray-500'
                      }`}>
                        {message.sender?.name}
                        {isAdminMessage && (
                          <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded">
                            Admin
                          </span>
                        )}
                      </span>
                      <span className={`text-xs ${
                        isOwnMessage || isAdminMessage
                          ? 'text-white/60'
                          : 'text-gray-400'
                      }`}>
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
            <form onSubmit={sendMessage} className="flex space-x-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder={connectionStatus === 'connected' ? 'Ketik pesan Anda...' : 'Menunggu koneksi...'}
                disabled={connectionStatus !== 'connected'}
                maxLength={500}
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                disabled={connectionStatus !== 'connected' || !newMessage.trim()}
              >
                Kirim
              </button>
            </form>
            
            {connectionStatus !== 'connected' && (
              <div className="mt-2 text-center">
                <span className="text-sm text-red-600">
                  Koneksi terputus. Mencoba menyambung kembali...
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-72 bg-white border-l border-gray-200 p-4 flex-shrink-0 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-4">Informasi Chat</h3>
          
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-1">Status Koneksi</h4>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-secondary-400' : 'bg-red-400'
                }`}></div>
                <p className="text-sm text-blue-800">
                  {connectionStatus === 'connected' ? 'Terhubung dengan admin' : 'Koneksi terputus'}
                </p>
              </div>
            </div>
            
            <div className="p-3 bg-secondary-50 rounded-lg">
              <h4 className="text-sm font-medium text-secondary-900 mb-1">Akun Anda</h4>
              <p className="text-sm text-secondary-800">
                {user?.name} ({user?.email})
              </p>
            </div>
            
            {chatHistory.length > 0 && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-900 mb-1">Riwayat Chat</h4>
                <p className="text-sm text-yellow-800">
                  {chatHistory.length} pesan sebelumnya dimuat
                </p>
              </div>
            )}
            
            {!loadingHistory && chatHistory.length === 0 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-1">Chat Baru</h4>
                <p className="text-sm text-gray-700">
                  Ini adalah chat pertama Anda dengan admin
                </p>
              </div>
            )}
            
            <div className="p-3 bg-indigo-50 rounded-lg">
              <h4 className="text-sm font-medium text-indigo-900 mb-1">Tips Chat</h4>
              <ul className="text-sm text-indigo-800 space-y-1">
                <li>• Jelaskan pertanyaan dengan detail</li>
                <li>• Admin akan merespons secepatnya</li>
                <li>• Riwayat chat akan tersimpan</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveChat;