import React, { useState, useEffect } from 'react';
import { profileAPI } from '../../services/api';

const Step3Framework = ({ onComplete, currentData, currentStep }) => {
  const [selectedFramework, setSelectedFramework] = useState(currentData?.framework?.value || 'none');
  const [frameworks, setFrameworks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentStep >= 3) {
      fetchFrameworkOptions();
    }
  }, [currentStep]);

  const fetchFrameworkOptions = async () => {
    try {
      const response = await profileAPI.getFrameworkOptions();
      setFrameworks(response.data.frameworks);
    } catch (error) {
      console.error('Failed to fetch frameworks:', error);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await profileAPI.updateFramework(selectedFramework);
      onComplete({ framework: selectedFramework });
    } catch (error) {
      console.error('Failed to update framework:', error);
    } finally {
      setLoading(false);
    }
  };

  const frameworkDescriptions = {
    'django': 'High-level Python web framework for rapid development',
    'flask': 'Lightweight Python microframework for web applications',
    'fastapi': 'Modern Python framework for building APIs with type hints',
    'pytorch': 'Python library for machine learning and deep learning',
    'tensorflow': 'End-to-end platform for machine learning',
    'pandas': 'Python data analysis and manipulation tool',
    'react': 'JavaScript library for building user interfaces',
    'vue': 'Progressive JavaScript framework for building UIs',
    'angular': 'TypeScript-based web application framework',
    'express': 'Minimal and flexible Node.js web application framework',
    'nextjs': 'React framework for production-grade applications',
    'nestjs': 'Progressive Node.js framework for efficient applications',
    'spring': 'Java framework for enterprise applications',
    'hibernate': 'Java object-relational mapping tool',
    'laravel': 'PHP web application framework with elegant syntax',
    'rails': 'Ruby web application framework following MVC pattern',
    'aspnet': 'Microsoft framework for building web apps and services',
    'flutter': 'Google\'s UI toolkit for natively compiled applications',
    'none': 'Focus on learning the programming language fundamentals first'
  };

  return (
    <div>
      <h2 className="step-title">Choose Your Framework</h2>
      <p className="step-description">
        Select a framework or library to specialize in. You can always skip this and focus on the language first.
      </p>
      
      <div className="options-grid">
        {frameworks.map((framework) => (
          <div
            key={framework.value}
            className={`option-card ${selectedFramework === framework.value ? 'selected' : ''}`}
            onClick={() => setSelectedFramework(framework.value)}
          >
            <div className="option-title" style={{ fontSize: '1.125rem' }}>
              {framework.label}
            </div>
            <div className="option-description">
              {frameworkDescriptions[framework.value] || framework.label}
            </div>
          </div>
        ))}
      </div>

      <div className="step-actions">
        <button 
          onClick={handleSubmit}
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Continue to Skill Level'}
        </button>
      </div>
    </div>
  );
};

export default Step3Framework;