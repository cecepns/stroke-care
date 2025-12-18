import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './pages/Dashboard';
import Materials from './pages/Materials';
import Users from './pages/Users';
import ChatHistory from './pages/ChatHistory';
import ScreeningReports from './pages/ScreeningReports';
import HealthNotesReports from './pages/HealthNotesReports';
import LiveChat from './components/Chat/LiveChat';
import AnonymousChat from './components/Chat/AnonymousChat';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={<LiveChat />} />
        <Route path="/chat/anonymous" element={<AnonymousChat />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/materials" element={
          <ProtectedRoute>
            <Layout>
              <Materials />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/users" element={
          <ProtectedRoute>
            <Layout>
              <Users />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/chat-history" element={
          <ProtectedRoute>
            <Layout>
              <ChatHistory />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/screening-reports" element={
          <ProtectedRoute>
            <Layout>
              <ScreeningReports />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/health-notes" element={
          <ProtectedRoute>
            <Layout>
              <HealthNotesReports />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;