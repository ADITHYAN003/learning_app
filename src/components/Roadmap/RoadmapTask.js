import React, { useState } from 'react';

const RoadmapTask = ({ task, order, onToggleComplete, onToggleResourceComplete }) => {
  const [expanded, setExpanded] = useState(false);

  const handleTaskToggle = () => {
    onToggleComplete(task.id);
  };

  const handleResourceToggle = (resourceId) => {
    onToggleResourceComplete(resourceId);
  };

  const categoryColors = {
    language: '#6366f1',
    framework: '#10b981',
    tool: '#f59e0b',
    project: '#8b5cf6',
    concept: '#ec4899',
    practice: '#06b6d4'
  };

  const formatTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <div className={`task-item ${task.completed ? 'completed' : ''}`}>
      <div className="task-header">
        <div className="task-title-container">
          <div className="task-order">Step {order}</div>
          <h3 className="task-title">{task.title}</h3>
        </div>
        <div 
          className="task-category"
          style={{ 
            backgroundColor: categoryColors[task.category] || '#6b7280',
            color: 'white'
          }}
        >
          {task.category}
        </div>
      </div>

      <p className="task-description">{task.description}</p>

      <div className="task-meta">
        <div className="task-hours">
          <span>⏱️ Estimated:</span>
          <span className="task-hours-value">{task.estimated_hours} hours</span>
        </div>
        {task.ai_generated && (
          <div className="task-hours">
            <span>🤖</span>
            <span className="task-hours-value">AI Generated</span>
          </div>
        )}
      </div>

      <div className="task-actions">
        <div className="completion-toggle" onClick={handleTaskToggle}>
          <div className={`toggle-checkbox ${task.completed ? 'checked' : ''}`}>
            {task.completed && '✓'}
          </div>
          <span className="toggle-label">
            {task.completed ? 'Completed' : 'Mark as complete'}
          </span>
        </div>

        {task.resources && task.resources.length > 0 && (
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '▲' : '▼'} Resources ({task.resources.length})
          </button>
        )}
      </div>

      {expanded && task.resources && task.resources.length > 0 && (
        <div className="resource-list">
          <h4 className="resource-title">
            📚 Learning Resources
          </h4>
          {task.resources.map((resource) => (
            <div 
              key={resource.id} 
              className={`resource-item ${resource.completed ? 'completed' : ''}`}
            >
              <div 
                className="completion-toggle"
                onClick={() => handleResourceToggle(resource.id)}
                style={{ flex: 0 }}
              >
                <div className={`toggle-checkbox ${resource.completed ? 'checked' : ''}`} style={{ width: '1rem', height: '1rem' }}>
                  {resource.completed && '✓'}
                </div>
              </div>
              
              <a 
                href={resource.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="resource-link"
              >
                {resource.title}
              </a>
              
              <div className="resource-type">
                {resource.resource_type}
              </div>
              
              <div className="resource-time">
                ⏱️ {formatTime(resource.estimated_time)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoadmapTask;