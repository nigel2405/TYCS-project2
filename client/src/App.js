import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import PrivateRoute from './components/routing/PrivateRoute';
import FloatingBlobs from './components/common/FloatingBlobs';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import ProviderDashboard from './pages/provider/ProviderDashboard';
import ConsumerMarketplace from './pages/consumer/ConsumerMarketplace';
import SessionDetails from './pages/sessions/SessionDetails';
import AdminDashboard from './pages/admin/AdminDashboard';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <div className="min-h-screen relative overflow-hidden">
          <FloatingBlobs />
          <Navbar />
          <div className="relative z-10 pt-20 min-h-[calc(100vh-80px)]">
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            
            <Route
              path="/provider"
              element={
                <PrivateRoute allowedRoles={['provider', 'admin']}>
                  <ProviderDashboard />
                </PrivateRoute>
              }
            />
            
            <Route
              path="/consumer"
              element={
                <PrivateRoute allowedRoles={['consumer', 'admin']}>
                  <ConsumerMarketplace />
                </PrivateRoute>
              }
            />
            
            <Route
              path="/sessions/:id"
              element={
                <PrivateRoute>
                  <SessionDetails />
                </PrivateRoute>
              }
            />
            
            <Route
              path="/admin"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
