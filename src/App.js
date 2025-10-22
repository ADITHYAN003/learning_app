import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/Layout/Header';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ProfileSetup from './components/profile/ProfileSetup';
import Dashboard from './components/Dashboard/Dashboard';
import RoadmapDetail from './components/Roadmap/RoadmapDetail';
import Loading from './components/Common/Loading';

function App() {
  const { isAuthenticated, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="app">
        <Loading text="Loading..." />
      </div>
    );
  }

  return (
    <div className="app">
      <Header />
      
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/register" 
          element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} 
        />
        
        {/* Protected Routes */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              profile?.step_completed === 5 ? (
                <Navigate to="/dashboard" />
              ) : (
                <Navigate to="/profile/setup" />
              )
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        
        <Route 
          path="/profile/setup" 
          element={
            isAuthenticated && profile?.step_completed !== 5 ? (
              <ProfileSetup />
            ) : isAuthenticated ? (
              <Navigate to="/dashboard" />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated && profile?.step_completed === 5 ? (
              <Dashboard />
            ) : isAuthenticated ? (
              <Navigate to="/profile/setup" />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        
        <Route 
          path="/roadmaps/:id" 
          element={
            isAuthenticated && profile?.step_completed === 5 ? (
              <RoadmapDetail />
            ) : isAuthenticated ? (
              <Navigate to="/profile/setup" />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;