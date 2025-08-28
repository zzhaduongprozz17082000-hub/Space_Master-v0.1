import React, { useState } from 'react';
// FIX: Import firebase v9 compatibility module.
import firebase from 'firebase/compat/app';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { MainContent } from '../components/MainContent';

interface DashboardPageProps {
  // FIX: Update User type to firebase.User for v8 compatibility.
  user: firebase.User;
}

export type ViewType = 'my-files' | 'shared-with-me';

export const DashboardPage = ({ user }: DashboardPageProps) => {
  const [activeView, setActiveView] = useState<ViewType>('my-files');

  return (
    <div className="app-container">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <div className="main-wrapper">
            <Header user={user} />
            <MainContent user={user} activeView={activeView} />
        </div>
    </div>
  );
};
