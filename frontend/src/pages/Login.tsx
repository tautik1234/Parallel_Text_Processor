import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(formData);
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        login(token, user);
        navigate('/dashboard');
      } else {
        setError('Login failed. Please check credentials.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-10 rounded-xl shadow-xl dark:shadow-[0_0_20px_rgba(74,222,128,0.1)] border border-gray-200 dark:border-slate-800">
        
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-indigo-600 dark:bg-green-600 rounded flex items-center justify-center text-white font-mono font-bold text-xl shadow-lg dark:shadow-green-500/30">
            &gt;_
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white font-mono tracking-tight">
            SYSTEM_LOGIN
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-400 font-mono">
            Enter credentials to access terminal
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded text-red-700 dark:text-red-400 font-mono text-sm">
            ERROR: {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-t-md relative block w-full px-3 py-3 border border-gray-300 dark:border-slate-700 placeholder-gray-500 dark:placeholder-slate-500 text-gray-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-indigo-500 dark:focus:ring-green-500 focus:border-indigo-500 dark:focus:border-green-500 focus:z-10 sm:text-sm font-mono transition-colors"
                placeholder="Email_Address"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-b-md relative block w-full px-3 py-3 border border-gray-300 dark:border-slate-700 placeholder-gray-500 dark:placeholder-slate-500 text-gray-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-indigo-500 dark:focus:ring-green-500 focus:border-indigo-500 dark:focus:border-green-500 focus:z-10 sm:text-sm font-mono transition-colors"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-indigo-600 dark:bg-green-600 hover:bg-indigo-700 dark:hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono uppercase tracking-wider transition-all shadow-lg dark:shadow-green-900/50"
            >
              {loading ? 'AUTHENTICATING...' : 'ACCESS_TERMINAL'}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm font-mono text-gray-600 dark:text-slate-400">
            New user?{' '}
            <Link to="/signup" className="font-bold text-indigo-600 dark:text-green-500 hover:text-indigo-500 dark:hover:text-green-400 underline">
              Create_Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;