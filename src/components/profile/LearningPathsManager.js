import React, { useState, useEffect } from 'react';
import { profileAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const LearningPathsManager = () => {
  const { profile, refreshProfile } = useAuth();
  const [learningPaths, setLearningPaths] = useState([]);
  const [primaryPath, setPrimaryPath] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLearningPaths();
  }, [profile]);

  const fetchLearningPaths = async () => {
    try {
      const response = await profileAPI.getLearningPaths();
      setLearningPaths(response.data.learning_paths);
      setPrimaryPath(response.data.primary_path);
    } catch (error) {
      console.error('Failed to fetch learning paths:', error);
    }
  };

  const setAsPrimary = async (pathId) => {
    try {
      await profileAPI.setPrimaryPath(pathId);
      await fetchLearningPaths();
      refreshProfile();
    } catch (error) {
      console.error('Failed to set primary path:', error);
    }
  };

  const getDomainIcon = (domain) => {
    const icons = {
      web: '🌐',
      mobile: '📱',
      data: '📊',
      ai: '🤖',
      cloud: '☁️',
      cyber: '🔒'
    };
    return icons[domain] || '💻';
  };

  return (
    <div style={{ background: 'var(--bg-white)', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--text-dark)' }}>Your Learning Paths</h2>
        <button 
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary"
        >
          + Add New Path
        </button>
      </div>

      {learningPaths.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-dark)' }}>No Learning Paths Yet</h3>
          <p style={{ marginBottom: '2rem' }}>Add your first learning path to get started!</p>
          <button 
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary"
          >
            Create Your First Path
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {learningPaths.map((path) => (
            <div 
              key={path.id}
              style={{
                border: `2px solid ${path.is_primary ? 'var(--primary-color)' : 'var(--border-color)'}`,
                borderRadius: '0.75rem',
                padding: '1.5rem',
                background: path.is_primary ? 'linear-gradient(135deg, #f0f4ff, #e0e7ff)' : 'var(--bg-white)',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '2rem' }}>
                    {getDomainIcon(path.domain)}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--text-dark)' }}>
                      {path.domain.charAt(0).toUpperCase() + path.domain.slice(1)} Development
                    </h4>
                    <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-light)' }}>
                      {path.language} {path.framework !== 'none' ? `+ ${path.framework}` : ''}
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                      Level: {path.skill_level}
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {!path.is_primary && (
                    <button 
                      onClick={() => setAsPrimary(path.id)}
                      className="btn btn-outline btn-sm"
                    >
                      Set as Primary
                    </button>
                  )}
                  {path.is_primary && (
                    <span style={{ 
                      background: 'var(--primary-color)', 
                      color: 'white', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      Primary
                    </span>
                  )}
                </div>
              </div>
              
              {path.learning_goals && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.875rem' }}>
                    <strong>Goals:</strong> {path.learning_goals}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <AddLearningPathForm 
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            fetchLearningPaths();
            refreshProfile();
          }}
        />
      )}
    </div>
  );
};

const AddLearningPathForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    domain: '',
    language: '',
    framework: 'none',
    skill_level: '',
    learning_goals: ''
  });
  const [loading, setLoading] = useState(false);

  const domains = [
    { value: 'web', label: '🌐 Web Development' },
    { value: 'mobile', label: '📱 Mobile Development' },
    { value: 'data', label: '📊 Data Science' },
    { value: 'ai', label: '🤖 AI & Machine Learning' },
    { value: 'cloud', label: '☁️ Cloud Computing' },
    { value: 'cyber', label: '🔒 Cybersecurity' },
  ];

  const levels = [
    { value: 'beginner', label: '🚀 Beginner' },
    { value: 'intermediate', label: '⚡ Intermediate' },
    { value: 'advanced', label: '🎯 Advanced' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await profileAPI.addLearningPath(formData);
      onSuccess();
    } catch (error) {
      console.error('Failed to add learning path:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'var(--bg-white)',
        borderRadius: '1rem',
        padding: '2rem',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ margin: 0, color: 'var(--text-dark)' }}>Add New Learning Path</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Domain</label>
            <select
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              className="form-input"
              required
            >
              <option value="">Select a domain</option>
              {domains.map(domain => (
                <option key={domain.value} value={domain.value}>
                  {domain.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Programming Language</label>
            <input
              type="text"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="form-input"
              placeholder="e.g., Python, JavaScript, Java"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Framework (Optional)</label>
            <input
              type="text"
              value={formData.framework}
              onChange={(e) => setFormData({ ...formData, framework: e.target.value })}
              className="form-input"
              placeholder="e.g., React, Django, Spring"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Skill Level</label>
            <select
              value={formData.skill_level}
              onChange={(e) => setFormData({ ...formData, skill_level: e.target.value })}
              className="form-input"
              required
            >
              <option value="">Select your level</option>
              {levels.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Learning Goals (Optional)</label>
            <textarea
              value={formData.learning_goals}
              onChange={(e) => setFormData({ ...formData, learning_goals: e.target.value })}
              className="form-input"
              placeholder="What do you want to achieve with this learning path?"
              rows="3"
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Adding...' : 'Add Learning Path'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LearningPathsManager;