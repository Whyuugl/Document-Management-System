import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Documents from './pages/Documents';
import UploadDocument from './pages/UploadDocument';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Categories from './pages/Categories';
import Folders from './pages/Folders';
import Activity from './pages/Activity';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

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
        console.log('User not authenticated, showing login page');
      }
    } catch (error) {
      console.error('Auth check error:', error);
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

  if (isLoading) {
    return (
      <div className={`theme-${theme} app-shell flex min-h-screen items-center justify-center bg-gray-50`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} theme={theme} onThemeToggle={toggleTheme} />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'documents':
        return <Documents onNavigate={setCurrentPage} />;
      case 'upload':
        return <UploadDocument onNavigate={setCurrentPage} />;
      case 'reports':
        return <Reports />;
      case 'categories':
        return <Categories />;
      case 'folders':
        return <Folders />;
      case 'activity':
        return <Activity />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };
  return (
    <div className={`theme-${theme} app-shell flex h-screen overflow-hidden`}>
      <Sidebar onPageChange={setCurrentPage} currentPage={currentPage} />

      <div className="flex min-w-0 flex-1 flex-col bg-slate-50">
        <Header onLogout={handleLogout} user={user} theme={theme} onThemeToggle={toggleTheme} onNavigate={setCurrentPage} />

        <main className="flex-1 overflow-y-auto px-6 py-6">
          {renderCurrentPage()}
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default App;
