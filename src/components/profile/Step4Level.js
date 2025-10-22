import React, { useState, useEffect } from 'react';
import { profileAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const Step4Level = ({ onComplete, currentData, currentStep }) => {
  const [selectedLevel, setSelectedLevel] = useState(currentData?.skill_level?.value || '');
  const [learningGoals, setLearningGoals] = useState('');
  const [timeCommitment, setTimeCommitment] = useState(10);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (currentStep >= 4) {
      fetchLevelOptions();
    }
  }, [currentStep]);

  const fetchLevelOptions = async () => {
    try {
      const response = await profileAPI.getLevelOptions();
      setLevels(response.data.levels);
    } catch (error) {
      console.error('Failed to fetch levels:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedLevel) return;

    setLoading(true);
    try {
      await profileAPI.updateLevel({
        skill_level: selectedLevel,
        learning_goals: learningGoals,
        time_commitment: timeCommitment
      });

      onComplete({ 
        skill_level: selectedLevel,
        learning_goals: learningGoals,
        time_commitment: timeCommitment
      });

      // Auto refresh parent (if needed)
      window.location.reload(); // Optional: forces refresh to load dashboard data

      // Redirect to dashboard
      navigate('/dashboard');

    } catch (error) {
      console.error('Failed to update level:', error);
      alert('Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const levelDescriptions = {
    'beginner': 'Just starting out. Learn fundamentals and build first projects.',
    'intermediate': 'Some experience. Deepen knowledge and work on complex projects.',
    'advanced': 'Comfortable with coding. Master advanced concepts and best practices.'
  };

  return (
    <div className="step4-container">
      <h2 className="step-title">Almost There! Tell Us About Your Goals</h2>
      <p className="step-description">
        Help us customize your learning experience by sharing your skill level and goals.
      </p>

      {/* Skill Level Selection */}
      <div className="skill-level-section">
        <h3>What's your current skill level?</h3>
        <div className="options-grid">
          {levels.map(level => (
            <div
              key={level.value}
              className={`option-card ${selectedLevel === level.value ? 'selected' : ''}`}
              onClick={() => setSelectedLevel(level.value)}
            >
              <div className="option-title">{level.label}</div>
              <div className="option-description">{levelDescriptions[level.value]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Learning Goals */}
      <div className="learning-goals-section">
        <h3>What are your learning goals?</h3>
        <textarea
          value={learningGoals}
          onChange={(e) => setLearningGoals(e.target.value)}
          rows="4"
          className="form-input"
          placeholder="Tell us about your goals..."
        />
      </div>

      {/* Time Commitment */}
      {/* <div className="time-commitment-section">
        <h3>How many hours can you commit per week?</h3>
        <input
          type="range"
          min="5"
          max="40"
          step="5"
          value={timeCommitment}
          onChange={(e) => setTimeCommitment(parseInt(e.target.value))}
        />
        <div className="time-values">
          <span>5 hrs</span>
          <span>{timeCommitment} hrs/week</span>
          <span>40 hrs</span>
        </div>
      </div> */}
      <div className="time-commitment-section">
  <h3>How many hours can you commit per week?</h3>
  <input
    type="range"
    min="5"
    max="40"
    step="5"
    value={timeCommitment}
    onChange={(e) => setTimeCommitment(parseInt(e.target.value))}
    style={{
      width: '100%',    // full width
      height: '12px',   // thicker slider
      borderRadius: '6px',
      accentColor: '#4f46e5', // optional: slider color
      marginTop: '10px'
    }}
  />
  <div className="time-values" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
    <span>5 hrs</span>
    <span>{timeCommitment} hrs/week</span>
    <span>40 hrs</span>
  </div>
</div>

      {/* Submit Button */}
      <div className="step-actions">
        <button
          onClick={handleSubmit}
          className="btn btn-primary"
          disabled={!selectedLevel || loading}
        >
          {loading ? 'Completing Setup...' : 'Complete Setup & Generate Roadmap'}
        </button>
      </div>
    </div>
  );
};

export default Step4Level;
