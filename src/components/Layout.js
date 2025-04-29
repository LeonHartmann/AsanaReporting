import Head from 'next/head';
import { useRouter } from 'next/router';
import { format } from 'date-fns';

export default function Layout({ children, title = 'SPORTFIVE', isSyncing = false, lastSyncTime = null, syncMessage = '', onSyncNow = null }) {
  const router = useRouter();

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

  // Only show logout button if not on the login page
  const showLogout = router.pathname !== '/';

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
            </div>
            <div className="flex items-center space-x-4">
              {onSyncNow && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={onSyncNow}
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