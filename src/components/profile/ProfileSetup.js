import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { profileAPI } from '../../services/api';
import Step1Domain from './Step1Domain';
import Step2Language from './Step2Language';
import Step3Framework from './Step3Framework';
import Step4Level from './Step4Level';
import Loading from '../Common/Loading';

const ProfileSetup = () => {
  const { profile, updateProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await profileAPI.getProgress();
      setProgress(response.data);
      setCurrentStep(response.data.current_step);
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = (stepData) => {
    updateProfile(stepData);
    fetchProgress(); // Refresh progress
  };

  const steps = [
    { number: 1, label: 'Domain', component: Step1Domain },
    { number: 2, label: 'Language', component: Step2Language },
    { number: 3, label: 'Framework', component: Step3Framework },
    { number: 4, label: 'Level', component: Step4Level },
  ];

  if (loading) {
    return (
      <div className="main-content">
        <Loading text="Loading your profile..." />
      </div>
    );
  }

  const CurrentStepComponent = steps[currentStep - 1]?.component;

  return (
    <div className="main-content">
      <div className="progress-container">
        <div className="progress-steps">
          {steps.map((step) => {
            let stepClass = 'progress-step';
            if (currentStep > step.number) {
              stepClass += ' step-completed';
            } else if (currentStep === step.number) {
              stepClass += ' step-active';
            }

            return (
              <div key={step.number} className={stepClass}>
                <div className="step-number">
                  {currentStep > step.number ? '✓' : step.number}
                </div>
                <div className="step-label">{step.label}</div>
              </div>
            );
          })}
        </div>

        <div className="step-content">
          {CurrentStepComponent && (
            <CurrentStepComponent 
              onComplete={handleStepComplete}
              currentData={progress?.selected}
              currentStep={currentStep}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;