import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const validateForm = (): boolean => {
    const { name, email, password, confirmPassword } = formData;
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('All fields are required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const { confirmPassword, ...registerData } = formData;

    try {
      const response = await authAPI.register(registerData);
      const backendResponse = response.data;

      if (backendResponse.success) {
        const { token, user } = backendResponse.data;
        login(token, user);
        
        setSuccess('Account created successfully! Redirecting...');
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        setError(backendResponse.message || 'Registration failed.');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      const msg = err.response?.data?.message || err.message || 'An unexpected error occurred.';
      setError(msg);
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
            INITIALIZE_USER
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-400 font-mono">
            Register new credentials
          </p>
        </div>

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded text-green-700 dark:text-green-400 font-mono text-sm">
            SUCCESS: {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded text-red-700 dark:text-red-400 font-mono text-sm">
            ERROR: {error}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="sr-only">Full Name</label>
              <input 
                name="name" 
                type="text" 
                required 
                className="appearance-none block w-full px-3 py-3 border border-gray-300 dark:border-slate-700 rounded-md placeholder-gray-500 dark:placeholder-slate-500 text-gray-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-indigo-500 dark:focus:ring-green-500 focus:border-indigo-500 dark:focus:border-green-500 sm:text-sm font-mono transition-colors" 
                placeholder="Full_Name" 
                value={formData.name} 
                onChange={handleChange} 
              />
            </div>
            <div>
              <label className="sr-only">Email Address</label>
              <input 
                name="email" 
                type="email" 
                required 
                className="appearance-none block w-full px-3 py-3 border border-gray-300 dark:border-slate-700 rounded-md placeholder-gray-500 dark:placeholder-slate-500 text-gray-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-indigo-500 dark:focus:ring-green-500 focus:border-indigo-500 dark:focus:border-green-500 sm:text-sm font-mono transition-colors" 
                placeholder="Email_Address" 
                value={formData.email} 
                onChange={handleChange} 
              />
            </div>
            <div>
              <label className="sr-only">Password</label>
              <input 
                name="password" 
                type="password" 
                required 
                className="appearance-none block w-full px-3 py-3 border border-gray-300 dark:border-slate-700 rounded-md placeholder-gray-500 dark:placeholder-slate-500 text-gray-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-indigo-500 dark:focus:ring-green-500 focus:border-indigo-500 dark:focus:border-green-500 sm:text-sm font-mono transition-colors" 
                placeholder="Password" 
                value={formData.password} 
                onChange={handleChange} 
              />
            </div>
            <div>
              <label className="sr-only">Confirm Password</label>
              <input 
                name="confirmPassword" 
                type="password" 
                required 
                className="appearance-none block w-full px-3 py-3 border border-gray-300 dark:border-slate-700 rounded-md placeholder-gray-500 dark:placeholder-slate-500 text-gray-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-indigo-500 dark:focus:ring-green-500 focus:border-indigo-500 dark:focus:border-green-500 sm:text-sm font-mono transition-colors" 
                placeholder="Confirm_Password" 
                value={formData.confirmPassword} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-indigo-600 dark:bg-green-600 hover:bg-indigo-700 dark:hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono uppercase tracking-wider transition-all shadow-lg dark:shadow-green-900/50"
          >
            {loading ? 'REGISTERING...' : 'CREATE_ACCOUNT'}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm font-mono text-gray-600 dark:text-slate-400">
            Already have credentials?{' '}
            <Link to="/login" className="font-bold text-indigo-600 dark:text-green-500 hover:text-indigo-500 dark:hover:text-green-400 underline">
              Sign_In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;