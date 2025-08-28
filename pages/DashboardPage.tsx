import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { MainContent } from '../components/MainContent';
import { FirebaseUser } from '../firebase/config';

interface DashboardPageProps {
  user: FirebaseUser;
}

export type ViewType = 'my-files' | 'shared-with-me';

// This function runs only once to get initial state from URL
const getInitialStateFromURL = () => {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view') as ViewType | null;
  const folderId = params.get('folderId') || null;
  return {
    initialView: view || 'my-files',
    initialFolderId: folderId,
  };
};

export const DashboardPage = ({ user }: DashboardPageProps) => {
  // Initialize state from URL params. This runs only on the first render.
  const [{ initialView, initialFolderId: deepLinkedFolderId }] = useState(getInitialStateFromURL);
  
  const [activeView, setActiveView] = useState<ViewType>(initialView);
  // This state holds the folder ID from the URL. It's set once and then cleared
  // when the user navigates manually.
  const [initialFolderId, setInitialFolderId] = useState<string | null>(deepLinkedFolderId);

  // Clean up URL params after initial render to avoid issues on refresh
  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleViewChange = (view: ViewType) => {
    setActiveView(view);
    // When the user clicks the sidebar, clear any deep-link context.
    setInitialFolderId(null);
  };

  return (
    <div className="app-container">
        <Sidebar activeView={activeView} onViewChange={handleViewChange} />
        <div className="main-wrapper">
            <Header user={user} />
            <MainContent 
              user={user} 
              activeView={activeView} 
              initialFolderId={initialFolderId} 
            />
        </div>
    </div>
  );
};
