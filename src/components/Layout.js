import Head from 'next/head';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';

export default function Layout({ children, title = 'SPORTFIVE' }) {
  const router = useRouter();
  
  // Only show logout button and sync options if not on the login page
  const showLogout = router.pathname !== '/';
  // Only show sync button on dashboard page
  const showSync = router.pathname === '/dashboard';
  
  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncMessage, setSyncMessage] = useState('');
  
  // Load last sync time from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedSyncTime = localStorage.getItem('lastAsanaSyncTime');
        if (storedSyncTime) {
          setLastSyncTime(new Date(storedSyncTime));
        }
      } catch (err) {
        console.warn("Error loading sync time from localStorage:", err);
      }
    }
  }, []);
  
  // Direct sync handler
  const handleSyncNow = async () => {
    if (isSyncing) return; // Prevent multiple clicks
    
    console.log("Layout: Starting direct sync...");
    setIsSyncing(true);
    setSyncMessage('');
    
    try {
      const res = await fetch('/api/sync-asana', { method: 'GET' });
      console.log("Sync API response status:", res.status);
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || `Sync failed with status: ${res.status}`);
      }
      
      // Record successful sync time
      const syncTime = new Date();
      setLastSyncTime(syncTime);
      
      // Store in localStorage and trigger event for other components
      try {
        localStorage.setItem('lastAsanaSyncTime', syncTime.toISOString());
        window.dispatchEvent(new CustomEvent('asana-sync-completed'));
      } catch (storageErr) {
        console.warn("Error storing sync time:", storageErr);
      }
      
      setSyncMessage(data.message || 'Sync completed successfully!');
      
      // Reload page to refresh data after sync (optional, can be removed if not desired)
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (err) {
      console.error("Sync error:", err);
      setSyncMessage(`Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth', { method: 'DELETE' });
      if (res.ok) {
        router.push('/'); // Redirect to login page
      } else {
        console.error('Logout failed:', await res.text());
        alert('Logout failed. Please try again.'); // Simple error feedback
      }
    } catch (error) {
      console.error('Error during logout:', error);
      alert('An error occurred during logout.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <nav className="w-full mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                SPORTFIVE
              </h1>
              {/* Show sync message if there is one */}
              {syncMessage && (
                <span className={`ml-4 text-sm ${syncMessage.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                  {syncMessage}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {showSync && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      console.log("Sync button clicked in Layout - using direct handler");
                      handleSyncNow();
                    }}
                    disabled={isSyncing}
                    className="px-3 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isSyncing ? 'Syncing...' : 'Sync Asana'}
                  </button>
                  {lastSyncTime && (
                     <span className="text-xs text-gray-500 dark:text-gray-400 hidden md:inline">
                       Last: {format(lastSyncTime, 'Pp')}
                     </span>
                   )}
                </div>
              )}
              {showLogout && (
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </nav>
      </header>

      <main className="w-full">
        <div className="w-full mx-auto py-4 px-2 sm:px-4 lg:px-6">
          {children}
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-800 mt-6 py-4">
          <div className="w-full mx-auto px-2 sm:px-4 lg:px-6 text-center text-gray-500 dark:text-gray-400 text-sm">
              © {new Date().getFullYear()} Leon Hartmann
          </div>
      </footer>
    </div>
  );
} 