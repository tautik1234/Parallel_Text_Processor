import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    // 1. Navigate to Home FIRST.
    // This starts the process of unmounting the ProtectedLayout.
    navigate('/');
    
    // 2. Delay the logout slightly (50ms).
    // This ensures we are safely ON the Home page (which is public)
    // BEFORE we actually clear the credentials.
    // This prevents the ProtectedLayout from catching us and sending us to Login.
    setTimeout(() => {
      logout();
    }, 50);
  };

  const isActive = (path: string) => {
    return location.pathname === path 
      ? 'text-green-400 border-b-2 border-green-400' 
      : 'text-gray-400 hover:text-green-300 transition-colors';
  };

  return (
    <nav className="bg-slate-900 border-b border-green-900/30 shadow-sm">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo - Terminal Style */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex-shrink-0 flex items-center gap-2 group">
              <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center text-white font-mono font-bold text-lg group-hover:animate-pulse">
                &gt;_
              </div>
              <span className="text-green-400 text-lg font-mono font-bold tracking-tighter">
                TEXT_PROCESSOR
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-8 font-mono text-sm">
                <Link to="/dashboard" className={`${isActive('/dashboard')} pb-1`}>./dashboard</Link>
                <Link to="/history" className={`${isActive('/history')} pb-1`}>./history</Link>
              </div>
            </div>
          </div>

          {/* Right Side: User Info */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-gray-200 text-xs font-mono font-bold uppercase">{user?.name}</span>
                  <span className="text-gray-500 text-[10px] font-mono">{user?.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="border border-red-900/50 text-red-400 hover:bg-red-900/20 px-3 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer"
                >
                  EXIT
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </nav>
  );
};

export default Navbar;