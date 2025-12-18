import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const ChatHistory = () => {
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (isAdmin) {
      fetchChatRooms();
    }
  }, [isAdmin]);

  const fetchChatRooms = async () => {
    try {
      const response = await api.get('/chat-history');
      setChatRooms(response.data);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (roomId) => {
    try {
      const response = await api.get(`/chat-history/${roomId}/messages`);
      setMessages(response.data);
      setSelectedRoom(roomId);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus room chat ini?')) {
      try {
        await api.delete(`/chat-history/${roomId}`);
        fetchChatRooms();
        if (selectedRoom === roomId) {
          setSelectedRoom(null);
          setMessages([]);
        }
      } catch (error) {
        console.error('Error deleting chat room:', error);
        alert('Gagal menghapus room chat');
      }
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('id-ID');
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-600 mt-2">Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Chat Rooms List */}
      <div className="w-1/3 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Riwayat Chat</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-y-auto h-full">
            {chatRooms.map((room) => (
              <div
                key={room.id}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedRoom === room.id ? 'bg-primary-50 border-primary-200' : ''
                }`}
                onClick={() => fetchMessages(room.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {room.user_name || 'Anonymous User'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Messages: {room.message_count}
                    </p>
                    <p className="text-xs text-gray-500">
                      Last activity: {formatTime(room.last_message_at)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRoom(room.id);
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Hapus room"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            
            {chatRooms.length === 0 && (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada riwayat chat</h3>
                <p className="text-gray-500">Chat room akan muncul di sini setelah ada aktivitas.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            <div className="p-4 bg-white border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Chat dengan {chatRooms.find(r => r.id === selectedRoom)?.user_name || 'User'}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="flex justify-start">
                  <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-white border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-500">
                        {message.sender_name}
                        {message.sender_role === 'admin' && (
                          <span className="ml-1 text-xs bg-accent-500 text-white px-1 rounded">
                            Admin
                          </span>
                        )}
                        {message.sender_role === 'anonymous' && (
                          <span className="ml-1 text-xs bg-gray-400 text-white px-1 rounded">
                            Guest
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900">{message.content}</p>
                  </div>
                </div>
              ))}
              
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Belum ada pesan di room ini.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Pilih room chat</h3>
              <p className="text-gray-500">Pilih room dari daftar di sebelah kiri untuk melihat pesan.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistory;