import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();

  const menuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: '📊', adminOnly: false },
    // { path: '/chat', name: 'Live Chat', icon: '💬', adminOnly: false },
    { path: '/materials', name: 'Materi', icon: '📚', adminOnly: false },
    { path: '/users', name: 'Users', icon: '👥', adminOnly: true },
    { path: '/screening-reports', name: 'Laporan Skrining', icon: '🏥', adminOnly: true },
    { path: '/health-notes', name: 'Catatan Kesehatan', icon: '📋', adminOnly: true },
    // { path: '/chat-history', name: 'Riwayat Chat', icon: '📝', adminOnly: true },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !item.adminOnly || (item.adminOnly && isAdmin)
  );

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-700">STROKE CARE Admin</h1>
          <p className="text-sm text-gray-600 mt-1">Konseling Dashboard</p>
        </div>

        <nav className="mt-6">
          {filteredMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`
                flex items-center px-6 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors
                ${location.pathname === item.path ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500' : ''}
              `}
            >
              <span className="text-lg mr-3">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;