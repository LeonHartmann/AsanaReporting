import { useState } from 'react';
import { useRouter } from 'next/router';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push('/dashboard'); // Redirect to dashboard on successful login
      } else {
        const data = await res.json();
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-customGray-50 dark:bg-customGray-900 font-sans px-4"> {/* Use min-h-screen and theme bg */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-customGray-800 p-8 rounded-xl shadow-xl w-full max-w-md" /* Consistent styling, max-w-md */
      >
        <h2 className="text-3xl font-bold mb-8 text-center text-customGray-900 dark:text-customGray-100">Login</h2> {/* Increased size/margin */ }
        {error && (
          <div className="bg-error/10 border border-error/40 text-error px-4 py-3 rounded-lg relative mb-6" role="alert"> {/* Updated error style */}
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <div className="mb-5"> {/* Adjusted margin */}
          <label
            htmlFor="username"
            className="block text-sm font-medium text-customGray-700 dark:text-customGray-300 mb-1.5" /* Updated styles */
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="shadow-sm appearance-none border border-customGray-300 dark:border-customGray-600 rounded-md w-full py-2.5 px-3 text-customGray-900 dark:text-customGray-100 bg-white dark:bg-customGray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" /* Updated styles */
          />
        </div>
        <div className="mb-8"> {/* Increased margin */}
          <label
            htmlFor="password"
            className="block text-sm font-medium text-customGray-700 dark:text-customGray-300 mb-1.5" /* Updated styles */
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="shadow-sm appearance-none border border-customGray-300 dark:border-customGray-600 rounded-md w-full py-2.5 px-3 text-customGray-900 dark:text-customGray-100 bg-white dark:bg-customGray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" /* Updated styles */
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-150" /* Updated styles */
          >
            {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
               'Sign In'
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 