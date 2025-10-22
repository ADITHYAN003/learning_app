import React, { useState, useEffect } from 'react';
import { roadmapAPI } from '../../services/api';
import Loading from '../Common/Loading';

const AddPathModal = ({ onClose, onSubmit, loading, currentProfile }) => {
  const [config, setConfig] = useState(null);
  const [formData, setFormData] = useState({
    technology_domain: '',
    programming_language: 'none',
    framework: 'none',
    skill_level: currentProfile?.skill_level || 'beginner',
    learning_goals: '',
    time_commitment: currentProfile?.time_commitment || 10
  });

  useEffect(() => {
    fetchConfiguration();
  }, []);

  const fetchConfiguration = async () => {
    try {
      const response = await roadmapAPI.getPathConfiguration();
      setConfig(response.data);
      // Set default domain if available
      if (response.data.domains.length > 0) {
        setFormData(prev => ({
          ...prev,
          technology_domain: response.data.domains[0].value
        }));
      }
    } catch (error) {
      console.error('Failed to fetch path configuration:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Reset dependent fields when domain changes
      if (field === 'technology_domain') {
        newData.programming_language = 'none';
        newData.framework = 'none';
      }
      // Reset framework when language changes
      if (field === 'programming_language') {
        newData.framework = 'none';
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.technology_domain) {
      alert('Please select a technology domain');
      return;
    }

    const result = await onSubmit(formData);
    if (result.success) {
      onClose();
    } else {
      alert(result.message);
    }
  };

  const getAvailableLanguages = () => {
    if (!config || !formData.technology_domain) return [];
    
    return config.all_languages.filter(lang => 
      lang.domains.includes(formData.technology_domain)
    );
  };

  const getAvailableFrameworks = () => {
    if (!config || formData.programming_language === 'none') return [];
    
    return config.all_frameworks.filter(fw => 
      fw.languages.includes(formData.programming_language)
    );
  };

  if (!config) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <Loading text="Loading configuration..." />
        </div>
      </div>
    );
  }

  const availableLanguages = getAvailableLanguages();
  const availableFrameworks = getAvailableFrameworks();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add New Learning Path</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Technology Domain *</label>
            <div className="options-grid">
              {config.domains.map(domain => (
                <div
                  key={domain.value}
                  className={`option-card ${formData.technology_domain === domain.value ? 'selected' : ''}`}
                  onClick={() => handleInputChange('technology_domain', domain.value)}
                >
                  <div className="option-icon">
                    {domain.label.split(' ')[0]}
                  </div>
                  <div className="option-text">
                    {domain.label.split(' ').slice(1).join(' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Programming Language</label>
            <select
              value={formData.programming_language}
              onChange={(e) => handleInputChange('programming_language', e.target.value)}
              className="form-select"
            >
              <option value="none">Select a language (optional)</option>
              {availableLanguages.map(lang => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
            {availableLanguages.length === 0 && formData.technology_domain && (
              <p className="form-help">No specific languages required for this domain</p>
            )}
          </div>

          {availableFrameworks.length > 0 && (
            <div className="form-group">
              <label className="form-label">Framework</label>
              <select
                value={formData.framework}
                onChange={(e) => handleInputChange('framework', e.target.value)}
                className="form-select"
              >
                <option value="none">Select a framework (optional)</option>
                {availableFrameworks.map(fw => (
                  <option key={fw.value} value={fw.value}>
                    {fw.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Skill Level</label>
            <div className="options-grid">
              {config.skill_levels.map(level => (
                <div
                  key={level.value}
                  className={`option-card ${formData.skill_level === level.value ? 'selected' : ''}`}
                  onClick={() => handleInputChange('skill_level', level.value)}
                >
                  <div className="option-text">
                    {level.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Learning Goals (Optional)
            </label>
            <textarea
              value={formData.learning_goals}
              onChange={(e) => handleInputChange('learning_goals', e.target.value)}
              className="form-textarea"
              placeholder="What do you want to achieve with this learning path? e.g., 'Build a web application', 'Learn machine learning basics'"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Weekly Time Commitment (hours)
            </label>
            <input
              type="number"
              min="1"
              max="40"
              value={formData.time_commitment}
              onChange={(e) => handleInputChange('time_commitment', parseInt(e.target.value))}
              className="form-input"
            />
            <p className="form-help">How many hours per week can you dedicate to learning?</p>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !formData.technology_domain}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }}></div>
                  Creating Path...
                </>
              ) : (
                'Create Learning Path'
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid var(--border-color);
        }

        .modal-title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-dark);
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--text-light);
          padding: 0;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .modal-close:hover {
          background: var(--border-color);
        }

        .modal-form {
          padding: 2rem;
        }

        .form-group {
          margin-bottom: 2rem;
        }

        .form-label {
          display: block;
          margin-bottom: 0.75rem;
          font-weight: 500;
          color: var(--text-dark);
        }

        .options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.75rem;
        }

        .option-card {
          border: 2px solid var(--border-color);
          border-radius: 8px;
          padding: 1rem;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s ease;
          background: white;
        }

        .option-card:hover {
          border-color: var(--primary-color);
          transform: translateY(-2px);
        }

        .option-card.selected {
          border-color: var(--primary-color);
          background: var(--primary-color);
          color: white;
        }

        .option-icon {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .option-text {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .form-select,
        .form-input,
        .form-textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s ease;
        }

        .form-select:focus,
        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-help {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-light);
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-color);
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: var(--primary-color);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--primary-dark);
        }

        .btn-secondary {
          background: var(--border-color);
          color: var(--text-dark);
        }

        .btn-secondary:hover:not(:disabled) {
          background: #d1d5db;
        }

        .spinner {
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AddPathModal;