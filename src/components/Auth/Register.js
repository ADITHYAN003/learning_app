import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    const newErrors = {};

    // Validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);
    
    if (result.success) {
      navigate('/profile/setup');
    } else {
      // Parse backend errors
      if (typeof result.error === 'object') {
        // Handle array errors from backend
        const parsedErrors = {};
        Object.keys(result.error).forEach(key => {
          parsedErrors[key] = Array.isArray(result.error[key]) 
            ? result.error[key][0] 
            : result.error[key];
        });
        setErrors(parsedErrors);
      } else {
        setErrors({ general: result.error || 'Registration failed. Please try again.' });
      }
    }
    
    setLoading(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Start Your Journey</h1>
        <p className="auth-subtitle">Create your account to get personalized learning paths</p>
        
        {errors.general && (
          <div className="form-error">
            <span>⚠️</span>
            {errors.general}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`form-input ${errors.name ? 'input-error' : ''}`}
              placeholder="Enter your full name"
              required
              disabled={loading}
            />
            {errors.name && (
              <span className="field-error">❌ {errors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
            {errors.email && (
              <span className="field-error">❌ {errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`form-input ${errors.username ? 'input-error' : ''}`}
              placeholder="Choose a username"
              required
              disabled={loading}
            />
            {errors.username && (
              <span className="field-error">❌ {errors.username}</span>
            )}
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${errors.password ? 'input-error' : ''}`}
                placeholder="Create a password (min. 6 characters)"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="password-toggle-btn"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
            {errors.password && (
              <span className="field-error">❌ {errors.password}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Confirm your password"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className="password-toggle-btn"
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="field-error">❌ {errors.confirmPassword}</span>
            )}
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-light)' }}>
          Already have an account?{' '}
          <Link 
            to="/login" 
            style={{ color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none' }}
          >
            Login here
          </Link>
        </p>
      </div>

      <style jsx>{`
        .password-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .form-input {
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
      `}</style>
    </div>
  );
};

export default Register;