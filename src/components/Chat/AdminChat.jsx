import { useState, useEffect, useRef } from 'react';
import { getSocket, initSocket } from '../../utils/socket';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const AdminChat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [anonymousUsers, setAnonymousUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'anonymous'
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load available users and active chats
  useEffect(() => {
    const loadUsersAndChats = async () => {
      setLoadingUsers(true);
      try {
        // Load registered users
        const usersResponse = await api.get('/chat/available-users');
        setAvailableUsers(usersResponse.data);

        // Load active chat users (anonymous and with history)
        const activeUsersResponse = await api.get('/chat-active-users');
        setAnonymousUsers(activeUsersResponse.data);
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    if (user?.role === 'admin') {
      loadUsersAndChats();
    }
  }, [user]);

  // Socket connection for admin
  useEffect(() => {
    if (user?.role !== 'admin') return;

    const socket = initSocket();

    const handleConnect = () => {
      console.log('Admin connected to chat');
    };

    const handleMessage = (message) => {
      setMessages(prev => {
        // Prevent duplicate messages by checking if message already exists
        const exists = prev.find(m => m.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
    };

    const handleNewUserChat = (data) => {
      // Skip if the user is an admin
      if (data.user.role === 'admin') {
        return;
      }
      
      // Add new authenticated user to available users list and active chats
      setAvailableUsers(prev => {
        const exists = prev.find(u => u.id === data.user.id);
        if (!exists) {
          return [...prev, {
            ...data.user,
            message_count: 0,
            last_chat: new Date().toISOString()
          }];
        } else {
          // Update last activity
          return prev.map(u => 
            u.id === data.user.id 
              ? { ...u, last_chat: new Date().toISOString() }
              : u
          );
        }
      });
      
      // Also add to active users but mark as authenticated
      setAnonymousUsers(prev => {
        const exists = prev.find(u => 
          u.room_id === data.roomId || 
          (u.sender_id === data.user.id && !u.is_anonymous)
        );
        if (!exists) {
          return [...prev, {
            room_id: data.roomId,
            sender_name: data.user.name,
            sender_id: data.user.id,
            last_activity: new Date().toISOString(),
            is_anonymous: false // Mark as authenticated user
          }];
        } else {
          // Update existing entry
          return prev.map(u => 
            u.room_id === data.roomId || (u.sender_id === data.user.id && !u.is_anonymous)
              ? { ...u, last_activity: new Date().toISOString() }
              : u
          );
        }
      });
    };

    const handleNewAnonymousUser = (data) => {
      // Handle new anonymous user connection
      setAnonymousUsers(prev => {
        const exists = prev.find(u => u.room_id === data.roomId);
        if (!exists) {
          return [...prev, {
            room_id: data.roomId,
            sender_name: data.user.name,
            sender_id: data.user.id,
            last_activity: new Date().toISOString(),
            is_anonymous: true
          }];
        }
        return prev;
      });
    };

    // Add event listeners
    socket.on('connect', handleConnect);
    socket.on('message', handleMessage);
    socket.on('newUserChat', handleNewUserChat);
    socket.on('newAnonymousUser', handleNewAnonymousUser);

    // Join admin room
    socket.emit('joinAdminChat', { user });

    return () => {
      // Remove event listeners before disconnecting
      socket.off('connect', handleConnect);
      socket.off('message', handleMessage);
      socket.off('newUserChat', handleNewUserChat);
      socket.off('newAnonymousUser', handleNewAnonymousUser);
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async (chatUser, isAnonymous = false) => {
    setLoadingHistory(true);
    setMessages([]);
    
    try {
      let roomId;
      
      if (isAnonymous) {
        roomId = chatUser.room_id;
      } else {
        // For registered users from active list, use their room_id if available, otherwise user_id format
        if (chatUser.room_id && chatUser.room_id.startsWith('user_')) {
          roomId = chatUser.room_id;
        } else {
          roomId = `user_${chatUser.sender_id || chatUser.id}`;
        }
      }

      // Load messages for this room
      const messagesResponse = await api.get(`/chat-history/${roomId}/messages`);
      const formattedMessages = messagesResponse.data.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: {
          id: msg.sender_id,
          name: msg.sender_name,
          role: msg.sender_role
        },
        timestamp: msg.created_at,
        room_id: msg.room_id
      }));
      
      setMessages(formattedMessages);
      setSelectedChat({
        ...chatUser,
        roomId: roomId,
        isAnonymous: isAnonymous
      });
      
      // Join this specific room
      const socket = getSocket();
      socket.emit('joinChatRoom', { roomId, user });
      
    } catch (error) {
      console.error('Failed to load chat history:', error);
      // If no history, just start new chat with the same room ID
      let roomId;
      if (isAnonymous) {
        roomId = chatUser.room_id;
      } else {
        if (chatUser.room_id && chatUser.room_id.startsWith('user_')) {
          roomId = chatUser.room_id;
        } else {
          roomId = `user_${chatUser.sender_id || chatUser.id}`;
        }
      }
      setSelectedChat({
        ...chatUser,
        roomId: roomId,
        isAnonymous: isAnonymous
      });
      
      const socket = getSocket();
      socket.emit('joinChatRoom', { roomId, user });
    } finally {
      setLoadingHistory(false);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && selectedChat) {
      const socket = getSocket();
      
      socket.emit('adminSendToUser', {
        content: newMessage.trim(),
        targetRoomId: selectedChat.roomId,
        sender: user,
        targetUserId: selectedChat.sender_id || selectedChat.id // Use sender_id for active users, id for regular users
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAnonymousUsers = anonymousUsers.filter(user =>
    user.sender_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Separate authenticated and anonymous users
  const authenticatedActiveUsers = filteredAnonymousUsers.filter(user => !user.is_anonymous);
  const anonymousActiveUsers = filteredAnonymousUsers.filter(user => user.is_anonymous);

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Users Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Admin Chat Dashboard</h2>
          
          {/* Search */}
          <div className="relative mb-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Cari user..."
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'users'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Users ({filteredUsers.length})
            </button>
            <button
              onClick={() => setActiveTab('anonymous')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'anonymous'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Aktif ({authenticatedActiveUsers.length + anonymousActiveUsers.length})
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loadingUsers ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'users' && (
                <div className="p-2">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm">
                        {searchTerm ? 'Tidak ada user yang cocok' : 'Belum ada user terdaftar'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredUsers.map((chatUser) => (
                        <div
                          key={chatUser.id}
                          onClick={() => loadChatHistory(chatUser, false)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedChat?.id === chatUser.id && !selectedChat?.isAnonymous
                              ? 'bg-blue-100 border border-blue-300'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-600">
                                    {chatUser.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {chatUser.name}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {chatUser.email}
                                  </p>
                                </div>
                              </div>
                              {chatUser.last_login && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Terakhir: {formatDate(chatUser.last_login)}
                                </p>
                              )}
                            </div>
                            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'anonymous' && (
                <div className="p-2">
                  {(authenticatedActiveUsers.length === 0 && anonymousActiveUsers.length === 0) ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm">
                        {searchTerm ? 'Tidak ada user aktif yang cocok' : 'Belum ada chat aktif'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Authenticated Active Users */}
                      {authenticatedActiveUsers.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 px-1">
                            User Terdaftar Aktif ({authenticatedActiveUsers.length})
                          </h4>
                          <div className="space-y-1">
                            {authenticatedActiveUsers.map((authUser) => (
                              <div
                                key={authUser.room_id}
                                onClick={() => loadChatHistory(authUser, false)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                  selectedChat?.room_id === authUser.room_id && !selectedChat?.isAnonymous
                                    ? 'bg-blue-100 border border-blue-300'
                                    : 'hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-medium text-blue-600">
                                          {authUser.sender_name.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                          <p className="text-sm font-medium text-gray-900 truncate">
                                            {authUser.sender_name}
                                          </p>
                                          <span className="text-xs px-2 py-0.5 rounded bg-secondary-100 text-secondary-800">
                                            Terdaftar
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                          ID: {authUser.sender_id || authUser.room_id.split('_')[1]}
                                        </p>
                                      </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                      Aktif: {formatDate(authUser.last_activity)}
                                    </p>
                                  </div>
                                  <div className="w-2 h-2 bg-secondary-400 rounded-full"></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Anonymous Users */}
                      {anonymousActiveUsers.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 px-1">
                            User Anonim Aktif ({anonymousActiveUsers.length})
                          </h4>
                          <div className="space-y-1">
                            {anonymousActiveUsers.map((anonUser) => (
                              <div
                                key={anonUser.room_id}
                                onClick={() => loadChatHistory(anonUser, true)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                  selectedChat?.room_id === anonUser.room_id && selectedChat?.isAnonymous
                                    ? 'bg-orange-100 border border-orange-300'
                                    : 'hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-medium text-orange-600">
                                          {anonUser.sender_name.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                          <p className="text-sm font-medium text-gray-900 truncate">
                                            {anonUser.sender_name}
                                          </p>
                                          <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                                            Anonim
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                          ID: {anonUser.room_id.split('_')[1]}
                                        </p>
                                      </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                      Aktif: {formatDate(anonUser.last_activity)}
                                    </p>
                                  </div>
                                  <div className="w-2 h-2 bg-secondary-400 rounded-full"></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {!selectedChat ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">💬</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Pilih User untuk Memulai Chat
              </h3>
              <p className="text-gray-600 max-w-md">
                Pilih user dari daftar di sebelah kiri untuk melihat riwayat chat 
                dan memulai percakapan.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedChat.isAnonymous ? 'bg-orange-100' : 'bg-blue-100'
                  }`}>
                    <span className={`text-sm font-medium ${
                      selectedChat.isAnonymous ? 'text-orange-600' : 'text-blue-600'
                    }`}>
                      {(selectedChat.sender_name || selectedChat.name).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {selectedChat.sender_name || selectedChat.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        selectedChat.isAnonymous
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedChat.isAnonymous ? 'User Anonim' : 'User Terdaftar'}
                      </span>
                      {selectedChat.email && (
                        <span className="text-xs text-gray-500">{selectedChat.email}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedChat(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {loadingHistory ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Memuat riwayat chat...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center">
                    <div className="text-gray-400 text-5xl mb-4">💬</div>
                    <p className="text-gray-600">
                      Belum ada pesan. Mulai percakapan dengan user ini!
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message) => {
                  const isAdminMessage = message.sender?.role === 'admin';
                  
                  return (
                    <div key={message.id} className={`flex ${
                      isAdminMessage ? 'justify-end' : 'justify-start'
                    }`}>
                      <div className={`max-w-md px-4 py-3 rounded-lg ${
                        isAdminMessage
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-medium ${
                            isAdminMessage ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {message.sender?.name}
                            {message.sender?.role === 'admin' && (
                              <span className="ml-2 text-xs bg-white/20 px-1 rounded">
                                Admin
                              </span>
                            )}
                          </span>
                          <span className={`text-xs ${
                            isAdminMessage ? 'text-blue-100' : 'text-gray-400'
                          }`}>
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
              <form onSubmit={sendMessage} className="flex space-x-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Kirim pesan ke ${selectedChat.sender_name || selectedChat.name}...`}
                  maxLength={500}
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                  disabled={!newMessage.trim()}
                >
                  Kirim
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminChat;
