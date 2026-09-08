import React, { useEffect, useState } from 'react';

const Header = ({ onLogout, user, theme, onThemeToggle, onNavigate }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const currentDate = new Date();
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  const formattedDate = currentDate.toLocaleDateString('id-ID', options);

  const handleLogout = () => {
    onLogout();
  };

  useEffect(() => {
    fetch('/api/notifications', { credentials: 'include' })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) setNotifications(data.data);
      })
      .catch((error) => console.error('Notification fetch error:', error));
  }, []);

  return (
    <header className="app-header border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Workspace Control</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">Selamat datang, {user?.username || 'User'}</h2>
          <p className="text-sm text-slate-500">{formattedDate}</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((current) => !current)}
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100"
              aria-label="Notifications"
              title="Notifications"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6v-5a7 7 0 0 0-5-6.71V3a2 2 0 1 0-4 0v1.29A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2Z" />
              </svg>
              {notifications.length > 0 && (
                <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-orange-500 px-1.5 py-0.5 text-xs font-bold text-white">{notifications.length}</span>
              )}
            </button>

            {showNotifications && (
              <div className="fixed right-6 top-20 z-50 w-[min(calc(100vw-2rem),24rem)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-200 px-4 py-3">
                  <p className="text-sm font-bold text-slate-950">Notifications</p>
                  <p className="text-xs text-slate-500">{notifications.length} current items</p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications</p>
                  ) : notifications.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setShowNotifications(false);
                        onNavigate('documents');
                      }}
                      className="block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50"
                    >
                      <p className="text-xs font-semibold uppercase text-blue-700">{item.type.replaceAll('_', ' ')}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.message}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onThemeToggle}
            className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              {theme === 'dark' ? (
                <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm0 4a1 1 0 0 1-1-1v-1a1 1 0 1 1 2 0v1a1 1 0 0 1-1 1Zm0-18a1 1 0 0 1-1-1V2a1 1 0 1 1 2 0v1a1 1 0 0 1-1 1Zm10 8a1 1 0 0 1-1 1h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1ZM4 12a1 1 0 0 1-1 1H2a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1Zm14.95 6.95a1 1 0 0 1-1.41 0l-.71-.71a1 1 0 0 1 1.41-1.41l.71.71a1 1 0 0 1 0 1.41ZM7.17 7.17a1 1 0 0 1-1.41 0l-.71-.71a1 1 0 1 1 1.41-1.41l.71.71a1 1 0 0 1 0 1.41Zm11.78-2.12a1 1 0 0 1 0 1.41l-.71.71a1 1 0 0 1-1.41-1.41l.71-.71a1 1 0 0 1 1.41 0ZM7.17 16.83a1 1 0 0 1 0 1.41l-.71.71a1 1 0 0 1-1.41-1.41l.71-.71a1 1 0 0 1 1.41 0Z" />
              ) : (
                <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3a7 7 0 1 0 11.5 11.5Z" />
              )}
            </svg>
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-right">
            <p className="text-sm font-medium text-slate-900">{user?.username || 'User'}</p>
            <p className="text-xs capitalize text-slate-500">{user?.role || 'user'}</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-slate-50 transition-colors hover:bg-slate-100"
            >
              <svg className="h-5 w-5 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </button>

            {showDropdown && (
              <div className="fixed right-6 top-20 z-50 w-48 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                <button
                  onClick={handleLogout}
                  className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100"
                >
                  <div className="flex items-center">
                    <svg className="mr-2 h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h7v2H5v14h7v2zm11-4l-1.375-1.45l2.55-2.55H9v-2h8.175l-2.55-2.55L16 7l5 5z"/>
                    </svg>
                    Logout
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {(showDropdown || showNotifications) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowDropdown(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;
