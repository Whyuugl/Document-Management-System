import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ArsipKependudukan from './pages/ArsipKependudukan';
import TambahArsip from './pages/TambahArsip';
import Laporan from './pages/Laporan';
import Pengaturan from './pages/Pengaturan';
import TestConnection from './pages/TestConnection';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
          setIsLoggedIn(true);
        }
      } else {
        // If 401, user is not logged in, which is fine
        console.log('User not authenticated, showing login page');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Don't show error for auth check, just proceed to login
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsLoggedIn(false);
      setCurrentPage('dashboard');
    }
  };

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show login page
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // Function to render current page
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'arsip':
        return <ArsipKependudukan />;
      case 'tambah':
        return <TambahArsip />;
      case 'laporan':
        return <Laporan />;
      case 'pengaturan':
        return <Pengaturan />;
      case 'test-connection':
        return <TestConnection />;
      default:
        return <Dashboard />;
    }
  };



  // If logged in, show dashboard
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar onPageChange={setCurrentPage} currentPage={currentPage} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0" style={{ background: 'linear-gradient(180deg, #5D71E2 39.9%, #333E7C 100%)' }}>
        {/* Header */}
        <Header onLogout={handleLogout} user={user} />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderCurrentPage()}
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}

export default App;
