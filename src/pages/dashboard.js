import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { withAuth } from '@/lib/auth'; // HOC for page protection
import FilterPanel from '@/components/FilterPanel';
import TaskTable from '@/components/TaskTable';

function DashboardPage({ user }) { // User prop is passed by withAuth
  const [tasks, setTasks] = useState([]);
  const [distinctValues, setDistinctValues] = useState({ brands: [], assets: [], requesters: [] });
  const [filters, setFilters] = useState({ brand: '', asset: '', requester: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch distinct values for filters on mount
  useEffect(() => {
    const fetchDistinct = async () => {
      try {
        setError('');
        const res = await fetch('/api/tasks?distinct=true');
        if (!res.ok) {
          throw new Error(`Failed to fetch distinct values: ${res.statusText}`);
        }
        const data = await res.json();
        setDistinctValues(data);
      } catch (err) {
        console.error('Error fetching distinct values:', err);
        setError('Could not load filter options. Please try refreshing.');
      }
    };
    fetchDistinct();
  }, []);

  // Function to fetch tasks based on current filters
  const fetchTasks = useCallback(async (currentFilters) => {
    setIsLoading(true);
    setError('');
    
    const queryParams = new URLSearchParams();
    if (currentFilters.brand) queryParams.append('brand', currentFilters.brand);
    if (currentFilters.asset) queryParams.append('asset', currentFilters.asset);
    if (currentFilters.requester) queryParams.append('requester', currentFilters.requester);
    
    const url = `/api/tasks?${queryParams.toString()}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `Failed to fetch tasks: ${res.statusText}`);
      }
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.message || 'Could not load tasks. Please check connection or filters.');
      setTasks([]); // Clear tasks on error
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies needed as it uses the passed currentFilters

  // Fetch tasks initially when component mounts
  useEffect(() => {
    fetchTasks(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Handler for applying filters from the panel
  const handleApplyFilters = (newFilters = filters) => {
    fetchTasks(newFilters);
  };

  return (
    <>
      <Head>
        <title>Dashboard - Asana Tasks</title>
      </Head>
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Asana Tasks</h2>
        
        <FilterPanel 
          filters={filters} 
          setFilters={setFilters} 
          distinctValues={distinctValues} 
          onApplyFilters={handleApplyFilters} 
        />

        <TaskTable 
          tasks={tasks} 
          isLoading={isLoading} 
          error={error} 
        />
      </div>
    </>
  );
}

// Protect the page using the withAuth HOC
// No specific getServerSideProps needed here unless you want pre-fetched data
export const getServerSideProps = withAuth(); 

export default DashboardPage; 