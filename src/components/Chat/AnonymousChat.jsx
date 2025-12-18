import { useState, useEffect, useRef } from 'react';
import { getSocket, initSocket } from '../../utils/socket';

const AnonymousChat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [anonymousName, setAnonymousName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showNameModal, setShowNameModal] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const messagesEndRef = useRef(null);
  const [anonymousUser, setAnonymousUser] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isConnected || !anonymousUser) return;

    const socket = initSocket();

    const handleConnect = () => {
      console.log('Anonymous user connected to chat');
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
      const formattedMessages = loadedMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: {
          id: msg.sender_id,
          name: msg.sender_name,
          role: msg.sender_role || 'anonymous'
        },
        timestamp: msg.created_at || msg.timestamp
      }));
      setMessages(formattedMessages);
    };

    // Add event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('message', handleMessage);
    socket.on('loadMessages', handleLoadMessages);

    // Join chat as anonymous user
    socket.emit('joinAnonymousChat', { user: anonymousUser });

    return () => {
      // Remove event listeners before disconnecting
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('message', handleMessage);
      socket.off('loadMessages', handleLoadMessages);
      socket.disconnect();
    };
  }, [isConnected, anonymousUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAnonymousSubmit = (e) => {
    e.preventDefault();
    if (anonymousName.trim()) {
      const user = {
        id: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: anonymousName.trim(),
        role: 'anonymous'
      };
      setAnonymousUser(user);
      setIsConnected(true);
      setShowNameModal(false);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && isConnected) {
      const socket = getSocket();
      
      socket.emit('sendAnonymousMessage', {
        content: newMessage.trim(),
        sender: anonymousUser
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

  const startNewChat = () => {
    setMessages([]);
    setAnonymousName('');
    setAnonymousUser(null);
    setIsConnected(false);
    setShowNameModal(true);
    setConnectionStatus('disconnected');
  };

  if (showNameModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Chat Anonim
            </h2>
            <p className="text-gray-600">
              Mulai percakapan dengan admin STROKE CARE secara anonim
            </p>
          </div>
          
          <form onSubmit={handleAnonymousSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama untuk chat
              </label>
              <input
                type="text"
                value={anonymousName}
                onChange={(e) => setAnonymousName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Masukkan nama Anda"
                required
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">
                Nama ini akan terlihat oleh admin saat chat
              </p>
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Mulai Chat Anonim
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Chat ini bersifat anonim. Admin dapat melihat nama yang Anda berikan, 
              namun identitas asli Anda tetap terlindungi.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-secondary-400 rounded-full animate-pulse"></div>
              <h1 className="text-xl font-semibold text-gray-900">
                Chat Anonim dengan Admin
              </h1>
            </div>
            <span className="text-sm text-gray-500">
              sebagai: <span className="font-medium text-gray-700">{anonymousUser?.name}</span>
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Status:</span>
              <span className={`text-sm font-medium ${
                connectionStatus === 'connected' ? 'text-secondary-600' : 'text-red-600'
              }`}>
                {connectionStatus === 'connected' ? 'Terhubung' : 'Terputus'}
              </span>
            </div>
            
            <button
              onClick={startNewChat}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Chat Baru
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <div className="text-gray-400 text-6xl mb-4">💬</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Selamat datang, {anonymousUser?.name}!
                  </h3>
                  <p className="text-gray-600 max-w-md">
                    Anda sekarang terhubung dengan admin STROKE CARE. 
                    Silakan kirim pesan untuk memulai percakapan.
                  </p>
                </div>
              </div>
            )}
            
            {messages.map((message) => {
              const isOwnMessage = message.sender?.id === anonymousUser?.id;
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
                        {message.sender?.role === 'anonymous' && !isOwnMessage && (
                          <span className="ml-2 text-xs bg-gray-400 text-white px-2 py-0.5 rounded">
                            Guest
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

        {/* Info Sidebar */}
        <div className="w-72 bg-white border-l border-gray-200 p-4 flex-shrink-0 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-4">Informasi Chat</h3>
          
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-1">Mode Anonim</h4>
              <p className="text-sm text-blue-800">
                Chat ini bersifat anonim. Identitas asli Anda tidak akan terlihat.
              </p>
            </div>
            
            <div className="p-3 bg-secondary-50 rounded-lg">
              <h4 className="text-sm font-medium text-secondary-900 mb-1">Waktu Respons</h4>
              <p className="text-sm text-secondary-800">
                Admin biasanya merespons dalam beberapa menit saat jam kerja.
              </p>
            </div>
            
            <div className="p-3 bg-yellow-50 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-900 mb-1">Tips Chat</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Jelaskan pertanyaan Anda dengan jelas</li>
                <li>• Berikan konteks yang diperlukan</li>
                <li>• Bersabar menunggu respons admin</li>
              </ul>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-1">Privasi</h4>
              <p className="text-sm text-gray-700">
                Pesan chat dapat disimpan untuk keperluan layanan pelanggan.
              </p>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={startNewChat}
              className="w-full text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              🔄 Mulai Chat Baru
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnonymousChat;
