// ================================================
// ✅ FILE: /frontend/src/components/Dashboard.jsx
// Simple Dashboard Component for Development
// ================================================

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { logInfo } from '@/utils/logging';

function Dashboard() {
  const { user, loggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    logInfo('Dashboard mounted', { user, loggedIn, path: location.pathname });
    
    // Set active tab based on current path
    if (location.pathname === '/files') {
      setActiveTab('files');
    } else if (location.pathname === '/upload') {
      setActiveTab('upload');
    } else if (location.pathname === '/storage') {
      setActiveTab('storage');
    } else {
      setActiveTab('dashboard');
    }
  }, [user, loggedIn, location.pathname]);

  const handleNavigate = (path, tab) => {
    console.log(`Navigating to: ${path}, tab: ${tab}`);
    setActiveTab(tab);
    navigate(path);
  };

  // Render different content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'files':
        return (
          <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <h2>File Manager</h2>
            <p>This is where you can manage your files.</p>
            <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'white', borderRadius: '8px' }}>
              <p>No files found. Upload some files to get started.</p>
              <button 
                onClick={() => handleNavigate('/upload', 'upload')}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Upload Files
              </button>
            </div>
          </div>
        );
      
      case 'upload':
        return (
          <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <h2>Upload Files</h2>
            <p>This is where you can upload new files.</p>
            <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'white', borderRadius: '8px' }}>
              <input 
                type="file" 
                style={{ display: 'block', marginBottom: '10px' }} 
              />
              <button 
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Upload
              </button>
            </div>
          </div>
        );
      
      case 'storage':
        return (
          <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <h2>Storage Explorer</h2>
            <p>This is where you can explore your storage.</p>
            <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'white', borderRadius: '8px' }}>
              <p>Storage locations:</p>
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                <li style={{ padding: '10px', borderBottom: '1px solid #eee' }}>Local Storage (0 GB used)</li>
                <li style={{ padding: '10px', borderBottom: '1px solid #eee' }}>S3 Storage (0 GB used)</li>
                <li style={{ padding: '10px' }}>Google Drive (Not connected)</li>
              </ul>
            </div>
          </div>
        );
      
      default:
        return (
          <>
            <h2>Quick Stats</h2>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#f0f9ff', 
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                flex: 1
              }}>
                <h3>Files</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold' }}>0</p>
              </div>
              
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#f0fdf4', 
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                flex: 1
              }}>
                <h3>Storage</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold' }}>0 GB</p>
              </div>
              
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#fef2f2', 
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                flex: 1
              }}>
                <h3>Activities</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold' }}>0</p>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Dashboard</h1>
      <p>Welcome to your dashboard!</p>
      
      {user && (
        <div className="user-info" style={{ marginTop: '20px', marginBottom: '30px' }}>
          <h2>User Information</h2>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Name:</strong> {user.name || 'User'}</p>
          <p><strong>Role:</strong> {user.role || 'User'}</p>
        </div>
      )}
      
      {/* Navigation Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '10px'
      }}>
        <button 
          onClick={() => handleNavigate('/dashboard', 'dashboard')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'dashboard' ? '#3b82f6' : '#e5e7eb',
            color: activeTab === 'dashboard' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Dashboard
        </button>
        
        <button 
          onClick={() => handleNavigate('/files', 'files')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'files' ? '#3b82f6' : '#e5e7eb',
            color: activeTab === 'files' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          File Manager
        </button>
        
        <button 
          onClick={() => handleNavigate('/upload', 'upload')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'upload' ? '#3b82f6' : '#e5e7eb',
            color: activeTab === 'upload' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Upload Files
        </button>
        
        <button 
          onClick={() => handleNavigate('/storage', 'storage')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'storage' ? '#3b82f6' : '#e5e7eb',
            color: activeTab === 'storage' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Storage Explorer
        </button>
      </div>
      
      <div className="dashboard-content" style={{ marginTop: '20px' }}>
        {renderContent()}
      </div>
    </div>
  );
}

export default Dashboard;
