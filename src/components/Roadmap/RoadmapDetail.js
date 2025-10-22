import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roadmapAPI, taskAPI, resourceAPI } from '../../services/api';
import RoadmapTask from './RoadmapTask';
import Loading from '../Common/Loading';
import './RoadmapDetail.css'; // Optional: for additional styles

const RoadmapDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, completed, pending

  useEffect(() => {
    fetchRoadmap();
  }, [id]);

  const fetchRoadmap = async () => {
    try {
      const response = await roadmapAPI.get(id);
      setRoadmap(response.data);
    } catch (error) {
      console.error('Failed to fetch roadmap:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshRoadmap = () => {
    setRefreshing(true);
    fetchRoadmap();
  };

  const toggleTaskComplete = async (taskId) => {
    try {
      await taskAPI.toggleComplete(taskId);
      refreshRoadmap();
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const toggleResourceComplete = async (resourceId) => {
    try {
      await resourceAPI.toggleComplete(resourceId);
      refreshRoadmap();
    } catch (error) {
      console.error('Failed to toggle resource:', error);
    }
  };

  const toggleTaskExpand = (taskId) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const expandAllTasks = () => {
    if (roadmap) {
      setExpandedTasks(new Set(roadmap.tasks.map(task => task.id)));
    }
  };

  const collapseAllTasks = () => {
    setExpandedTasks(new Set());
  };

  // Filter and search tasks
  const filteredTasks = roadmap?.tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'completed' && task.completed) ||
                         (filterStatus === 'pending' && !task.completed);
    
    return matchesSearch && matchesFilter;
  }) || [];

  if (loading) {
    return (
      <div className="main-content">
        <Loading text="Loading your roadmap..." />
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="main-content">
        <div className="empty-state">
          <div className="empty-icon">❌</div>
          <h3 className="empty-title">Roadmap Not Found</h3>
          <p className="empty-description">
            The roadmap you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/roadmaps')}
          >
            Browse All Roadmaps
          </button>
        </div>
      </div>
    );
  }

  const completedTasks = roadmap.tasks.filter(task => task.completed).length;
  const totalTasks = roadmap.tasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalHours = roadmap.tasks.reduce((total, task) => total + task.estimated_hours, 0);
  const completedHours = roadmap.tasks
    .filter(task => task.completed)
    .reduce((total, task) => total + task.estimated_hours, 0);

  const estimatedCompletionTime = totalHours > 0 ? 
    Math.round((totalHours - completedHours) / 8) : 0; // Assuming 8 hours per day

  return (
    <div className="main-content">
      {/* Header Section */}
      <div className="roadmap-header">
        <div className="roadmap-header-main">
          <button
            onClick={() => navigate(-1)}
            className="btn-back"
            aria-label="Go back"
          >
            <span className="btn-back-icon">←</span>
            Back
          </button>
          
          <div className="roadmap-title-section">
            <h1 className="page-title">{roadmap.name}</h1>
            <p className="roadmap-description">
              {roadmap.description}
            </p>
            
            <div className="roadmap-meta">
              <div className="meta-item">
                <span className="meta-label">Created:</span>
                <span className="meta-value">
                  {new Date(roadmap.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Total hours:</span>
                <span className="meta-value">{totalHours}h</span>
              </div>
              {estimatedCompletionTime > 0 && (
                <div className="meta-item">
                  <span className="meta-label">Est. completion:</span>
                  <span className="meta-value">
                    {estimatedCompletionTime} day{estimatedCompletionTime !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Card */}
          <div className="progress-card">
            <div className="progress-percentage-large">
              {progressPercentage}%
            </div>
            <div className="progress-label">Complete</div>
            <div className="progress-subtext">
              {completedTasks}/{totalTasks} tasks
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-header">
            <div className="progress-title">Learning Progress</div>
            <div className="progress-percentage">{progressPercentage}%</div>
          </div>
          <div className="progress-track">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercentage}%` }}
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
          <div className="progress-stats">
            <span className="stat-item">
              <strong>{completedTasks}</strong> of <strong>{totalTasks}</strong> tasks completed
            </span>
            <span className="stat-item">
              <strong>{completedHours}h</strong> of <strong>{totalHours}h</strong> completed
            </span>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="controls-section">
        <div className="controls-left">
          <h2 className="section-title">
            Learning Path
            {refreshing && (
              <span className="refreshing-indicator" aria-label="Refreshing">
                <span className="spinner"></span>
              </span>
            )}
          </h2>
          <span className="tasks-count">
            {filteredTasks.length} of {roadmap.tasks.length} tasks
          </span>
        </div>

        <div className="controls-right">
          {/* Search Input */}
          <div className="search-box">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="search-clear"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-dropdown"
          >
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>

          {/* Expand/Collapse Buttons */}
          <div className="expand-controls">
            <button
              onClick={expandAllTasks}
              className="btn-expand"
              disabled={roadmap.tasks.length === 0}
            >
              Expand All
            </button>
            <button
              onClick={collapseAllTasks}
              className="btn-collapse"
              disabled={roadmap.tasks.length === 0}
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="task-list">
        {filteredTasks.map((task, index) => (
          <RoadmapTask
            key={task.id}
            task={task}
            order={index + 1}
            isExpanded={expandedTasks.has(task.id)}
            onToggleComplete={toggleTaskComplete}
            onToggleResourceComplete={toggleResourceComplete}
            onToggleExpand={() => toggleTaskExpand(task.id)}
          />
        ))}
      </div>

      {/* Empty States */}
      {roadmap.tasks.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3 className="empty-title">No Tasks Yet</h3>
          <p className="empty-description">
            This roadmap doesn't have any tasks yet. Check back later or generate a new roadmap.
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/roadmaps/new')}
          >
            Create New Roadmap
          </button>
        </div>
      )}

      {roadmap.tasks.length > 0 && filteredTasks.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3 className="empty-title">No Tasks Found</h3>
          <p className="empty-description">
            No tasks match your current search or filter criteria.
          </p>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setSearchTerm('');
              setFilterStatus('all');
            }}
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default RoadmapDetail;