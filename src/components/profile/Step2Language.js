import React, { useState, useEffect } from 'react';
import { profileAPI } from '../../services/api';

const Step2Language = ({ onComplete, currentData, currentStep }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(currentData?.language?.value || '');
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentStep >= 2) {
      fetchLanguageOptions();
    }
  }, [currentStep]);

  const fetchLanguageOptions = async () => {
    try {
      const response = await profileAPI.getLanguageOptions();
      setLanguages(response.data.languages);
    } catch (error) {
      console.error('Failed to fetch languages:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedLanguage) return;

    setLoading(true);
    try {
      await profileAPI.updateLanguage(selectedLanguage);
      onComplete({ language: selectedLanguage });
    } catch (error) {
      console.error('Failed to update language:', error);
    } finally {
      setLoading(false);
    }
  };

  const languageDescriptions = {
    'javascript': 'Versatile language for web development, both frontend and backend',
    'python': 'Easy-to-learn language great for data science, AI, and web development',
    'java': 'Robust, object-oriented language for enterprise applications',
    'php': 'Server-side scripting language designed for web development',
    'ruby': 'Dynamic language known for its elegant syntax and Ruby on Rails framework',
    'csharp': 'Microsoft-developed language for Windows applications and games',
    'go': 'Efficient, compiled language developed by Google for system programming',
    'swift': 'Modern language for iOS and macOS app development',
    'kotlin': 'Modern language for Android development, interoperable with Java',
    'dart': 'Language for building cross-platform mobile apps with Flutter',
    'r': 'Specialized language for statistical computing and graphics',
    'sql': 'Essential language for database management and queries',
    'julia': 'High-performance language for technical computing',
    'scala': 'Functional programming language that runs on JVM',
    'cpp': 'Powerful language for system programming and game development',
    'c': 'Foundational language for system programming and embedded systems',
    'none': 'Start with programming fundamentals before choosing a language'
  };

  return (
    <div>
      <h2 className="step-title">Select Your Programming Language</h2>
      <p className="step-description">
        Choose the programming language you want to learn or improve. This will be the foundation of your learning path.
      </p>
      
      <div className="options-grid">
        {languages.map((language) => (
          <div
            key={language.value}
            className={`option-card ${selectedLanguage === language.value ? 'selected' : ''}`}
            onClick={() => setSelectedLanguage(language.value)}
          >
            <div className="option-title" style={{ fontSize: '1.125rem' }}>
              {language.label}
            </div>
            <div className="option-description">
              {languageDescriptions[language.value] || 'Learn this programming language'}
            </div>
          </div>
        ))}
      </div>

      <div className="step-actions">
        <button 
          onClick={handleSubmit}
          className="btn btn-primary"
          disabled={!selectedLanguage || loading}
        >
          {loading ? 'Saving...' : 'Continue to Framework Selection'}
        </button>
      </div>
    </div>
  );
};

export default Step2Language;