import React, { useState, useEffect } from 'react';
import { profileAPI } from '../../services/api';

const Step1Domain = ({ onComplete, currentData, currentStep }) => {
  const [selectedDomain, setSelectedDomain] = useState(currentData?.domain?.value || '');
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDomainOptions();
  }, []);

  const fetchDomainOptions = async () => {
    try {
      const response = await profileAPI.getDomainOptions();
      setDomains(response.data.domains);
    } catch (error) {
      console.error('Failed to fetch domains:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDomain) return;

    setLoading(true);
    try {
      await profileAPI.updateDomain(selectedDomain);
      onComplete({ domain: selectedDomain });
    } catch (error) {
      console.error('Failed to update domain:', error);
    } finally {
      setLoading(false);
    }
  };

  const domainDescriptions = {
    'web': 'Build websites and web applications using modern technologies',
    'mobile': 'Create iOS and Android apps with native or cross-platform tools',
    'data': 'Analyze data, build machine learning models and create insights',
    'ai': 'Develop intelligent systems and work with cutting-edge AI technologies',
    'cloud': 'Design, deploy and manage cloud infrastructure and services',
    'cyber': 'Protect systems, networks and data from digital attacks'
  };

  return (
    <div>
      <h2 className="step-title">Choose Your Technology Domain</h2>
      <p className="step-description">
        Select the area you want to focus on. This will help us create a personalized learning path for you.
      </p>
      
      <div className="options-grid">
        {domains.map((domain) => (
          <div
            key={domain.value}
            className={`option-card ${selectedDomain === domain.value ? 'selected' : ''}`}
            onClick={() => setSelectedDomain(domain.value)}
          >
            <div className="option-icon">{domain.label.split(' ')[0]}</div>
            <div className="option-title">
              {domain.label.split(' ').slice(1).join(' ')}
            </div>
            <div className="option-description">
              {domainDescriptions[domain.value] || 'Explore this technology domain'}
            </div>
          </div>
        ))}
      </div>

      <div className="step-actions">
        <button 
          onClick={handleSubmit}
          className="btn btn-primary"
          disabled={!selectedDomain || loading}
        >
          {loading ? 'Saving...' : 'Continue to Language Selection'}
        </button>
      </div>
    </div>
  );
};

export default Step1Domain;