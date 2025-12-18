import React from 'react';

const Header = ({ onMenuClick }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="ml-4 text-lg font-semibold text-gray-900">Dashboard</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5 5-5h-5m-6 10V7a3 3 0 013-3h4a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;