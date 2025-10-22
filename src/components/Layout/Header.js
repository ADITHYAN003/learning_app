import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, profile, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <span>🚀</span>
          Learning Path
        </Link>
        
        <nav className="nav">
          {user ? (
            <>
              <span className="nav-link">
                👋 Welcome, {profile?.name || user.username}
              </span>
              {profile?.step_completed === 5 && (
                <Link to="/dashboard" className="nav-link">📊 Dashboard</Link>
              )}
              <button 
                onClick={logout}
                className="btn btn-outline btn-sm"
                style={{ color: 'white', borderColor: 'white' }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="btn btn-outline btn-sm" style={{ color: 'white', borderColor: 'white' }}>
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;