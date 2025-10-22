import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // 🔹 Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // 🔹 Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const result = await login(formData.username, formData.password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      const errMsg = (result.error || '').toLowerCase();

      if (typeof result.error === 'object') {
        setErrors(result.error);
      } else if (errMsg.includes('username') || errMsg.includes('not found')) {
        setErrors({ username: 'Username not found. Please check and try again.' });
      } else if (errMsg.includes('password') || errMsg.includes('incorrect') || errMsg.includes('invalid')) {
        setErrors({ password: 'Incorrect password. Please try again.' });
      } else if (errMsg.includes('both') || errMsg.includes('credentials')) {
        setErrors({
          username: 'Invalid username',
          password: 'Invalid password'
        });
      } else {
        setErrors({ general: result.error || 'Login failed. Please check your credentials.' });
      }
    }

    setLoading(false);
  };

  // 🔹 Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Login to continue your learning journey</p>

        {/* General Error */}
        {errors.general && (
          <div className="form-error">
            <span>⚠️</span> {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Username Field */}
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`form-input ${errors.username ? 'input-error' : ''}`}
              placeholder="Enter your username"
              required
              disabled={loading}
            />
            {errors.username && <span className="field-error">❌ {errors.username}</span>}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${errors.password ? 'input-error' : ''}`}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="password-toggle-btn"
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <span className="field-error">❌ {errors.password}</span>}
          </div>

          {/* Forgot Password Link */}
          {/* <div className="forgot-password-link">
            <Link to="/forgot-password" className="link">
              Forgot Password?
            </Link>
          </div> */}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Logging In...' : 'Login'}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            marginTop: '2rem',
            color: 'var(--text-light)'
          }}
        >
          Don't have an account?{' '}
          <Link
            to="/register"
            style={{
              color: 'var(--primary-color)',
              fontWeight: '600',
              textDecoration: 'none'
            }}
          >
            Create an account
          </Link>
        </p>
      </div>

      {/* Inline Styles */}
      <style jsx>{`
        .password-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .form-input {
          width: 100%;
          padding-right: 40px;
        }

        .password-toggle-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-light);
          padding: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .password-toggle-btn:hover:not(:disabled) {
          color: var(--primary-color);
        }

        .password-toggle-btn:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .forgot-password-link {
          text-align: right;
          margin-top: 8px;
          margin-bottom: 20px;
        }

        .forgot-password-link .link {
          color: var(--primary-color);
          font-size: 0.9rem;
          font-weight: 500;
          text-decoration: none;
        }

        .forgot-password-link .link:hover {
          text-decoration: underline;
        }

        .input-error {
          border-color: #dc3545 !important;
          background-color: #fff5f5;
        }

        .field-error {
          display: block;
          color: #dc3545;
          font-size: 0.875rem;
          margin-top: 0.5rem;
          font-weight: 500;
        }

        .form-error {
          background-color: #ffecec;
          color: #d32f2f;
          padding: 0.75rem 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.95rem;
        }
      `}</style>
    </div>
  );
};

export default Login;
