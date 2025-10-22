import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { roadmapAPI } from '../../services/api';
import Loading from '../Common/Loading';
import AddPathModal from './AddPathModal';
import Swal from 'sweetalert2'; // ✅ for nice confirmation dialogs

const Dashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showAddPathModal, setShowAddPathModal] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchRoadmaps();
    }
  }, [profile]);

  const fetchRoadmaps = async () => {
    try {
      const response = await roadmapAPI.list(profile.id);
      setRoadmaps(response.data);
    } catch (error) {
      console.error('Failed to fetch roadmaps:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRoadmap = async () => {
    setCreating(true);
    try {
      const response = await roadmapAPI.create(profile.id);
      setRoadmaps(prev => [response.data.roadmap, ...prev]);
      refreshProfile();
    } catch (error) {
      console.error('Failed to create roadmap:', error);
      alert('Failed to generate roadmap. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const createAdditionalPath = async (pathData) => {
    setCreating(true);
    try {
      const response = await roadmapAPI.createAdditionalPath(pathData);
      setRoadmaps(prev => [response.data.roadmap, ...prev]);
      refreshProfile();
      setShowAddPathModal(false);
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Failed to create additional path:', error);
      return { 
        success: false, 
        message: error.response?.data?.error || 'Failed to create new learning path' 
      };
    } finally {
      setCreating(false);
    }
  };

  // ✅ DELETE ROADMAP FUNCTION
  const deleteRoadmap = async (roadmapId) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: 'This roadmap and all its tasks will be permanently deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });

    if (confirm.isConfirmed) {
      try {
        await roadmapAPI.delete(roadmapId);
        setRoadmaps(prev => prev.filter(r => r.id !== roadmapId));
        Swal.fire('Deleted!', 'Your roadmap has been removed.', 'success');
      } catch (error) {
        console.error('Failed to delete roadmap:', error);
        Swal.fire('Error', 'Failed to delete the roadmap. Please try again.', 'error');
      }
    }
  };

  const calculateProgress = (roadmap) => {
    const totalTasks = roadmap.tasks?.length || 0;
    const completedTasks = roadmap.tasks?.filter(task => task.completed).length || 0;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const calculateTotalHours = (roadmap) => {
    return roadmap.tasks?.reduce((total, task) => total + task.estimated_hours, 0) || 0;
  };

  if (loading) {
    return (
      <div className="main-content">
        <Loading text="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Your Learning Dashboard</h1>
        <p className="page-subtitle">
          Welcome back! {profile?.name ? `Continue your journey, ${profile.name}!` : 'Ready to continue learning?'}
        </p>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem', 
        flexWrap: 'wrap', 
        gap: '1rem' 
      }}>
        <div>
          <h2 style={{ color: 'var(--text-dark)', marginBottom: '0.5rem' }}>Your Learning Paths</h2>
          <p style={{ color: 'var(--text-light)' }}>
            {roadmaps.length === 0 
              ? "You haven't created any learning paths yet." 
              : `You have ${roadmaps.length} learning path${roadmaps.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setShowAddPathModal(true)}
            className="btn btn-secondary"
            disabled={creating}
          >
            ➕ Add New Path
          </button>
          <button 
            onClick={createRoadmap}
            className="btn btn-primary"
            disabled={creating}
          >
            {creating ? (
              <>
                <div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }}></div>
                Generating...
              </>
            ) : (
              <>🎯 Generate Roadmap</>
            )}
          </button>
        </div>
      </div>

      {roadmaps.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3 className="empty-title">No Learning Paths Yet</h3>
          <p className="empty-description">
            Start your learning journey by creating your first AI-powered roadmap or add a new learning path 
            to explore different technologies and domains.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setShowAddPathModal(true)}
              className="btn btn-secondary"
            >
              ➕ Add New Path
            </button>
            <button 
              onClick={createRoadmap}
              className="btn btn-primary"
            >
              Create Your First Roadmap
            </button>
          </div>
        </div>
      ) : (
        <div className="roadmap-grid">
          {roadmaps.map((roadmap) => {
            const progress = calculateProgress(roadmap);
            const totalHours = calculateTotalHours(roadmap);
            const completedTasks = roadmap.tasks?.filter(task => task.completed).length || 0;
            const totalTasks = roadmap.tasks?.length || 0;

            return (
              <div key={roadmap.id} className="roadmap-card">
                <div className="roadmap-header">
                  <div>
                    <h3 className="roadmap-title">{roadmap.name}</h3>
                    <p className="roadmap-date">
                      Created {new Date(roadmap.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="roadmap-stats">
                  <div className="stat">
                    <span>📋</span>
                    <span className="stat-value">{totalTasks}</span> tasks
                  </div>
                  <div className="stat">
                    <span>⏱️</span>
                    <span className="stat-value">{totalHours}</span> hours
                  </div>
                  <div className="stat">
                    <span>✅</span>
                    <span className="stat-value">{completedTasks}</span> done
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-dark)' }}>Progress</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary-color)' }}>
                      {progress}%
                    </span>
                  </div>
                  <div style={{ 
                    width: '100%', 
                    background: 'var(--border-color)', 
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    height: '8px'
                  }}>
                    <div 
                      style={{ 
                        width: `${progress}%`,
                        background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                        height: '100%',
                        transition: 'width 0.3s ease',
                        borderRadius: '1rem'
                      }}
                    />
                  </div>
                </div>

                <p className="roadmap-description">
                  {roadmap.description}
                </p>

                <div className="roadmap-actions" style={{ display: 'flex', gap: '1rem' }}>
                  <Link 
                    to={`/roadmaps/${roadmap.id}`}
                    className="btn btn-primary"
                    style={{ flex: 1, textAlign: 'center' }}
                  >
                    View Roadmap
                  </Link>
                  <button 
                    onClick={() => deleteRoadmap(roadmap.id)}
                    className="btn btn-danger"
                    style={{ flex: 0.4 }}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddPathModal && (
        <AddPathModal
          onClose={() => setShowAddPathModal(false)}
          onSubmit={createAdditionalPath}
          loading={creating}
          currentProfile={profile}
        />
      )}
    </div>
  );
};

export default Dashboard;
