import Head from 'next/head';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import SportFiveLogo from './SportFiveLogo';
import ThemeToggle from './ui/ThemeToggle';

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
  
  // Load last sync time from server on mount
  useEffect(() => {
    const fetchLastSyncTime = async () => {
      try {
        const res = await fetch('/api/last-sync-time');
        const data = await res.json();
        if (data.lastSyncTime) {
          setLastSyncTime(new Date(data.lastSyncTime));
        }
      } catch (err) {
        console.warn("Error loading sync time from server:", err);
      }
    };
    fetchLastSyncTime();
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
      
      // Record successful sync time on server
      const syncRes = await fetch('/api/last-sync-time', { method: 'POST' });
      if (!syncRes.ok) {
        throw new Error('Failed to save sync time');
      }
      
      // Update local state with current time
      const syncTime = new Date();
      setLastSyncTime(syncTime);
      
      // Trigger event for other components
      window.dispatchEvent(new CustomEvent('asana-sync-completed'));
      
      setSyncMessage(data.message || 'Sync completed successfully!');
      
      // Reload page to refresh data after sync
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
    <div className="min-h-screen bg-customGray-50 dark:bg-customGray-900 text-customGray-900 dark:text-customGray-100 font-sans">
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-white dark:bg-customGray-800 shadow-sm w-full sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Dashboard Title - Left Side */}
            <div className="flex items-center space-x-4">
              <SportFiveLogo className="h-8 text-primary dark:text-primary-light" />
              <div className="flex flex-col items-start justify-center">
                <h1 className="text-xl font-semibold text-customGray-900 dark:text-customGray-100 tracking-tight">Analytics Dashboard</h1>
                <p className="text-sm font-normal text-customGray-500 dark:text-customGray-400">Performance & insights</p>
              </div>
            </div>

            {/* Right - Sync Info and Actions */}
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              {/* Sync Message */}
              {syncMessage && (
                <span className={`text-sm ${syncMessage.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                  {syncMessage}
                </span>
              )}

              {/* Last Sync Time */}
              {lastSyncTime && (
                <span className="text-xs text-customGray-600 dark:text-customGray-400">
                  Last sync {format(lastSyncTime, 'MMM dd, HH:mm')}
                </span>
              )}

              {/* Sync Button */}
              {showSync && (
                <button
                  onClick={() => {
                    console.log("Sync button clicked in Layout - using direct handler");
                    handleSyncNow();
                  }}
                  disabled={isSyncing}
                  className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-customGray-700 dark:text-customGray-200 bg-white dark:bg-customGray-700 hover:bg-customGray-50 dark:hover:bg-customGray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isSyncing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Syncing...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Sync Assets
                    </>
                  )}
                </button>
              )}

              {/* Sign Out Button */}
              {showLogout && (
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-customGray-700 hover:bg-customGray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-customGray-500 transition-colors duration-200"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="w-full py-10 px-4 sm:px-6 lg:px-10">
        {children}
      </main>

      <footer className="bg-transparent mt-12 py-6">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-customGray-500 dark:text-customGray-400 text-sm">
              © {new Date().getFullYear()} Leon Hartmann
          </div>
      </footer>
    </div>
  );
}
