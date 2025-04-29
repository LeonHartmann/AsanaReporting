import '@/styles/globals.css';
import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  // State for sync props, maintained at app level but only used for dashboard
  const [syncProps, setSyncProps] = useState({
    isSyncing: false,
    lastSyncTime: null,
    syncMessage: '',
    onSyncNow: null
  });

  // Effect to check if we're on the dashboard page and set up sync props
  useEffect(() => {
    // Check if this component is the dashboard (has syncState property)
    const isDashboard = Component.syncState?.isSyncAvailable;
    
    if (isDashboard) {
      // Create handlers that will be passed to Layout
      // These handlers will connect to the actual Dashboard component instance when rendered
      let dashboardInstance = null;

      // Set up the sync props with the handler
      setSyncProps({
        isSyncing: false, // Will be updated by dashboard component
        lastSyncTime: null, // Will be updated by dashboard component 
        syncMessage: '',
        onSyncNow: () => {
          // Call the dashboard's sync function
          console.log("Sync button clicked, dashboard instance:", dashboardInstance);
          if (dashboardInstance) {
            console.log("Attempting to call handleSyncNow");
            dashboardInstance.handleSyncNow();
          } else {
            console.error("Dashboard instance not available for sync");
          }
        }
      });

      // Expose a way for the Dashboard component to register itself and update sync status
      window.__DASHBOARD_SYNC__ = {
        register: (instance) => {
          dashboardInstance = instance;
        },
        updateStatus: (status) => {
          setSyncProps(prev => ({ ...prev, ...status }));
        }
      };
      
      // Cleanup on unmount or when changing pages
      return () => {
        window.__DASHBOARD_SYNC__ = null;
      };
    } else {
      // Reset sync props when not on dashboard
      setSyncProps({
        isSyncing: false,
        lastSyncTime: null,
        syncMessage: '',
        onSyncNow: null
      });
    }
  }, [Component]); // Re-run if the page component changes

  return (
    <Layout 
      isSyncing={syncProps.isSyncing}
      lastSyncTime={syncProps.lastSyncTime}
      syncMessage={syncProps.syncMessage}
      onSyncNow={syncProps.onSyncNow}
    >
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp; 